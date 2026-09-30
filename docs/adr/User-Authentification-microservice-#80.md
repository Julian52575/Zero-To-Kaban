# User Authentification microservice

- **Discussion:** [#80](https://github.com/Julian52575/Zero-To-Kanban/discussions/80)
- **Category:** Architecture Decision Records
- **Original poster:** @Julian52575
- **Opened:** 2026-09-08 11:04Z
- **Closed:** 2026-09-29 00:09Z

### Discussion

### Date

2026-09-08

### Context

Zero-To-Kaban has just been split into independent frontend, backend and db services behind a Traefik reverse proxy (refactor! in #59). The application still carries no authentication or authorization whatsoever:   

- The /items API is fully public — anyone who can reach the proxy can read, create, update and delete every item.
- There is no User model, no notion of ownership, no sessions or tokens. TodoItem is { id, name, completed }.
- The whole stack is designed to run locally via Nix + rootless podman, with one shared developer toolset.

The project's stated direction is "legacy To-Do → modern Kanban", which implies multiple users, private boards, and data owned by someone. That requires identifying users and protecting resources. A proposal has been raised to introduce login as its own deployable service ("login microservice"), consistent with the service split done in #59, rather than as a module inside the existing backend.

### Options

1. Auth module inside the existing Express backend. A /auth router in ./backend, a users table in the same Postgres database, password hashing + token issuance in-process, middleware that guards /items. No new service.
2. Dedicated in-house login microservice. A new container (./auth) that owns credentials, the users store and token issuance, exposes /auth/* via Traefik. Backend and future services validate tokens offline (stateless JWT + shared signing key / JWKS).
3. Adopt a third-party identity provider. Self-hosted (Keycloak, Ory Kratos) or SaaS (Auth0, Clerk, Supabase Auth); the app becomes an OAuth2/OIDC client and delegates login, reset, verification, social login.

### Interrogation 

- What is the real driver for a separate service — team/ownership boundaries, independent scaling, or just isolating security-sensitive code? Is "microservice" premature at this repo/team size, and would Option 1 as a stepping stone toward Option 2 be wiser?
- Stateless JWT vs. server-side sessions: where does token state live, how do we revoke, what is the refresh strategy, how do we handle clock skew between services?
- Credential handling we would own in Options 1–2: password hashing (argon2id), rate limiting / lockout, password reset, email verification. Build with vetted libraries, or inherit all of it from Option 3?
- Are social login / SSO required for the target users? Who are the target users (students, internal, public)?
- Do we want OIDC-standard compliance so future services integrate without bespoke glue?
- One shared Postgres vs. a dedicated auth datastore — blast radius, separate migrations, separate backups (note just nuke already dumps the DB).
- Operational cost of a new unit: another entry in docker-compose.yml, another Dockerfile and image build, another CI job and healthcheck, another set of secrets (JWT signing key).
- Edge enforcement: should Traefik enforce auth at the proxy (forward-auth) or should each service check tokens itself?
- Local-dev and offline story — the entire stack currently runs on a laptop with no external dependencies. A SaaS IdP breaks that unless self-hosted.
- Data-residency / licensing constraints for a SaaS provider.
- Migration path: how do existing ownerless todo_items acquire an ownerId?

### Decision

Accepted

### Justification

(draft — needs team input)

Current leaning is Option 2, scoped minimally (or Option 1 first and extracting later), because:

- The app is explicitly heading toward multi-user Kanban; auth is a cross-cutting concern every future service (boards, notifications) will depend on, so it deserves a clean seam now.
- A separate /auth service isolates credential-handling code, its dependencies and its blast radius from board logic, and matches the direction set by the #59 split.
- A full third-party IdP (Keycloak/Auth0) is capable but heavy for this stage and works against the "one shared local toolset, whole stack runs locally" principle unless self-hosted cheaply.
- Rolling our own crypto is a liability; the plan is vetted libraries only (argon2, jose/jsonwebtoken, passport), never hand-rolled primitives.

### Consequences

#### Trade-offs and risks

- New deployable unit: +1 service, Dockerfile, CI test job, healthcheck, Traefik labels, and secret management for the JWT signing key.
- Backend changes: auth middleware, /items becomes owner-scoped, TodoItem gains an ownerId, plus a one-off data migration for existing rows.
- New failure mode: if the auth service is down, login is down. Token validation can remain available if it is stateless JWT with cached JWKS.
- Owning auth means owning password-reset flows, timing-attack resistance and token revocation — accepted risk, mitigated by mature libraries and OWASP guidance.
- Distributed-systems overhead (a versioned token contract between services, shared test fixtures, clock skew) arrives earlier than a monolith would incur it.
- Frontend must add register/login views, token storage, refresh handling and global 401 handling.

#### Upside

- Clean integration point for later SSO / social login.
- Independent scaling of the auth path.
- The security-sensitive code is small, isolated and easy to audit.

### Impact size

Medium

### References

- Issue #59 — split frontend and backend (this ADR builds on that structure)
- docker-compose.yml — current proxy / db / backend / frontend topology and Traefik routing
- backend/prisma/schema.prisma — TodoItem model that would gain ownerId
- OWASP Authentication Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP Session Management Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- RFC 7519 (JWT), RFC 6749 (OAuth 2.0), OpenID Connect Core 1.0
- Keycloak — https://www.keycloak.org/ · Ory Kratos — https://www.ory.sh/kratos/
- Libraries: node-argon2, jose, passport

---
## Comments

#### @Julian52575 -- 2026-09-09 04:52Z

Update discussion for microservice audit

#### @Julian52575 -- 2026-09-09 07:17Z

A PR was openned with the microservice added: https://github.com/Julian52575/Zero-To-Kanban/pull/82

#### @Julian52575 -- 2026-09-29 00:09Z

/commit adr-catch-up

