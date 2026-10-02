# Task input validation and unified validation errors (amends #94)

- **Discussion:** [#174](https://github.com/Julian52575/Zero-To-Kanban/discussions/174)
- **Category:** Architecture Decision Records
- **Original poster:** @Julian52575
- **Opened:** 2026-09-30 19:42Z
- **Closed:** 2026-10-02 14:51Z

### Discussion

### Date

2026-09-30

### Context

Amends #94 (API Input Validation). #94 was reduced to what is on `main`: Zod middleware for project bodies and a few route parameters. The rest of the original scope is not implemented.

Missing today:

- Task endpoints (`/projects/:projectId/tasks...`) have no validation of body or parameters.
- Item, notification and invitation endpoints have no validation either.
- Body failures return `{ errors: [{ field, message }] }` while parameter failures return `{ error, details }`, so there is no single error format. This relates to #91.

### Options

- Extend the existing Zod middlewares to task, notification and invitation endpoints and converge on one 400 format.
- Validate only task endpoints for now and keep the two formats until #91 is decided.
- Leave the rest unvalidated.

### Interrogation

Which endpoints must be validated next, and in which error format should failures be returned?

### Decision

Accepted

### Branch

### Justification

To be discussed. The proposal is to reuse the #94 mechanism on task endpoints first, then on the remaining ones, using the format chosen in #91.

### Consequences -- Upside

- Uniform validation and error responses across the API.

### Consequences -- Trade-offs and risks

- Existing clients of the current 400 shapes may need updating.

### Impact size

Small -- hours

### References

- API Input Validation (#94)
- Centralized Error Handling (#91)
- Task CRUD (#88)

---
## Comments

#### @Julian52575 -- 2026-10-02 14:49Z

/commit adr-catch-up

#### @Julian52575 -- 2026-10-02 14:51Z

/commit adr-catch-up

