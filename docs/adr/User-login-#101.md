# User login

- **Discussion:** [#101](https://github.com/Julian52575/Zero-To-Kanban/discussions/101)
- **Category:** Architecture Decision Records
- **Original poster:** @Antoineweisse
- **Opened:** 2026-09-10 18:05Z
- **Closed:** 2026-09-29 00:10Z

### Discussion

### Date

10/09/2026

### Context

The current API and frontend do not provide an authentication mechanism.

As a result, the backend cannot reliably identify which user is making a request, making it impossible to securely restrict access to user-specific resources such as tasks and projects.

An authentication system is required to establish the identity of the user and provide the foundation for subsequent authorization.

The authentication flow must involve both the frontend and backend:

User
 │
 ▼
Frontend
 │
 │ credentials
 ▼
API
 │
 ▼
Authentication
 │
 ▼
Authenticated User
 │
 ▼
Authorized resources

The exact authentication mechanism is intentionally left open at this stage and should be defined before implementation.

### Options

- The server creates a session after successful login and associates it with the user. The frontend sends the session identifier with subsequent requests, typically through a secure cookie.

Login
  │
  ▼
Backend
  │
  ├── Verify credentials
  └── Create session
          │
          ▼
     Secure Cookie

- The backend issues an authentication token after successful login. The frontend then provides the token with subsequent API requests.
Login
  │
  ▼
Backend
  │
  └── Issue token
          │
          ▼
      Frontend
          │
          ▼
   Authenticated API requests

- Delegate authentication to an external provider using a protocol such as OAuth 2.0 / OpenID Connect. This reduces the amount of authentication infrastructure managed by the application but introduces an external dependency and additional configuration.

### Interrogation

The main question is which authentication mechanism should be used to securely identify users while remaining appropriate for the application's architecture.

Authentication and authorization should remain separate concerns.

Authentication answers:

Who is making this request?

Authorization answers:

Is this user allowed to access this resource?

The authentication system should therefore provide a reliable authenticated user identity to the backend, which can then be used by the authorization layer.

The final mechanism should also consider:

- Secure credential handling
- Password storage
- Session/token lifetime
- Logout and invalidation
- Protection against common authentication attacks
- Secure communication between frontend and API

### Decision

Accepted

### Justification

The implementation will establish the following flow:

Frontend
   │
   │ Login credentials
   ▼
Auth Route
   │
   ▼
Auth Controller
   │
   ▼
Auth Service
   │
   ├── Validate credentials
   ├── Retrieve user
   └── Establish authentication
   │
   ▼
Authenticated session/token

Subsequent protected requests will pass through authentication middleware:

Request
   │
   ▼
Authentication Middleware
   │
   ├── Invalid → 401 Unauthorized
   │
   ▼
Authenticated User
   │
   ▼
Controller
   │
   ▼
Service
   │
   ▼
Authorization Check
   │
   ▼
Repository

User passwords must never be stored in plaintext. They must be stored using an appropriate password-hashing algorithm.

Authentication-related logic will be isolated from task and project business logic so that existing services can rely on an authenticated user identity without implementing authentication themselves.

The final choice between sessions, tokens, or an external identity provider should be documented in a dedicated authentication decision before implementation.

uthentication is a prerequisite for securely exposing user-specific resources.

Introducing it at the backend boundary provides a single mechanism for establishing the identity of the requester. This identity can then be propagated to services responsible for authorization.

Separating authentication from authorization also keeps the architecture consistent with the existing layered backend:

HTTP
 │
 ▼
Authentication
 │
 ▼
Controller
 │
 ▼
Service
 │
 ├── Authorization
 │
 ▼
Repository
 │
 ▼
Database

This approach allows future resources such as projects and tasks to consistently enforce ownership and access rules.



### Consequences -- Upside

- Users can securely authenticate
- Backend can reliably identify requesters
- Provides the foundation for user-specific resources
- Enables proper authorization of projects and tasks
- Authentication logic is centralized
- Protected API routes become possible
- Provides a foundation for logout and account management
- Keeps authentication separate from business logic

### Consequences -- Trade-offs and risks

- Adds authentication infrastructure to both frontend and backend
- Requires secure password handling
- Introduces session/token lifecycle management
- Requires additional authentication middleware and routes
- Authentication security must be carefully tested
- Incorrect token/session handling could expose user data
- The final authentication mechanism still needs to be selected

### Impact size

Medium -- days

### References

[Discussion #80](https://github.com/Julian52575/Zero-To-Kanban/discussions/80) — Original discussion regarding user authentication.
[User Authorization] — Defines how authenticated users are authorized to access projects and tasks.
[New Database Schema] — Defines the User entity required for authentication.
[Restructure Backend Architecture] — Defines the Routes → Controllers → Services → Repositories architecture used by the authentication system.
[Centralized Error Handling] — Defines consistent handling of authentication and API errors.

---
## Comments

#### @Julian52575 -- 2026-09-14 15:31Z

See #80 for the microservices

#### @Julian52575 -- 2026-09-14 15:34Z

Also, we need to keep support for the no-user-associated tasks that were created on 1.0.0 and 2.0.0.

I propose the following:
All of these tasks will be available under a "legacy" tab in the application, every logged in user can access them and "adopt" them so they move from the "legacy" tab to the user's kanban

> **@Antoineweisse** -- 2026-09-14 19:22Z
>
> I think it's a good idea to do something along those lines, or perhaps when creating a project we could use them for templates, but having the inherited aspect remains a valid option.

#### @Julian52575 -- 2026-09-29 00:08Z

/commit adr-catch-up

#### @Julian52575 -- 2026-09-29 00:10Z

/commit adr-catch-up

