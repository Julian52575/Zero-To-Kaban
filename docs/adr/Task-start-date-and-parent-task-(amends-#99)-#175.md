# Task start date and parent task (amends #99)

- **Discussion:** [#175](https://github.com/Julian52575/Zero-To-Kanban/discussions/175)
- **Category:** Architecture Decision Records
- **Original poster:** @Julian52575
- **Opened:** 2026-09-30 19:42Z
- **Closed:** 2026-10-02 14:51Z

### Discussion

### Date

2026-09-30

### Context

Amends #99 (Kanban tasks). #99 was reduced to title, description and due date, which are on `main`. The remaining original scope is not implemented: the `Task` model has no `startDate` and no `parentId`.

### Options

- Add `startDate` and a self-referencing optional `parentId` directly on `Task`, with date validation (a due date must not precede the start date).
- Create a separate entity for task relationships. More flexible but more complex.
- Store the extra properties in a JSON field. Loses type safety and queryability.

### Interrogation

How should the start date and the task hierarchy be modeled, and what happens to children when a parent task is deleted?

### Decision

Accepted

### Branch

### Justification

Proposal, carried over from #99: nullable `startDate` and `parentId` on `Task`, `parentId` as a Prisma self-relation (a task without a parent is a root task), and date consistency validated at the API boundary. The behavior on parent deletion still has to be decided.

### Consequences -- Upside

- Enables planning by start date and task hierarchies.
- Foundation for the Filter Tasks ADR (#97), which uses start date, due date and parent.

### Consequences -- Trade-offs and risks

- Parent-child relations need extra queries and a defined deletion behavior.
- Deep hierarchies may need frontend handling.

### Impact size

Tiny -- minutes

### References

- Kanban tasks (#99)
- Filter Tasks (#97)
- Task CRUD (#88)

---
## Comments

#### @Julian52575 -- 2026-10-02 14:48Z

/commit adr-catch-up

#### @Julian52575 -- 2026-10-02 14:51Z

/commit adr-catch-up

