'use strict';

// Central place for env parsing. Anything REQUIRED is checked here so the
// process fails loudly on boot instead of at the first request.

function required(name) {
    const value = process.env[name];
    if (!value) {
        console.error(`auth: missing required environment variable ${name}`);
        process.exit(1);
    }
    return value;
}

function number(name, fallback) {
    const raw = process.env[name];
    if (raw === undefined || raw === '') {
        return fallback;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
        console.error(`auth: ${name} must be a number, got ${JSON.stringify(raw)}`);
        process.exit(1);
    }
    return parsed;
}

module.exports = {
    port: number('PORT', 4000),
    sessionSecret: required('SESSION_SECRET'),
    sessionTtlSeconds: number('SESSION_TTL_SECONDS', 7 * 24 * 60 * 60),
    cookieName: process.env.SESSION_COOKIE_NAME || 'session',
    cookieSecure: process.env.COOKIE_SECURE === 'true',
    // Local dev only: turns the login/register rate limits off (see
    // middleware/rateLimit.js). Anything but the exact string "true" leaves
    // them on, so a typo can never weaken production.
    rateLimitDisabled: process.env.RATE_LIMIT_DISABLED === 'true',
    verifyCacheTtlMs: number('VERIFY_CACHE_TTL_MS', 5000),
};
