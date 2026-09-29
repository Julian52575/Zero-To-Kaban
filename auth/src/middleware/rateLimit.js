'use strict';

const rateLimit = require('express-rate-limit');
const config = require('../config');

// RATE_LIMIT_DISABLED=true (local dev only) makes both limiters skip every
// request, so a load test or a scripted run isn't stopped after 10 sign-ins.
// It is read on each request. With it unset, the limiters below behave exactly
// as they do in production.
const skip = () => config.rateLimitDisabled;

// Keyed by IP (req.ip). Requires `app.set('trust proxy', ...)` upstream --
// see app.js -- otherwise every request looks like it comes from Traefik's
// container IP and one bucket is shared by all clients.

// Login: brute-forcing a password is the main risk. Generous enough for a
// person who fat-fingers their password a couple of times, tight enough to
// make guessing impractical.
const loginLimiter = rateLimit({
    skip,
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'too many attempts, please try again later' },
});

// Register: the risk is mass account creation / enumeration, not a single
// user retrying -- slightly stricter window.
const registerLimiter = rateLimit({
    skip,
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'too many attempts, please try again later' },
});

module.exports = { loginLimiter, registerLimiter };
