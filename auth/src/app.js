"use strict";

const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");

const authenticated = require("./middleware/authenticated");
const {
  loginLimiter,
  registerLimiter,
  deleteMeLimiter,
  directoryLimiter,
  profileLimiter,
} = require("./middleware/rateLimit");
const verify = require("./routes/verify");
const login = require("./routes/login");
const register = require("./routes/register");
const logout = require("./routes/logout");
const logoutAll = require("./routes/logoutAll");
const me = require("./routes/me");
const exportMe = require("./routes/exportMe");
const deleteMe = require("./routes/deleteMe");
const { lookupUsers, listUsers } = require("./routes/users");
const updateMe = require("./routes/updateMe");

const PAGES_DIR = path.join(__dirname, "pages");

function createApp() {
  const app = express();

  app.disable("x-powered-by");
  // Behind Traefik: trust exactly one hop (the proxy container) so
  // req.ip / X-Forwarded-For resolve to the real client IP -- needed for
  // express-rate-limit to key by client rather than by Traefik's IP.
  app.set("trust proxy", 1);
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  // Liveness probe -- no auth. Used by the container healthcheck and CI.
  app.get("/health", (req, res) => res.json({ status: "ok" }));

  // Internal ForwardAuth target. The `auth` Traefik router does NOT match
  // /internal, so this is only reachable from Traefik itself.
  app.get("/internal/verify", verify);
  app.post("/internal/users/lookup", lookupUsers);

  // Public auth API.
  app.post("/auth/register", registerLimiter, register);
  app.post("/auth/login", loginLimiter, login);
  app.post("/auth/logout", logout);

  // Authenticated auth API.
  app.get("/auth/me", authenticated, me);
  app.post("/auth/logout-all", authenticated, logoutAll);
  app.get("/auth/users", directoryLimiter, authenticated, listUsers);

  // Minimal server-rendered page so the entire SPA can sit behind the guard
  // -- the sign-in screen does not depend on the frontend bundle.
  app.get("/login", (req, res) =>
    res.sendFile(path.join(PAGES_DIR, "login.html")),
  );
  app.get("/register", (req, res) =>
    res.sendFile(path.join(PAGES_DIR, "register.html")),
  );
  app.get("/privacy-policy", (req, res) =>
    res.sendFile(path.join(PAGES_DIR, "privacy-policy.html")),
  );

  app.get("/auth/me/export", authenticated, exportMe);
  app.delete("/auth/me", deleteMeLimiter, authenticated, deleteMe);
  app.patch("/auth/me", profileLimiter, authenticated, updateMe);

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error("auth: unhandled error", err);
    res.status(500).json({ error: "internal error" });
  });

  return app;
}

module.exports = { createApp };
