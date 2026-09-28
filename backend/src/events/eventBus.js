const { getChannel } = require("./rabbitmq");
const { EVENT_SCHEMAS } = require("./events");
const { randomUUID: uuidv4 } = require("crypto");
const { prisma } = require("../persistence");
const { z } = require("zod");

const RETRY_DELAYS = [5000, 30000];
const eventEnvelopeSchema = z.object({
  eventId: z.string().uuid(),
  data: z.unknown(),
});
const consumers = [];

async function publishEvent(eventName, data) {
  const channel = getChannel();

  const validatedData = validateEventPayload(eventName, data);

  let validatedEventId = uuidv4();
  while (validatedEventId == "00000000-0000-0000-0000-000000000000") {
    validatedEventId = uuidv4();
  }

  const event = {
    eventId: validatedEventId,
    data: validatedData,
  };

  channel.publish("events", eventName, Buffer.from(JSON.stringify(event)), {
    persistent: true,
    contentType: "application/json",
  });
  await channel.waitForConfirms();

  console.log(
    `Published event: ${eventName} with data: ${JSON.stringify(event)}`,
  );
}

async function startConsumeFor(eventName, handler, queueName) {
  queueName ??= eventName.replace(/\./g, "-");

  consumers.push({
    eventName,
    handler,
    queueName,
  });

  await createConsumer(eventName, handler, queueName);
}

async function createConsumer(eventName, handler, queueName) {
  const channel = getChannel();

  await channel.assertQueue(queueName, { durable: true });
  await channel.bindQueue(queueName, "events", eventName);

  await assertRetryQueues(eventName, queueName);

  await channel.consume(queueName, async (msg) => {
    if (!msg) return;

    try {
      const event = JSON.parse(msg.content.toString());
      const result = eventEnvelopeSchema.safeParse(event);
      if (!result.success) {
        throw new Error(
          `Invalid event envelope for event ${eventName}: ${JSON.stringify(result.error.issues)}`,
        );
      }
      await processEvent(eventName, event, handler);
      channel.ack(msg);
    } catch (err) {
      console.error(`Error processing event ${eventName}:`, err);
      await handleRetry(eventName, queueName, msg);
    }
  });

  console.log(`Started consuming event: ${eventName} from queue: ${queueName}`);
}

async function assertRetryQueues(eventName, queueName) {
  const channel = getChannel();

  for (let i = 0; i < RETRY_DELAYS.length; i++) {
    const retryNumber = i + 1;
    const retryQueueName = `${queueName}.retry.${retryNumber}`;
    await channel.assertQueue(retryQueueName, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": "events",
        "x-dead-letter-routing-key": eventName,
        "x-message-ttl": RETRY_DELAYS[i],
      },
    });
  }
  const dlqName = `${queueName}.dlq`;
  await channel.assertQueue(dlqName, { durable: true });
}

async function handleRetry(eventName, queueName, msg) {
  const channel = getChannel();
  const headers = msg.properties.headers ?? {};
  const retryCount = Number(headers["x-retry-count"] ?? 0);

  try {
    if (retryCount < RETRY_DELAYS.length) {
      const nextRetryCount = retryCount + 1;
      const retryQueueName = `${queueName}.retry.${nextRetryCount}`;
      channel.sendToQueue(retryQueueName, msg.content, {
        headers: { ...headers, "x-retry-count": nextRetryCount },
        persistent: true,
        contentType: "application/json",
      });
      await channel.waitForConfirms();
      channel.ack(msg);
      console.log(
        `Retrying event ${eventName} in ${RETRY_DELAYS[retryCount]} ms (retry ${nextRetryCount})`,
      );
      return;
    }
    const dlqName = `${queueName}.dlq`;
    channel.sendToQueue(dlqName, msg.content, {
      headers: {
        ...headers,
        "x-retry-count": retryCount,
        "x-original-event": eventName,
        "x-dead-letter-reason": "max-retries-exceeded",
      },
      persistent: true,
      contentType: "application/json",
    });
    await channel.waitForConfirms();
    channel.ack(msg);
    console.error(
      `Event ${eventName} failed after ${retryCount} retries. Moved to DLQ: ${dlqName}`,
    );
  } catch (err) {
    console.error(`Error handling retry for event ${eventName}:`, err);
  }
}

async function processEvent(eventName, event, handler) {
  await prisma.$transaction(async (tx) => {
    const alreadyProcessed = await tx.processedEvent.findUnique({
      where: {
        eventId: event.eventId,
      },
    });

    if (alreadyProcessed) {
      console.log(
        `Event ${eventName} with eventId ${event.eventId} has already been processed. Skipping.`,
      );
      return;
    }

    const validatedData = validateEventPayload(eventName, event.data);

    await handler(validatedData, event.eventId, tx);

    await tx.processedEvent.create({
      data: {
        eventId: event.eventId,
      },
    });
  });
}

function validateEventPayload(eventName, payload) {
  const schema = EVENT_SCHEMAS[eventName];
  if (!schema) {
    throw new Error(`No schema defined for event ${eventName}`);
  }
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new Error(
      `Invalid payload for event ${eventName}: ${JSON.stringify(
        result.error.issues,
      )}`,
    );
  }
  return result.data;
}

async function restartConsumers() {
  for (const consumer of consumers) {
    await createConsumer(
      consumer.eventName,
      consumer.handler,
      consumer.queueName,
    );
  }
}

module.exports = {
  publishEvent,
  startConsumeFor,
  restartConsumers,
};
