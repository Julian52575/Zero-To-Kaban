# New Release Trigger Auto-Build on Server

- **Discussion:** [#102](https://github.com/Julian52575/Zero-To-Kanban/discussions/102)
- **Category:** Architecture Decision Records
- **Original poster:** @Antoineweisse
- **Opened:** 2026-09-10 18:08Z
- **Closed:** 2026-09-29 00:09Z

### Discussion

### Date

10/09/2026

### Context

A new application release currently requires a manual deployment process. After creating a release, the resulting application must be manually uploaded and started on the server.

This introduces unnecessary manual work and increases the risk of deploying the wrong version or forgetting a deployment step.

The goal is to automatically trigger the server deployment when a new release is published.

The expected workflow is:

GitHub Release
      │
      ▼
GitHub Actions
      │
      │ Webhook
      ▼
Jenkins
      │
      ▼
Kubernetes
      │
      ▼
New application version

This feature complements the Docker image publication workflow, where each release produces a versioned container image.

### Options

- GitHub Actions sends a webhook to a Jenkins instance running on the server. Jenkins then executes the deployment process and updates the Kubernetes deployment to use the new image.

GitHub
  │
  │ Release
  ▼
GitHub Actions
  │
  │ Webhook
  ▼
Jenkins
  │
  │ Deployment pipeline
  ▼
Kubernetes

- GitHub Actions connects directly to the Kubernetes cluster and performs the deployment. This removes Jenkins from the deployment chain but requires GitHub Actions to have appropriate access and credentials for the cluster.
- The server periodically checks GitHub for new releases and automatically deploys when a new version is detected.This avoids exposing a webhook endpoint but introduces polling delays and unnecessary requests.
- Continue manually uploading and running each new release. This requires no additional infrastructure but does not solve the problem of deployment automation.

### Interrogation

The main question is where the deployment logic should run.

Since the deployment environment already relies on Kubernetes and the project is expected to publish Docker images through GitHub Actions, the deployment should consume the published image rather than rebuild the application from source.

Jenkins can act as the deployment orchestrator if it is already available on the server, keeping Kubernetes credentials and deployment operations outside GitHub.

However, introducing Jenkins creates an additional component. If direct GitHub Actions access to the Kubernetes cluster is acceptable, Jenkins may not be necessary.

### Decision

Accepted

### Justification

When a new release is published:

1. GitHub Actions builds and publishes the corresponding Docker image.
2. GitHub Actions triggers a Jenkins webhook.
3. Jenkins receives the release/image version.
4. Jenkins updates the Kubernetes deployment.
5. Kubernetes pulls and starts the new image.
6. The deployment verifies that the new version is running.

Release
   │
   ▼
GitHub Actions
   │
   ├── Build Docker image
   ├── Push image to GHCR
   │
   └── Trigger Jenkins
            │
            ▼
         Jenkins
            │
            ├── Update image version
            └── kubectl / deployment
                    │
                    ▼
               Kubernetes
                    │
                    ▼
              New release

The deployment should reference the specific release image tag rather than an unversioned latest tag. This makes deployments reproducible and allows Jenkins/Kubernetes to roll back to a previous version if necessary.

The webhook must also be authenticated so that arbitrary external requests cannot trigger deployments.

Automating deployment removes the manual steps currently required after every release.

Using the Docker image published by the release workflow also creates a clean separation between building and deploying:

Build:
GitHub Actions → GHCR

Deploy:
GitHub Actions → Jenkins → Kubernetes → GHCR

This ensures that the server runs the exact artifact produced by CI rather than rebuilding the source code itself.

Jenkins is appropriate if it is already part of the server infrastructure and provides a controlled environment for Kubernetes deployment credentials.

The architecture also leaves room to replace Jenkins later with a direct GitHub Actions → Kubernetes deployment if the additional orchestration layer becomes unnecessary.

### Consequences -- Upside

- Releases can be deployed automatically
- Removes manual upload and startup steps
- Reduces deployment errors
- Uses the exact Docker image produced by CI
- Provides reproducible deployments through versioned image tags
- Kubernetes manages application rollout and restart
- Jenkins can centralize deployment credentials and logic
- Previous image versions can be redeployed for rollback
- Provides a foundation for a complete CI/CD pipeline

### Consequences -- Trade-offs and risks

- Adds Jenkins to the deployment pipeline
- Requires a secure webhook endpoint
- Jenkins and Kubernetes credentials must be protected
- A failure in GitHub Actions, Jenkins, GHCR, or Kubernetes can block deployment
- Deployment status and rollback behavior must be monitored
- Jenkins may be unnecessary if GitHub Actions can safely access Kubernetes directly
- Requires careful handling of release/image version propagation

### Impact size

Medium -- days

### References

[Docker Image Publication] — Produces the versioned Docker image consumed by the deployment pipeline.
[Discussion regarding deployment automation] — Defines the motivation and proposed Jenkins/webhook approach.
[User Login] — Unrelated to deployment but demonstrates the broader backend infrastructure being deployed.
[Restructure Backend Architecture] — Defines the backend architecture contained within the deployed application.

---
## Comments

#### @Julian52575 -- 2026-09-29 00:09Z

/commit adr-catch-up

