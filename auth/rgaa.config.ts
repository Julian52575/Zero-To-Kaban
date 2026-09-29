// Not importing `defineConfig` from @kodalabs-io/eqo here: eqo is invoked via
// pinned npx (see .github/workflows/frontend-accessibility.yml), never
// installed as a project dependency, so this file can't resolve that import
// in CI. `defineConfig` is a type-only identity helper upstream
// (`(config) => config`) -- safe to skip.
export default ({
  baseUrl: "http://127.0.0.1:4000",
  projectName: "zero-to-kaban-auth",
  locale: "en-US",

  pages: [
    { path: "/login", name: "Sign in" },
    { path: "/register", name: "Register" },
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
    include: ["src/**/*.js"],
    exclude: ["**/*.test.*", "**/*.spec.*"],
  },
});
