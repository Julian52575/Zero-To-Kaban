'use strict';

const rateLimit = require('express-rate-limit');

// Keyed by IP (req.ip). Requires `app.set('trust proxy', ...)` upstream --
// see app.js -- otherwise every request looks like it comes from Traefik's
// container IP and one bucket is shared by all clients.

// Login: brute-forcing a password is the main risk. Generous enough for a
// person who fat-fingers their password a couple of times, tight enough to
// make guessing impractical.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'too many attempts, please try again later' },
});

// Register: the risk is mass account creation / enumeration, not a single
// user retrying -- slightly stricter window.
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'too many attempts, please try again later' },
});

const deleteMeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'too many attempts, please try again later' },
});

const directoryLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'too many requests, please slow down' },
});

module.exports = { loginLimiter, registerLimiter, deleteMeLimiter, directoryLimiter };