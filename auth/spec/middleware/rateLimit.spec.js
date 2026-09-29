// Runs the real limiters behind a real express app on an ephemeral port.
// config.js reads RATE_LIMIT_DISABLED once, so each case loads fresh modules.
const express = require('express');

async function withApp(disabled, fn) {
    if (disabled === undefined) {
        delete process.env.RATE_LIMIT_DISABLED;
    } else {
        process.env.RATE_LIMIT_DISABLED = disabled;
    }
    jest.resetModules();
    const { loginLimiter, registerLimiter } = require('../../src/middleware/rateLimit');
    const app = express();
    app.post('/login', loginLimiter, (req, res) => res.sendStatus(204));
    app.post('/register', registerLimiter, (req, res) => res.sendStatus(204));
    const server = await new Promise((resolve) => {
        const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });
    const base = `http://127.0.0.1:${server.address().port}`;
    try {
        return await fn(async (path, n) => {
            const statuses = [];
            for (let i = 0; i < n; i++) {
                statuses.push((await fetch(base + path, { method: 'POST' })).status);
            }
            return statuses;
        });
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
}

afterEach(() => {
    delete process.env.RATE_LIMIT_DISABLED;
});

test('login is limited to 10 attempts by default', () =>
    withApp(undefined, async (post) => {
        const statuses = await post('/login', 12);
        expect(statuses.slice(0, 10)).toEqual(Array(10).fill(204));
        expect(statuses.slice(10)).toEqual([429, 429]);
    }));

test('register is limited to 5 attempts by default', () =>
    withApp(undefined, async (post) => {
        const statuses = await post('/register', 7);
        expect(statuses.slice(0, 5)).toEqual(Array(5).fill(204));
        expect(statuses.slice(5)).toEqual([429, 429]);
    }));

test('RATE_LIMIT_DISABLED=true lets every login and register through', () =>
    withApp('true', async (post) => {
        expect(await post('/login', 25)).toEqual(Array(25).fill(204));
        expect(await post('/register', 25)).toEqual(Array(25).fill(204));
    }));

test.each(['false', 'TRUE', '1', 'yes', ''])('RATE_LIMIT_DISABLED=%p keeps the limits on', (value) =>
    withApp(value, async (post) => {
        const statuses = await post('/login', 11);
        expect(statuses[10]).toBe(429);
    }));
