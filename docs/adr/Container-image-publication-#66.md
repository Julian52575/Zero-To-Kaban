# Container image publication

- **Discussion:** [#66](https://github.com/Julian52575/Zero-To-Kanban/discussions/66)
- **Category:** Architecture Decision Records
- **Original poster:** @Julian52575
- **Opened:** 2026-09-07 06:17Z
- **Closed:** 2026-09-30 19:58Z

### Discussion

### Date

2026-09-07

### Context

The only way to use the released application is by downloading/cloning a release tag.
Uploading a build image allows app running without accessing the source code, which enhance security on servers.

### Options

1. Keep as is
2. Build and upload a container image to GitHub Container Registry (recommended)
3. Build and upload a container image to Docker Hub

### Decision

Accepted

### Justification

GitHub Container Registry is already a part of our GH repository.

### Consequences

A workflow will run whenever a release is created.

### Impact size

Small -- hours

### References

- Issue#62 https://github.com/Julian52575/Zero-To-Kanban/issues/62

---
## Comments

#### @Julian52575 -- 2026-09-30 19:58Z

/commit adr-catch-up

