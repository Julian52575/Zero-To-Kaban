# Containerizing application

- **Discussion:** [#55](https://github.com/Julian52575/Zero-To-Kanban/discussions/55)
- **Category:** Architecture Decision Records
- **Original poster:** @Julian52575
- **Opened:** 2026-09-04 08:36Z
- **Closed:** 2026-09-30 19:57Z

### Discussion

### Date

2026-09-04

### Context

The application lacked containerization

### Options

1. Keep as is
2. Provide a Dockerfile and docker-compose

### Decision

Accepted

### Justification

- Containerization helps maintain the app.
- Reduce dev friction in getting started

### Consequences

Docker tools are provided on top of the existing application

### References

_No response_

---
## Comments

#### @Julian52575 -- 2026-09-04 09:09Z

Fixed as of b5ab4fa015860a4c9a3d5a411c9afe13158bba04

#### @Julian52575 -- 2026-09-30 19:57Z

/commit adr-catch-up

