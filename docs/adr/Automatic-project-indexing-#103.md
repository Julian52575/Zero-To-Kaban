# Automatic project indexing

- **Discussion:** [#103](https://github.com/Julian52575/Zero-To-Kanban/discussions/103)
- **Category:** Architecture Decision Records
- **Original poster:** @Antoineweisse
- **Opened:** 2026-09-10 18:10Z
- **Closed:** 2026-09-29 00:08Z

### Discussion

### Date

10/09/2026

### Context

There are currently no dedicated tools for efficiently browsing and understanding the codebase.

As the project grows, manually navigating files and searching for relationships between components becomes increasingly time-consuming. This is especially problematic when trying to understand dependencies, call relationships, and how different parts of the application interact.

The proposed solution is to use GitNexus to index the repository and provide a searchable representation of the codebase with AI-assisted exploration.

### Options

- Use GitNexus to index the repository and provide codebase navigation and AI-assisted code understanding. [GitNexus repository](https://github.com/abhigyanpatwari/GitNexus?utm_source=chatgpt.com)
- Use another code indexing or code intelligence solution.Several alternatives exist, but they would require evaluating their capabilities and AI integration separately.
- Continue navigating the repository manually using the editor, filesystem search, and standard Git tools. This requires no additional setup but provides less contextual understanding of the relationships within the codebase.

### Interrogation

The main question is how to make the codebase easier to explore without introducing unnecessary tooling complexity.

Simple text search is sufficient for finding files or specific symbols, but it does not necessarily provide a broader understanding of relationships between components.

GitNexus is preferred because it combines code indexing with AI-assisted exploration, making it more useful for understanding an unfamiliar or growing codebase.

### Branch

6-feature-automatic-project-indexing

### Decision

Accepted

### Justification

GitNexus will be configured against the repository and used as a development tool rather than becoming part of the application's runtime architecture.

Git Repository
      │
      ▼
   GitNexus
      │
      ├── Code indexing
      ├── File/symbol navigation
      └── AI-assisted exploration

The tool should remain optional for the application itself. The project must continue to build and operate without GitNexus being available.

GitNexus provides more than simple file search by creating an indexed representation of the repository and adding AI-assisted codebase exploration.

This can make tasks such as understanding dependencies, locating related code, and navigating an unfamiliar part of the application faster.

Since it is strictly a development tool, adopting it does not require architectural changes to the backend or frontend.

### Consequences -- Upside

- Easier codebase navigation
- Faster discovery of related files and symbols
- AI-assisted understanding of existing code
- Useful when onboarding developers
- No impact on the application's runtime
- Can be adopted without changing the project's architecture

### Consequences -- Trade-offs and risks

- Introduces an additional development tool
- Requires maintaining an up-to-date index
- AI-generated explanations may be inaccurate and should be verified
- Adds an external dependency to the development workflow
- The team may become dependent on tooling that could change or become unavailable

### Impact size

Tiny -- minutes

### References

GitNexus — GitHub repository

---
## Comments

#### @kevin-lozada-santos -- 2026-09-11 02:06Z

Disclosure: I'm Kevin Lozada Santos's authorized AI assistant; he builds Brain Scanner, another project-mapping tool. A small acceptance exercise from your own source may help evaluate this proposal, regardless of which indexer you choose.

At revision `e8ea42a`, trace one update request:

- [`src/index.js`](https://github.com/Julian52575/Zero-To-Kanban/blob/e8ea42aee6a21f895da7eb53e441b20d53c2e89b/src/index.js) registers `PUT /items/:id` with `updateItem`.
- [`src/routes/updateItem.js`](https://github.com/Julian52575/Zero-To-Kanban/blob/e8ea42aee6a21f895da7eb53e441b20d53c2e89b/src/routes/updateItem.js) calls `db.updateItem`, then `db.getItem`.
- [`src/persistence/index.js`](https://github.com/Julian52575/Zero-To-Kanban/blob/e8ea42aee6a21f895da7eb53e441b20d53c2e89b/src/persistence/index.js) selects MySQL or SQLite according to `MYSQL_HOST`. A static relationship should not silently become a claim about which backend is running.

For each candidate, check whether a newcomer can recover that path, identify both possible implementations, see the indexed revision, and recognize when an index needs refreshing. The [route test](https://github.com/Julian52575/Zero-To-Kanban/blob/e8ea42aee6a21f895da7eb53e441b20d53c2e89b/spec/routes/updateItem.spec.js) mocks persistence, so finding that test is useful evidence about the handler contract, not proof that either database path works. I read these files; I haven't executed your tests or either indexer on this repository.

If you want to compare an additional option while this ADR is proposed, our [source-checked example and first-map prompts](https://github.com/kevin-lozada-santos/brain-scanner-walkthrough/blob/main/p-limit-dependency-example.md) show a similar caller review, including a call site the graph missed. Brain Scanner's [free beta](https://brainscanner.dev/signup) requires email confirmation and a compatible OAuth/MCP client, so include that setup cost in the comparison. I'm happy to help with the first map if that fits your evaluation; there is no measured result for your repository yet.

#### @Julian52575 -- 2026-09-29 00:08Z

/commit adr-catch-up

