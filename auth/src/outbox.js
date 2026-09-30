"use strict";

const config = require("./config");
const { prisma } = require("./db");
const messaging = require("./messaging");

const BATCH_SIZE = 50;

async function flushOnce() {
  return prisma.$transaction(
    async (tx) => {
      const rows = await tx.$queryRaw`
                SELECT id, type, payload
                FROM outbox_events
                WHERE published_at IS NULL
                ORDER BY created_at
                LIMIT ${BATCH_SIZE}
                FOR UPDATE SKIP LOCKED`;
      for (const row of rows) {
        const envelope = {
          eventId: row.id, // utilisé par ta table processedEvent pour dédoublonner
          data: row.payload, // { userId, occurredAt }
        };
        await messaging.publish(row.type, envelope, row.id);
        await tx.outboxEvent.update({
          where: { id: row.id },
          data: { publishedAt: new Date() },
        });
      }
      return rows.length;
    },
    { timeout: 20_000 },
  );
}

// Supprime les événements déjà publiés depuis plus de N jours.
async function purgeOld() {
  const cutoff = new Date(
    Date.now() - config.outboxRetentionDays * 24 * 60 * 60 * 1000,
  );
  await prisma.outboxEvent.deleteMany({
    where: { publishedAt: { lt: cutoff } },
  });
}

// Démarre le worker, retourne une fonction d'arrêt.
function start() {
  if (!config.rabbitmqUrl) {
    console.warn(
      "auth: RabbitMQ non configuré, worker outbox désactivé (les événements restent en base)",
    );
    return () => Promise.resolve();
  }

  let stopped = false;
  let timer = null;
  let running = Promise.resolve();

  const tick = () => {
    running = (async () => {
      try {
        // Si un lot complet est traité, on enchaîne sans attendre.
        while (!stopped && (await flushOnce()) === BATCH_SIZE) {
          /* continue */
        }
      } catch (err) {
        console.error(
          "auth: outbox flush échoué, nouvel essai plus tard:",
          err.message,
        );
      }
      if (!stopped) {
        timer = setTimeout(tick, config.outboxPollMs);
      }
    })();
  };
  tick();

  const purge = setInterval(() => purgeOld().catch(() => {}), 60 * 60 * 1000);
  if (typeof purge.unref === "function") {
    purge.unref();
  }

  return async () => {
    stopped = true;
    clearTimeout(timer);
    clearInterval(purge);
    await running;
    await messaging.close();
  };
}

module.exports = { start, flushOnce };
