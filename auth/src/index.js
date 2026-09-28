'use strict';

const config = require('./config');
const db = require('./db');
const { createApp } = require('./app');
const outbox = require('./outbox');

db.init()
    .then(() => {
        const server = createApp().listen(config.port, () =>
            console.log(`auth: listening on port ${config.port}`),
        );

        const stopOutbox = outbox.start();

        const gracefulShutdown = () => {
            server.close(() => {
                stopOutbox()
                    .catch(() => {})
                    .then(() => db.teardown())
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
