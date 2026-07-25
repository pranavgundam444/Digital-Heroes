# Task B: Engineering Standards & Adoption Plan

To ensure the long-term health of the codebase, we must introduce and enforce strict engineering standards. However, standards are useless if the team rejects them. This document outlines the technical standards and the cultural adoption plan to get a resistant team on board.

## Part 1: Engineering Standards

1.  **Strict Layered Architecture**
    *   *Standard:* All new features and refactored legacy code must strictly separate HTTP concerns (Controllers), business logic (Services), and database interactions (Repositories).
    *   *Rule:* A Controller may never contain a SQL query or call a third-party API directly. It must call a Service.

2.  **Secret Management**
    *   *Standard:* No secrets in source code. Ever.
    *   *Rule:* All credentials must be injected via environment variables. The repository must contain a `.env.example` template with dummy values.

3.  **Test Coverage Gates**
    *   *Standard:* Code must be tested before it merges.
    *   *Rule:* Every new Service method requires 100% unit test coverage of its business logic branches. All new endpoints require at least one integration test covering the "happy path."

4.  **Code Review Requirements**
    *   *Standard:* No code merges without a second pair of eyes.
    *   *Rule:* All PRs require at least one approving review from a peer. PRs must pass all automated CI checks (linting, tests) before the merge button becomes active.

5.  **Linting and Formatting**
    *   *Standard:* Code must be consistently formatted to eliminate bikeshedding in code reviews.
    *   *Rule:* Prettier for formatting, ESLint for code quality (e.g., catching unused variables, enforcing strict equality).

---

## Part 2: Adoption Plan (Getting a Resistant Team on Board)

Introducing strict standards to a team used to moving fast and loose will cause friction. The key is to make doing the "right" thing easier than doing the "wrong" thing, using tooling that enforces rules automatically rather than relying on humans to nag each other.

### 1. Incremental Rollout (Don't boil the ocean)
*   **The Problem:** Implementing all rules at once will paralyze the team and cause a revolt.
*   **The Solution:** Roll out changes sequentially.
    *   *Phase 1:* Automated formatting (Prettier). It requires zero effort from developers on save.
    *   *Phase 2:* Secret scanning in CI. It only blocks them if they make a critical mistake.
    *   *Phase 3:* Mandatory code reviews.
    *   *Phase 4:* Test coverage gates on *new* code only. We explicitly do *not* require writing tests for old code unless it's being refactored.

### 2. Tooling that Enforces, Not Nags
*   **The Problem:** Relying on human discipline fails. If a reviewer has to say "please format your code" or "you forgot a test," it creates interpersonal friction.
*   **The Solution:**
    *   Set up a `pre-commit` hook (using Husky) that automatically runs Prettier and ESLint. The code literally cannot be committed if it's malformed.
    *   Configure GitHub Branch Protections to disable the "Merge" button unless the CI pipeline (which runs the tests) passes.
    *   *Psychological Benefit:* The "bad guy" is now the robot (CI pipeline), not a peer developer.

### 3. Provide "Golden Templates"
*   **The Problem:** Developers write bad code (like fat controllers) because they don't know how to set up the new pattern, or they copy-paste existing bad code.
*   **The Solution:** Create a `/examples` directory or a scaffolding script (e.g., `npm run generate:feature`) that generates a blank Controller, Service, Repository, and Unit Test file properly wired together. If the right way is the fastest way, they will use it.

### 4. Incentives and Education
*   **The Problem:** Resistance often stems from a lack of understanding of *why* the changes are necessary.
*   **The Solution:**
    *   Host a 30-minute "Tech Talk" demonstrating how much easier it is to unit test a pure Service function compared to an Express route.
    *   Celebrate the first developer who catches a critical bug using the new test suite before it hits production.
    *   Frame the changes around reducing pager fatigue: "We are doing this so we don't get paged at 2 AM on Saturday anymore."
