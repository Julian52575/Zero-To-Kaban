'use strict';

const db = require('../db');
const { validateUsername } = require('../validation');
const { signSession } = require('../tokens');
const { setSessionCookie } = require('../cookies');

// RGPD art. 16 (droit de rectification). PATCH /auth/me avec { username }.
//
// Le JWT de session embarque le pseudo (claim `username`) : on réémet donc le
// cookie de cette session avec le nouveau pseudo. tokenVersion ne change pas,
// les autres sessions de l'utilisateur restent valides.
module.exports = async (req, res) => {
    const parsed = validateUsername(req.body?.username);
    if (parsed.error) {
        return res.status(400).json({ error: parsed.error });
    }

    let user;
    try {
        user = await db.updateUsername(req.user.id, parsed.username);
    } catch (err) {
        if (err instanceof db.UsernameTakenError) {
            return res.status(409).json({ error: 'cet identifiant existe déjà, veuillez en choisir un autre' });
        }
        throw err;
    }
    if (!user) {
        return res.status(401).json({ error: 'session revoked' });
    }

    setSessionCookie(res, signSession(user));
    res.json({ id: user.id, username: user.username });
};