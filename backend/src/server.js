const app = require("./app");
const db = require("./persistence");
const http = require("http");
const { connectRabbitMQ, closeRabbitMQ } = require("./events/rabbitmq");
const { startConsumeFor } = require("./events/eventBus");
const { EVENTS } = require("./events/events");
const { initWebSocket, sendToUser } = require("./events/websocket");
const notificationRepository = require("./repositories/notificationRepository");

const PORT = 3000;

async function startConsumers() {
  await startConsumeFor(EVENTS.TASK_CREATED, async (data, eventId, tx) => {
    console.log(
      `Handling event: ${EVENTS.TASK_CREATED} with data: ${JSON.stringify(data)} and eventId: ${eventId}`,
    );
    const rep = await notificationRepository.create(
      {
        userId: data.creatorId,
        type: EVENTS.TASK_ASSIGNED,
        eventId,
        data,
      },
      tx,
    );
    if (!rep) {
      console.error("Failed to create notification for TASK_ASSIGNED event");
      return;
    }
    sendToUser(data.creatorId, {
      type: EVENTS.TASK_ASSIGNED,
      data: rep,
      eventId,
    });
  });
  await startConsumeFor(EVENTS.TASK_UPDATED, async (data, eventId) => {
    console.log(
      `Handling event: ${EVENTS.TASK_UPDATED} with data: ${JSON.stringify(data)} and eventId: ${eventId}`,
    );
  });
  await startConsumeFor(EVENTS.TASK_DELETED, async (data, eventId) => {
    console.log(
      `Handling event: ${EVENTS.TASK_DELETED} with data: ${JSON.stringify(data)} and eventId: ${eventId}`,
    );
  });
  await startConsumeFor(EVENTS.TASK_STATUS_UPDATED, async (data, eventId) => {
    console.log(
      `Handling event: ${EVENTS.TASK_STATUS_UPDATED} with data: ${JSON.stringify(data)} and eventId: ${eventId}`,
    );
  });
  await startConsumeFor(EVENTS.PROJECT_CREATED, async (data, eventId) => {
    console.log(
      `Handling event: ${EVENTS.PROJECT_CREATED} with data: ${JSON.stringify(data)} and eventId: ${eventId}`,
    );
  });
  await startConsumeFor(EVENTS.PROJECT_UPDATED, async (data, eventId) => {
    console.log(
      `Handling event: ${EVENTS.PROJECT_UPDATED} with data: ${JSON.stringify(data)} and eventId: ${eventId}`,
    );
  });
  await startConsumeFor(EVENTS.PROJECT_DELETED, async (data, eventId) => {
    console.log(
      `Handling event: ${EVENTS.PROJECT_DELETED} with data: ${JSON.stringify(data)} and eventId: ${eventId}`,
    );
  });

  await startConsumeFor(EVENTS.TASK_ASSIGNED, async (data, eventId) => {
    console.log(
      `Handling event: ${EVENTS.TASK_ASSIGNED} with data: ${JSON.stringify(data)} and eventId: ${eventId}`,
    );
    sendToUser(data.userId, {
      type: EVENTS.TASK_ASSIGNED,
      data,
      eventId,
    });
  });

  await startConsumeFor(EVENTS.PROJECT_INVITATION, async (data, eventId) => {
    console.log(
      `Handling event: ${EVENTS.PROJECT_INVITATION} with data: ${JSON.stringify(data)} and eventId: ${eventId}`,
    );
    sendToUser(data.userId, {
      type: EVENTS.PROJECT_INVITATION,
      data,
      eventId,
    });
  });
}

async function startServer() {
  try {
    await db.init();
    await connectRabbitMQ();
    await startConsumers();

    const server = http.createServer(app);
    initWebSocket(server);
    server.listen(PORT, () => {
      console.log(`Listening on port ${PORT}`);
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

const gracefulShutdown = async () => {
  try {
    await closeRabbitMQ();
    await db.teardown();
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
process.on("SIGUSR2", gracefulShutdown);

// Only true under `node src/server.js`: Jest pins require.main to the test
// file, so this can't run in a unit test. startServer is tested directly and
// the entrypoint is exercised by the `stack` CI job.
/* istanbul ignore next */
if (require.main === module) {
  startServer();
}

module.exports = {
  startServer,
  gracefulShutdown,
};
