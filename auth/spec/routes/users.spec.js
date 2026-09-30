const db = require('../../src/db');
const { lookupUsers, listUsers } = require('../../src/routes/users');

jest.mock('../../src/db', () => ({ findUsersByIds: jest.fn(), listUsers: jest.fn() }));

const mockRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};

const ID = '3f2b8c1e-4d5a-4e6f-8a9b-0c1d2e3f4a5b';

beforeEach(() => jest.clearAllMocks());

describe('lookupUsers', () => {
    test('400 when ids is not an array of UUIDs', async () => {
        const res = mockRes();

        await lookupUsers({ body: { ids: ['nope'] } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(db.findUsersByIds).not.toHaveBeenCalled();
    });

    test('answers [] for an empty list without hitting the db', async () => {
        const res = mockRes();

        await lookupUsers({ body: [] }, res);

        expect(res.json).toHaveBeenCalledWith([]);
        expect(db.findUsersByIds).not.toHaveBeenCalled();
    });

    test('dedupes case-insensitively and exposes only id and pseudo', async () => {
        db.findUsersByIds.mockResolvedValue([{ id: ID, username: 'ada', passwordHash: 'secret' }]);
        const res = mockRes();

        await lookupUsers({ body: { ids: [ID, ID.toUpperCase()] } }, res);

        expect(db.findUsersByIds).toHaveBeenCalledWith([ID]);
        expect(res.json).toHaveBeenCalledWith([{ id: ID, pseudo: 'ada' }]);
    });
});

describe('listUsers', () => {
    test('clamps limit and offset and trims the search term', async () => {
        db.listUsers.mockResolvedValue([]);

        await listUsers({ query: { limit: '9999', offset: '-4', q: `  ${'a'.repeat(50)}  ` } }, mockRes());

        expect(db.listUsers).toHaveBeenCalledWith({ q: 'a'.repeat(32), limit: 200, offset: 0 });
    });

    test('defaults to 100 results', async () => {
        db.listUsers.mockResolvedValue([]);

        await listUsers({ query: {} }, mockRes());

        expect(db.listUsers).toHaveBeenCalledWith({ q: '', limit: 100, offset: 0 });
    });
});
