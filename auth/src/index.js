'use strict';

const config = require('./config');
const db = require('./db');
const { createApp } = require('./app');

if (config.rateLimitDisabled) {
    console.warn('auth: WARNING rate limiting is DISABLED (RATE_LIMIT_DISABLED=true) -- local dev only, never in production');
}

db.init()
    .then(() => {
        const server = createApp().listen(config.port, () =>
            console.log(`auth: listening on port ${config.port}`),
        );

        const gracefulShutdown = () => {
            server.close(() => {
                db.teardown()
                    .catch(() => {})
                    .then(() => process.exit());
            });
        };

        process.on('SIGINT', gracefulShutdown);
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGUSR2', gracefulShutdown); // Sent by nodemon
    })
    .catch((err) => {
        console.error('auth: failed to start', err);
        process.exit(1);
    });
