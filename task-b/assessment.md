# Task B: Codebase Assessment & Prioritized Risk Analysis

Based on the audit of the inherited codebase, here are the critical issues found, prioritized by their risk to the business (confidentiality, integrity, availability, and maintainability).

## 1. Secrets Committed to Repository (CRITICAL RISK)
*   **Issue:** Hardcoded secrets (API keys, DB passwords, JWT secrets) are directly committed to the source code repository.
*   **Blast Radius:** Complete system compromise. If the repository is ever made public, or if an attacker gains read access to the repo (via a compromised developer account or stolen laptop), they have immediate, unrestricted access to the production database and all connected third-party services.
*   **Impact if ignored:** Massive data breach, loss of customer trust, severe legal and compliance penalties (GDPR/CCPA).
*   **Remediation Order:** 1 (Immediate).

## 2. Direct DB Calls from the Frontend (CRITICAL RISK)
*   **Issue:** The frontend application is constructing and executing database queries directly, or the API is blindly accepting raw queries/unvalidated input from the client.
*   **Blast Radius:** Total data compromise. This is a severe architectural flaw that typically exposes SQL Injection vulnerabilities or allows any user to bypass authorization logic, potentially reading or destroying data belonging to other customers.
*   **Impact if ignored:** Unauthorized data exfiltration or malicious data destruction by any user capable of manipulating network requests.
*   **Remediation Order:** 2 (Immediate, concurrent with secrets).

## 3. Lack of Automated Tests (HIGH RISK)
*   **Issue:** No test suite exists.
*   **Blast Radius:** High likelihood of regressions. Since the app serves real customers and "cannot go down," any refactoring or feature addition carries extreme risk. We cannot safely fix the other architectural issues without a safety net.
*   **Impact if ignored:** Frequent production outages, slow development velocity (fear-driven development), and inability to safely modernize the codebase.
*   **Remediation Order:** 3 (High priority, prerequisites for safely fixing architectural issues).

## 4. Business Logic Inside Route Handlers (MEDIUM RISK)
*   **Issue:** Controllers/Route handlers are heavily bloated, mixing HTTP parsing, validation, core business rules, and data persistence in single massive functions.
*   **Blast Radius:** Code maintainability and testability are severely degraded. Bugs are easily introduced because business rules are duplicated or hidden within HTTP boilerplate.
*   **Impact if ignored:** Slower onboarding for new engineers, difficulty implementing new features, and high likelihood of edge-case bugs because logic cannot be unit-tested in isolation from the HTTP context.
*   **Remediation Order:** 4 (Medium priority, refactor iteratively).
