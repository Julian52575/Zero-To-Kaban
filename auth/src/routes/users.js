'use strict';

const db = require('../db');

const toPublic = (u) => ({ id: u.id, pseudo: u.username });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_LOOKUP_IDS = 500;
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;

async function lookupUsers(req, res) {
    const raw = Array.isArray(req.body) ? req.body : req.body?.ids;
    const valid =
        Array.isArray(raw) &&
        raw.length <= MAX_LOOKUP_IDS &&
        raw.every((id) => typeof id === 'string' && UUID_RE.test(id));
    if (!valid) {
        return res.status(400).json({ error: `ids must be an array of at most ${MAX_LOOKUP_IDS} UUIDs` });
    }
    if (raw.length === 0) {
        return res.json([]);
    }
    const unique = [...new Set(raw.map((id) => id.toLowerCase()))];
    const users = await db.findUsersByIds(unique);
    res.json(users.map(toPublic));
}

async function listUsers(req, res) {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 32) : '';
    const users = await db.listUsers({ q, limit, offset });
    res.json(users.map(toPublic));
}

module.exports = { lookupUsers, listUsers };