# Adopt Supertest for HTTP API testing

- **Discussion:** [#162](https://github.com/Julian52575/Zero-To-Kanban/discussions/162)
- **Category:** Architecture Decision Records
- **Original poster:** @EmericSomnard
- **Opened:** 2026-09-30 07:33Z
- **Closed:** 2026-09-30 09:05Z

### Discussion

### Date

2026-09-30

### Context

The TodoList → Kanban backend needs automated tests for its HTTP API.

The project contains multiple routes that will handle users, projects, tasks and Kanban resources. These endpoints need to be tested to detect regressions when controllers, services, validation or database access change.

### Interrogation

Which technology should be used to test HTTP/API endpoints?

The evaluation should consider:

- simplicity of HTTP tests;
- integration with the Node.js backend;
- support for HTTP assertions;
- TypeScript compatibility;
- dependency surface;
- security status;
- maintenance and project complexity.

### Options

- Supertest
- Native Node.js fetch
- Axios
- Playwright
- No dedicated HTTP testing library

### Decision

Accepted

### Branch

71-implement-API-input-validation

### Justification

Supertest provides a dedicated API for testing HTTP servers and applications.

It allows the test suite to send HTTP requests and assert status codes, response bodies, headers and other HTTP properties.

It can be used directly with the backend application and does not require a separate HTTP server to be manually exposed for every test.

The library is distributed under the MIT license.

The security audit performed on September 30, 2026 found no known direct vulnerabilities for the version used at the time of verification.

### Consequences -- Upside

- Simple HTTP/API tests.
- Readable test syntax.
- Easy verification of HTTP status codes.
- Easy verification of response bodies and headers.
- Good integration with Node.js applications.
- Can be used with existing JavaScript/TypeScript test frameworks.
- Helps detect API regressions automatically.

### Consequences -- Trade-offs and risks

- Adds a development dependency.
- Does not replace unit tests.
- Does not replace browser end-to-end testing.
- Does not provide application security itself.
- Tests involving the database may require an isolated test environment.
- Dependency security must continue to be monitored.

### Impact size

Small -- hours

### References

- Supertest npm package

---
## Comments

#### @Julian52575 -- 2026-09-30 07:34Z

This discussion was committed into `71-implement-API-input-validation`: [f7d476d](https://github.com/Julian52575/Zero-To-Kanban/commit/f7d476dd1b00814f88def64b0a32bd8b01fdfca0)

#### @Julian52575 -- 2026-09-30 09:05Z

/commit adr-catch-up

