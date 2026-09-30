# Docker image publication

- **Discussion:** [#100](https://github.com/Julian52575/Zero-To-Kanban/discussions/100)
- **Category:** Architecture Decision Records
- **Original poster:** @Antoineweisse
- **Opened:** 2026-09-10 18:01Z
- **Closed:** 2026-09-29 00:09Z

### Discussion

### Date

10/09/2026

### Context

Running the application on a server currently requires access to the source repository and a checkout of the appropriate Git revision.

This introduces unnecessary deployment steps and couples the deployment environment to the source code repository.

A container image provides a self-contained, versioned artifact containing everything required to run the application.

The goal is therefore to automatically build and publish a Docker image whenever a new release is created.

The image will be published to the GitHub Container Registry (GHCR) and can then be pulled directly by the deployment environment.

### Options

- Build a Docker image automatically for every release and push it to GHCR :
        GitHub Release
              │
              ▼
        GitHub Actions
              │
              ├── Build Docker image
              │
              └── Push image
                      │
                      ▼
               GitHub Container Registry
                      │
                      ▼
                Deployment Server

- The server continues to clone or checkout the repository and build/run the application locally. This requires the deployment environment to have Git and the project's build dependencies available.
- Publish images to a registry such as Docker Hub or another cloud provider. This provides additional registry options but introduces another external service when GitHub already provides an integrated container registry.

### Interrogation

The main question is how to provide a reproducible deployment artifact without requiring the server to access or build the source repository.

Docker images are well suited for this because the image can contain the built application and its runtime environment.

Since the project already uses GitHub for source code and releases, GHCR provides a natural location for storing these images without introducing another registry dependency.

### Decision

Accepted

### Justification

A GitHub Actions workflow will be responsible for:

1. Detecting a new release.
2. Building the Docker image.
3. Tagging the image with the release version.
4. Publishing the image to GHCR.

For example:

Release v1.2.0
      │
      ▼
GitHub Actions
      │
      ▼
Docker Build
      │
      ▼
ghcr.io/<owner>/<repository>:1.2.0
      │
      ▼
docker pull

The deployment server will then only need Docker and access to the published image.

Release-specific tags should be used to ensure deployments are reproducible. A moving tag such as latest may additionally be published for convenience, but deployments should preferably reference an explicit version.

Publishing a container image removes the need for the server to checkout the source repository.

The deployment process becomes:

Current:

Server → Git repository → checkout → build → run


Proposed:

Server → Container Registry → pull image → run

This makes deployments simpler and more reproducible because the same built artifact can be deployed to different environments.

GHCR is also a natural choice because it is integrated with GitHub, the project's existing source-control and release workflow, avoiding the need to maintain another registry service.

### Consequences -- Upside

- Server no longer needs to checkout the repository
- Deployment becomes simpler
- Builds are performed consistently through CI
- Released versions become immutable deployment artifacts
- Same image can be deployed across environments
- Docker provides a consistent runtime environment
- GHCR integrates directly with the existing GitHub workflow
- Enables easier rollback to a previous image version

### Consequences -- Trade-offs and risks

- Requires a GitHub Actions workflow
- Docker images consume registry storage
- The deployment server requires access to GHCR
- Private images require appropriate registry authentication
- Docker image vulnerabilities must be monitored
- CI failures can prevent an image from being published
- Image versioning and cleanup policies need to be maintained

### Impact size

Small -- hours

### References

[Discussion #66](https://github.com/Julian52575/Zero-To-Kanban/discussions/66) — Original discussion regarding the deployment approach.
GitHub Releases — Trigger point for publishing release images.
GitHub Container Registry (GHCR) — Target container registry.

---
## Comments

#### @Julian52575 -- 2026-09-29 00:09Z

/commit adr-catch-up

#### @Julian52575 -- 2026-09-29 00:09Z

/commit adr-catch-up

