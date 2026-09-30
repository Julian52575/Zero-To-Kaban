'use strict';

const db = require('../db');

// RGPD art. 15 (accès) et art. 20 (portabilité) : tout ce que ce service
// détient sur l'appelant. Le hash du mot de passe est volontairement exclu
// (secret de sécurité, inutile pour l'utilisateur).
module.exports = async (req, res) => {
    const user = await db.findUserById(req.user.id);
    if (!user) {
        return res.status(401).json({ error: 'session revoked' });
    }
    res.set('Content-Disposition', 'attachment; filename="mes-donnees.json"');
    res.set('Cache-Control', 'no-store');
    res.json({
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    });
};