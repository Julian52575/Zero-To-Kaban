"use strict";

// Central place for env parsing. Anything REQUIRED is checked here so the
// process fails loudly on boot instead of at the first request.

function required(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`auth: missing required environment variable ${name}`);
    process.exit(1);
  }
  return value;
}

function number(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    console.error(`auth: ${name} must be a number, got ${JSON.stringify(raw)}`);
    process.exit(1);
  }
  return parsed;
}

function rabbitmqUrl() {
  if (process.env.RABBITMQ_URL) {
    return process.env.RABBITMQ_URL;
  }
  const user = process.env.RABBITMQ_USER;
  const password = process.env.RABBITMQ_PASSWORD;
  if (!user || !password) {
    return null;
  }
  const host = process.env.RABBITMQ_HOST || "rabbitmq";
  const port = process.env.RABBITMQ_PORT || "5672";
  return `amqp://${user}:${password}@${host}:${port}`;
}

module.exports = {
  port: number("PORT", 4000),
  sessionSecret: required("SESSION_SECRET"),
  sessionTtlSeconds: number("SESSION_TTL_SECONDS", 7 * 24 * 60 * 60),
  cookieName: process.env.SESSION_COOKIE_NAME || "session",
  cookieSecure: process.env.COOKIE_SECURE === "true",
  verifyCacheTtlMs: number("VERIFY_CACHE_TTL_MS", 5000),
  rabbitmqUrl: rabbitmqUrl(),
  eventsExchange: process.env.EVENTS_EXCHANGE || "events",
  outboxPollMs: number("OUTBOX_POLL_MS", 2000),
  outboxRetentionDays: number("OUTBOX_RETENTION_DAYS", 7),
    // Local dev only. Anything but the exact string "true" keeps the limits on.
    rateLimitDisabled: process.env.RATE_LIMIT_DISABLED === 'true',
};
