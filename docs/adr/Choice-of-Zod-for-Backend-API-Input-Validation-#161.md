# Choice of Zod for Backend API Input Validation

- **Discussion:** [#161](https://github.com/Julian52575/Zero-To-Kanban/discussions/161)
- **Category:** Architecture Decision Records
- **Original poster:** @EmericSomnard
- **Opened:** 2026-09-30 07:23Z
- **Closed:** 2026-09-30 07:25Z

### Discussion

### Date

2026-09-30

### Context

The current backend does not have a dedicated HTTP input validation layer. The migration documentation explicitly identifies this issue and plans to introduce validation middleware around the routes.

This validation becomes particularly important with the future implementation of user, project, task, and Kanban endpoints.

### Interrogation

Which solution should be used to implement a common validation layer for incoming API data while maintaining good TypeScript integration, reusable schemas, and a minimal dependency surface?

### Options

- Zod — Runtime validation with excellent TypeScript integration and 0 direct production dependencies.
- Joi — Runtime validation with good TypeScript support; dependencies need to be checked.
- Yup — Runtime validation with good TypeScript support; dependencies need to be checked.
- Ajv — JSON Schema-based validation with a large ecosystem.
- express-validator — Express-oriented validation solution with several components.
- No validation library — Manual validation implemented in each endpoint.

### Decision

Accepted

### Branch

71-implement-API-input-validation

### Justification

Zod allows the project to define reusable schemas, reject invalid data at the API boundary, and infer TypeScript types from the same schemas.

The choice is also justified by its minimal dependency surface. Zod 4.5.4 declares 0 direct production dependencies.

Zod combines runtime validation, concise schemas, TypeScript integration, reusability, and a minimal runtime dependency surface.

### Consequences -- Upside

- Centralized validation at the API boundary.
- Reusable schemas across endpoints.
- Good TypeScript integration.
- Reduced duplication of validation checks.
- Invalid data is rejected before reaching services and repositories.
- Minimal runtime dependency surface.
- TypeScript types can be inferred directly from validation schemas.

### Consequences -- Trade-offs and risks

- Zod does not replace authentication or authorization.
- Zod does not replace database constraints or data integrity checks.
- Overly permissive validation may allow unwanted data to pass through.
- Zod does not replace rate limiting, request size limits, logging, or testing.
- API errors must remain generic and must not expose internal information.
- Security must continue to rely on multiple complementary layers.

### Impact size

Small -- hours

### References

- Zod Security Choice and Audit — Technical Documentation
- Installation: npm install zod
- Target architecture: Routes → Controllers → Services → Repositories → Prisma → Database

---
## Comments

_No comments._

