'use strict';

const bcrypt = require('bcryptjs');
const db = require('../db');
const { clearSessionCookie } = require('../cookies');
const { primeTokenVersion } = require('../revocation');

// RGPD art. 17 (droit à l'effacement). DELETE /auth/me avec { password }.
// Le mot de passe est redemandé : un cookie volé ne doit pas suffire à
// supprimer un compte de façon irréversible.
// Mauvais mot de passe => 403 (pas 401) : le SPA traite 401 comme "session
// expirée" et redirigerait vers /login au lieu d'afficher l'erreur.
module.exports = async (req, res) => {
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!password) {
        return res.status(400).json({ error: 'Password required to delete account' });
    }

    const user = await db.findUserById(req.user.id);
    if (!user) {
        return res.status(401).json({ error: 'User not found' });
    }
    if (!(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(403).json({ error: 'Password incorrect' });
    }

    await db.deleteUser(user.id);

    // Version null = "utilisateur inconnu" pour /internal/verify : la session
    // est coupée tout de suite sur cette réplique.
    primeTokenVersion(user.id, null);
    clearSessionCookie(res);
    res.sendStatus(204);
};