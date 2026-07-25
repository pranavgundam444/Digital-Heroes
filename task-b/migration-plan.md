# Task B: Migration Plan

This plan is designed to safely modernize a live system serving real customers, strictly avoiding a "big-bang" rewrite. We focus on stabilizing security and architecture first, establishing a safety net, and then incrementally refactoring the application.

## Week 1: Security Stabilization & CI Pipeline
**Goal:** Stop the bleeding, secure credentials, and establish a baseline for safe deployments.

*   **Action 1 (Day 1): Rotate & Isolate Secrets.**
    *   *What:* Audit the repository history for all leaked credentials. Invalidate them at the source (database, third-party APIs).
    *   *How:* Introduce a `.env` file (added to `.gitignore`) and a configuration module (e.g., `config/env.ts`) to inject secrets via environment variables in production.
    *   *Why:* Immediately neutralizes the risk of the leaked credentials being exploited.
*   **Action 2 (Day 2-3): Secure the DB Surface (Stop direct frontend queries).**
    *   *What:* Identify endpoints where the frontend sends raw SQL or unvalidated logic.
    *   *How:* Replace these specific frontend calls with standard REST endpoints on the backend. Hardcode the queries securely on the backend, using parameterized queries (or an ORM) to prevent SQL injection.
    *   *Why:* Closes the most critical active vulnerability.
*   **Action 3 (Day 4-5): Introduce CI/CD and Linting.**
    *   *What:* Set up a basic GitHub Actions (or equivalent) pipeline that runs on every PR.
    *   *How:* Add ESLint/Prettier and a step that blocks deployment if secrets are detected (e.g., using `trufflehog` or `git-secrets`).
    *   *Why:* Prevents the team from re-introducing bad practices while we refactor.

## Month 1: Safety Net & Layered Architecture Foundation
**Goal:** Establish testing conventions and begin separating concerns so business logic can be tested in isolation.

*   **Action 1 (Week 2): High-Level E2E & Integration Tests.**
    *   *What:* Write API-level tests (e.g., using Supertest) covering the most critical "golden paths" (login, checkout, core user flows).
    *   *How:* Treat the bloated route handlers as black boxes. Ensure input X produces output Y and DB state Z.
    *   *Why:* We cannot refactor the bloated handlers without a safety net. E2E tests provide confidence that our refactoring isn't breaking core functionality.
*   **Action 2 (Weeks 3-4): The "Strangler Fig" Refactoring Approach.**
    *   *What:* Begin extracting business logic from route handlers into dedicated Service layers.
    *   *How:* Pick *one* low-risk feature. Extract its logic into a Service class/function. Update the route handler to simply parse the request, call the Service, and return the response. Add Unit tests for the new Service.
    *   *Why:* Proves the pattern works and establishes a template for the team to follow, without halting product development.

## Quarter 1: Complete Layering & Technical Debt Paydown
**Goal:** Achieve a fully testable, layered architecture and high test coverage.

*   **Action 1: Full Controller Refactoring.**
    *   *What:* Mandate that all new features use the Route -> Controller -> Service -> Repository pattern.
    *   *How:* Incrementally tackle the remaining legacy routes during regular sprint work (the "Boy Scout Rule": leave the code better than you found it).
*   **Action 2: ORM / Query Builder Integration.**
    *   *What:* Standardize database access.
    *   *How:* Replace raw SQL strings (even if parameterized) with a type-safe ORM (like Prisma or TypeORM) or Query Builder (Knex) inside the Repository layer.
    *   *Why:* Improves security (automatic escaping), provides type safety, and makes database schema changes manageable via migrations.
*   **Action 3: Test Coverage Gates.**
    *   *What:* Enforce minimum test coverage on new code.
    *   *How:* Update the CI pipeline to fail if a PR drops overall test coverage or if new code lacks unit tests.
    *   *Why:* Ensures the health of the codebase improves continuously over time.
