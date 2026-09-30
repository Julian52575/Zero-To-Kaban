'use strict';

const amqp = require('amqplib');
const config = require('./config');


let connection = null;
let channel = null;
let connecting = null;

function reset() {
    channel = null;
    connection = null;
}

async function getChannel() {
    if (channel) {
        return channel;
    }
    if (!connecting) {
        connecting = (async () => {
            const conn = await amqp.connect(config.rabbitmqUrl);
            conn.on('error', (err) => console.error('auth: rabbitmq connection error', err.message));
            conn.on('close', reset);
            const ch = await conn.createConfirmChannel();
            ch.on('error', (err) => console.error('auth: rabbitmq channel error', err.message));
            ch.on('close', reset);
            // Exchange topic durable : chaque consumer y branche sa propre file.
            await ch.assertExchange(config.eventsExchange, 'topic', { durable: true });
            connection = conn;
            channel = ch;
            return ch;
        })().finally(() => {
            connecting = null;
        });
    }
    return connecting;
}

async function publish(routingKey, payload, messageId) {
    const ch = await getChannel();
    await new Promise((resolve, reject) => {
        ch.publish(
            config.eventsExchange,
            routingKey,
            Buffer.from(JSON.stringify(payload)),
            { persistent: true, contentType: 'application/json', type: routingKey, messageId },
            (err) => (err ? reject(err) : resolve()),
        );
    });
}

async function close() {
    const conn = connection;
    reset();
    if (conn) {
        await conn.close().catch(() => {});
    }
}

module.exports = { publish, close };