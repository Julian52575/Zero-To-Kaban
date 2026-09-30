const { createApp } = require('../src/app');

jest.mock('../src/db', () => ({
    findUsersByIds: jest.fn().mockResolvedValue([]),
    listUsers: jest.fn().mockResolvedValue([]),
}));

let server;
let baseUrl;

beforeAll(async () => {
    server = createApp().listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

const call = (method, path) => fetch(`${baseUrl}${path}`, { method, redirect: 'manual' });

describe('public routes', () => {
    test('GET /health answers without authentication', async () => {
        const res = await call('GET', '/health');

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ status: 'ok' });
    });

    test.each(['/login', '/register', '/privacy-policy'])('GET %s serves an HTML page', async (path) => {
        const res = await call('GET', path);

        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toMatch(/text\/html/);
    });

    test('POST /auth/logout clears the session without authentication', async () => {
        const res = await call('POST', '/auth/logout');

        expect(res.status).toBe(204);
    });
});

describe('authenticated routes reject requests without a session', () => {
    test.each([
        ['GET', '/auth/me'],
        ['GET', '/auth/users'],
        ['GET', '/auth/me/export'],
        ['POST', '/auth/logout-all'],
        ['PATCH', '/auth/me'],
        ['DELETE', '/auth/me'],
    ])('%s %s -> 401', async (method, path) => {
        const res = await call(method, path);

        expect(res.status).toBe(401);
        expect(await res.json()).toEqual({ error: 'not authenticated' });
    });
});

describe('internal routes', () => {
    test('GET /internal/verify does not let an anonymous request through', async () => {
        const res = await call('GET', '/internal/verify');

        expect(res.status).not.toBe(200);
    });

    test('POST /internal/users/lookup validates its body', async () => {
        const res = await fetch(`${baseUrl}/internal/users/lookup`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ids: ['not-a-uuid'] }),
        });

        expect(res.status).toBe(400);
    });
});

test('unknown routes are 404', async () => {
    const res = await call('GET', '/terms-of-use');

    expect(res.status).toBe(404);
});
