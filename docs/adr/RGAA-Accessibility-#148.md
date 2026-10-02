# RGAA Accessibility

- **Discussion:** [#148](https://github.com/Julian52575/Zero-To-Kanban/discussions/148)
- **Category:** Architecture Decision Records
- **Original poster:** @Julian52575
- **Opened:** 2026-09-28 12:00Z
- **Closed:** 2026-10-02 14:43Z

### Discussion

### Date

2026-09-28

### Context

French laws requires all public websites to be RGAA compliant in these manners:

1. Scope:
Welcome page, contact, legal mentions, **accessibility declaration**, site map, help, authentication PLUS 1 page per service, 1 downloable document, all pages for a processus, distinctly-visual or different content page (tables, images, illustrations being examples given) PLUS randomly chosen page making up 10% of the sample.

All of that should be tested in a well-defined test environment.

2. Validation

Validation is a conformity %tage among all 106 criteria, ie 42/106.
Every page from the sample must pass a test to validate it. 

3. Declaration

Written on an accessibility page. This page should have an online form for users to submit reclamations.
All reclamations must be, at least partially-answered, in 1 week with possible follow up answers.

The declaration must follow the format at https://accessibilite.numerique.gouv.fr/obligations/declaration-accessibilite/ (ctrl-f "La déclaration d’accessibilité adopte obligatoirement ce format :")

### Interrogation

- Does a automated RGAA test workflow exists ?
- Does another norm's automated test workflow exists and can be applied here?
Other norms include a11y 

### Options

1. Apply the RGAA recommandation and verify manually every 3 years
2. Apply the RGAA and verify semi-automatically using both `lighthouse` and `eqo` workflows 
3. Be outlawed

Tools:
- https://github.com/kodalabs-io/eqo; 
Newer, smaller project
- [Asqatasun](https://doc.asqatasun.org/v6/Operator/Installation/Regular/Start-Asqatasun/)
badly documentated, struggled to get it running, tailored for manual review due to UI.
- [Chrome lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci/)
Known, big named, widely used project adapted for CI

### Decision

Accepted

### Branch

153-feature-accessibility-tests-workflow

### Justification

We will use Chrome Lighthouse for smoke and regression testing.
The eqo workflow will also be adopted, but its lack of maturity + the theme requiring manual testing means the team will use it as a template and doc generator.

A single workflow will be dedicated to acc' auditing, it will either run on PRs for checking or on dispatch to write a document.

See https://github.com/Julian52575/Zero-To-Kanban/actions/runs/36448565678?pr=154 for tests

### Consequences -- Upside

Regression are caught.
Eqo provides a markdown template to follow.

### Consequences -- Trade-offs and risks

Eqo might become unmaintained and will be dropped

### Impact size

Medium

### References

_No response_

---
## Comments

#### @Julian52575 -- 2026-09-28 21:48Z

This discussion was committed into `153-feature-accessibility-tests-workflow`: [a52ba73](https://github.com/Julian52575/Zero-To-Kanban/commit/a52ba73f10561572baa41f3efbc125530c7ad884)

#### @Julian52575 -- 2026-10-02 14:43Z

/commit adr-catch-up

