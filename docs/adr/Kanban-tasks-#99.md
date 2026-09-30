# Kanban tasks

- **Discussion:** [#99](https://github.com/Julian52575/Zero-To-Kanban/discussions/99)
- **Category:** Architecture Decision Records
- **Original poster:** @Antoineweisse
- **Opened:** 2026-09-10 17:58Z
- **Closed:** 2026-09-30 19:44Z

### Discussion

### Date

10/09/2026

### Context

The original Task model was limited to a title and a completion checkbox, which is not enough to represent tasks in a Kanban application.

This ADR covers the task properties present on `main`: title, description and due date. The start date, the parent task relation and date-consistency validation are not implemented and moved to the amending ADR "Task start date and parent task (amends #99)".

### Options

- Add the required fields directly to the existing Task entity. This keeps the model simple.
- Create separate entities for descriptions, dates and relationships. More flexible but needlessly complex.
- Store additional task properties in a JSON field. Flexible but loses type safety, constraints and queryability.

### Interrogation

How much information should be included in the base Task model?

### Decision

Accepted

### Branch

adr-catch-up

### Justification

The requested properties are fundamental task attributes, so they are explicit columns on the relational `Task` model (`backend/prisma/schema.prisma`):

Task
├── id
├── title (required)
├── description (optional)
└── dueDate (optional)

Other columns present on the model (`order`, `priority`, column, creator, assignee) come from other decisions and are out of scope here. Keeping the fields on the entity gives simple queries, strong typing and straightforward CRUD.

### Consequences -- Upside

- Tasks carry enough information for Kanban usage, with more context than a checkbox.
- Data stays strongly typed and queryable.
- Integrates directly with the existing Task CRUD.

### Consequences -- Trade-offs and risks

- The Task model is more complex than the original todo model.
- No start date, so planning and date-range filtering are not possible yet.

### Impact size

Tiny -- minutes

### References

- Task CRUD (#88)
- Design and Implement New Database Schema (#95)
- Task start date and parent task (amends #99)

---
## Comments

#### @Julian52575 -- 2026-09-24 12:43Z

Please set Decision to Accepted and close with comment: "/commit 43-61-merge-frontback"

#### @Antoineweisse -- 2026-09-24 12:47Z

/commit 43-61-merge-frontback

#### @Julian52575 -- 2026-09-24 12:49Z

/commit 43-61-merge-frontback

#### @Julian52575 -- 2026-09-24 12:49Z

This discussion was committed into `43-61-merge-frontback`: [4c7ec18](https://github.com/Julian52575/Zero-To-Kanban/commit/4c7ec188037750b9ad00fd1c872795dce0c953c5)

#### @Julian52575 -- 2026-09-24 17:05Z

Reopened as work still need to be done on it

#### @Julian52575 -- 2026-09-30 19:44Z

/commit adr-catch-up

