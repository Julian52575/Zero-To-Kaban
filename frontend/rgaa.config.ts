// Not importing `defineConfig` from @kodalabs-io/eqo here: eqo is invoked via
// pinned npx (see .github/workflows/frontend-and-auth-accessibility.yml),
// never installed as a project dependency, so this
// file can't resolve that import in CI. `defineConfig` is a type-only
// identity helper upstream (`(config) => config`) -- safe to skip.
export default ({
  baseUrl: "http://127.0.0.1:4173",
  projectName: "zero-to-kaban-frontend",
  locale: "en-US",

  // Every route in src/App.tsx. /projects/:projectId needs a concrete id --
  // eqo requires a static path, and the id itself is irrelevant to the
  // rendered accessibility tree (the board renders the same whether the
  // project/task fetch behind it succeeds or fails).
  pages: [
    { path: "/", name: "Home" },
    { path: "/projects/1", name: "Kanban board" },
    { path: "/accessibility", name: "Accessibility declaration" },
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
