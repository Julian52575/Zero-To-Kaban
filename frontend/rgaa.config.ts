// Not importing `defineConfig` from @kodalabs-io/eqo here: eqo is invoked via
// pinned npx (see .github/workflows/frontend-and-auth-accessibility.yml),
// never installed as a project dependency, so this
// file can't resolve that import in CI. `defineConfig` is a type-only
// identity helper upstream (`(config) => config`) -- safe to skip.
export default ({
  baseUrl: "http://127.0.0.1:4173",
  projectName: "zero-to-kaban-frontend",
  locale: "en-US",

  // Every route in src/App.tsx. /projects/:projectId points at the fixed id
  // backend/prisma/seed.js seeds a real board under (see
  // .github/workflows/frontend-and-auth-accessibility.yml) -- auditing real
  // columns/tasks instead of the empty/error state an unseeded backend, or
  // no backend at all, would render.
  pages: [
    { path: "/", name: "Home" },
    { path: "/projects/a11y-test-project", name: "Kanban board" },
    { path: "/accessibility", name: "Accessibility declaration" },
    { path: "/terms-of-use", name: "Terms of use" },
    { path: "/privacy", name: "Privacy policy" },
    { path: "/legal", name: "Legal notice" },
  ],

  output: [
    { format: "json", path: "./rgaa-reports/rgaa-report.json", minify: false },
    { format: "html", path: "./rgaa-reports/rgaa.html" },
    { format: "sarif", path: "./rgaa-reports/rgaa.sarif" },
    { format: "markdown", path: "./rgaa-reports/rgaa.md" },
  ],

  thresholds: {
    // 0 disables CI blocking; the actual gate is passed on the CLI
    // (`--threshold 100`) so it stays visible in the workflow file.
    complianceRate: 0,
    failOn: "threshold",
  },

  exemptions: [],

  static: {
    include: ["src/**/*.{tsx,jsx,ts,js}"],
    exclude: ["**/*.test.*", "**/*.spec.*"],
  },
});
