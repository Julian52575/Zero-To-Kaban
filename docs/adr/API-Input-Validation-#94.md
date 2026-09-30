# API Input Validation

- **Discussion:** [#94](https://github.com/Julian52575/Zero-To-Kanban/discussions/94)
- **Category:** Architecture Decision Records
- **Original poster:** @Antoineweisse
- **Opened:** 2026-09-10 17:36Z
- **Closed:** 2026-09-30 19:44Z

### Discussion

### Date

10/09/2026

### Context

The backend did not validate incoming API requests before they reached the business and persistence layers. Invalid data could propagate and cause runtime errors or invalid database operations, and validating inside each controller would duplicate logic.

This ADR covers the validation mechanism and the endpoints that use it today: project creation and update bodies, and the route parameters of the user-projects and project-collaborators lookups. Validation of task endpoints and a unified error format are left to the amending ADR "Task input validation and unified validation errors (amends #94)".

### Options

- Zod validation middleware — Reusable Zod schemas validated by Express middleware before the controllers.
- Validation inside controllers — Straightforward for a few endpoints, but duplicated and inconsistent.
- Database-level validation — Prisma and database constraints reject invalid data too late and give no API-level errors.
- Alternative validation library — Similar functionality without a clear benefit over Zod.

### Interrogation

How should API input be validated consistently while keeping validation logic reusable and separate from business and persistence logic?

### Decision

Accepted

### Branch

adr-catch-up

### Justification

Zod defines the schemas (`backend/src/schemas`) and small Express middlewares (`backend/src/middlewares`) run them before the controller:

Request → Zod validation middleware → Controller → Service → Repository → Prisma

Currently validated:

- `POST /projects` and `PUT`/`PATCH /projects/:id`: body, with `name` trimmed and 2 to 100 characters. The create schema is strict; the update schema is not, because clients send the stored project back.
- `GET /projects` by user and `GET /projects/:id/collaborators`: route parameters must be UUIDs.

On failure the middleware answers `400 Bad Request` and replaces `req.body` or `req.params` with the parsed data.

### Consequences -- Upside

- Invalid project input never reaches the service or persistence layers.
- Schemas are reusable and keep controllers free of validation code.
- Type-safe validation with explicit API requirements.

### Consequences -- Trade-offs and risks

- Coverage is partial: task, item, notification and invitation endpoints are not validated.
- The two 400 response shapes differ (`{ errors: [{ field, message }] }` for bodies, `{ error, details }` for parameters).
- Schemas must be maintained when API contracts change, and may overlap with Prisma constraints.

### Impact size

Small -- hours

### References

- Zod validation
- Choice of Zod for Backend API Input Validation (#161)
- Centralized Error Handling (#91)
- Project CRUD (#89)

---
## Comments

#### @Julian52575 -- 2026-09-30 19:43Z

/commit adr-catch-up

