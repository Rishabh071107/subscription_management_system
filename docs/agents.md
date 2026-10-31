# Coding Agent Instructions --- Subscription Management System

## 1. Project Mission

Build a production-minded modular monolith for Brightloop Software's
Subscription Management System using React, Express, PostgreSQL and
Prisma ORM.

The project is developed by two developers using coding agents. Work is
divided by complete business features (vertical slices), not by
frontend/backend ownership.

## 2. Mandatory Technology Stack

-   Frontend: React with Vite.
-   Backend: Node.js with Express.
-   Database: PostgreSQL.
-   ORM: Prisma.
-   Frontend styling: Tailwind CSS plus custom CSS where needed.
-   Routing: React Router.
-   Validation: Zod (shared contract conventions; frontend and backend
    may have separate implementations).
-   Authentication: password hashing, JWT/session strategy using
    HTTP-only cookies.
-   API testing: Postman or automated integration tests.
-   Version control: Git and GitHub.

Use JavaScript/JSX unless the existing repository has already adopted
TypeScript. Do not introduce a second language or framework without
approval.

## 3. Architecture Rules

Use a modular monolith with vertical feature slices.

Each feature owns its: - React pages and components. - Frontend API
service/hooks. - Express routes and controllers. - Business services. -
Repository/data access where useful. - Validation. - Tests. - Module
documentation.

Expected frontend pattern:

`client/src/modules/<module>/`

``` text
<module>/
  components/
  pages/
  hooks/
  services/
  validators/
  utils/
  index.js
```

Expected backend pattern:

`server/src/modules/<module>/`

``` text
<module>/
  <module>.routes.js
  <module>.controller.js
  <module>.service.js
  <module>.repository.js
  <module>.validation.js
  <module>.constants.js
  <module>.test.js
```

A small module may omit unnecessary folders/files. Do not create empty
abstractions just to match a template.

Shared code belongs in `client/src/shared` or `server/src/core` /
`server/src/shared`. Shared code must be genuinely reusable and must not
become a dumping ground for feature logic.

## 4. Module Boundaries

-   A module must not import another module's private implementation
    files.
-   Expose stable public functions through the module's `index.js` or
    documented service/API contract.
-   Prefer HTTP APIs for communication between browser features and
    backend.
-   Within the backend, use documented public service interfaces for
    cross-module operations.
-   Avoid circular dependencies.
-   Keep business rules in backend services; frontend validation is for
    user experience, not security.
-   The backend is the source of truth for price, tax, discount, balance
    and permissions.

## 5. Shared Files and Ownership

The following files are shared and must not be changed independently
without coordination: - `server/prisma/schema.prisma` - Prisma migration
history. - Root and client/server `package.json` files. -
`client/src/app/router.jsx` - `client/src/app/App.jsx` - Global
CSS/design tokens. - Shared navigation configuration. - Environment
variable examples. - API contract and architecture documents.

One designated integrator coordinates shared schema changes and
migration ordering. Developers must submit proposed schema changes with
their module PR; do not independently create conflicting migrations from
stale branches.

## 6. API Contract Rules

Before implementing a dependent feature: - Read
`docs/api-contracts.md`. - Use consistent URL, method, request, response
and error formats. - Prefix API routes with `/api/v1`. - Use JSON for
ordinary request/response bodies. - Use correct HTTP status codes. -
Never expose Prisma internals or raw stack traces. - Document pagination
and filtering. - Keep date/time formats explicit (ISO 8601 in API
responses). - Ensure ownership checks for customer-scoped data.

Standard success response recommendation:

``` json
{
  "success": true,
  "data": {},
  "message": "Operation completed"
}
```

Standard error response recommendation:

``` json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the submitted information",
    "details": []
  }
}
```

Do not wrap responses inconsistently across modules.

## 7. Database and Prisma Rules

-   PostgreSQL is the only primary database.
-   Prisma is the database access layer.
-   Use explicit relations, indexes, unique constraints and appropriate
    delete behavior.
-   Use Decimal types for monetary values; do not use floating-point
    arithmetic for money.
-   Store currency code explicitly if the schema is designed to support
    it; initial business examples use INR.
-   Store invoice snapshots of customer/product/tax/discount details
    needed for historical accuracy.
-   Use transactions for invoice generation, payment recording and other
    multi-row financial operations.
-   Add idempotency/uniqueness protection for recurring billing.
-   Never edit an already-applied migration to change production
    history.
-   Do not run destructive database resets against shared or production
    data.
-   Coordinate every migration with the designated integrator.

## 8. Authentication and Security Rules

-   Hash passwords using a suitable password-hashing algorithm.
-   Never store plaintext passwords or reset tokens.
-   Use HTTP-only cookies for browser authentication.
-   Configure `secure`, `sameSite`, CORS and CSRF protections for the
    deployment context.
-   Validate role and resource ownership on the server.
-   Public signup must only create Customer accounts.
-   Staff creation must be Admin-only.
-   Initial Admin creation must use a controlled seed/bootstrap script.
-   Never hardcode secrets, credentials or API keys.
-   Rate-limit login and password-reset endpoints.
-   Avoid logging passwords, tokens or sensitive customer data.

## 9. UI and Design Rules

Follow `docs/design.md` as the source of truth.

-   Odoo-inspired purple identity, not a pixel-for-pixel Odoo clone.
-   Use shared typography, color, spacing, border and component tokens.
-   Use the defined font roles consistently.
-   Avoid generic AI-dashboard patterns, excessive gradients, excessive
    glassmorphism and decorative charts with fake data.
-   Use realistic empty states and clearly labelled demo data where mock
    data is needed.
-   Every page needs loading, empty, error and success states as
    appropriate.
-   Ensure responsive behavior and keyboard accessibility.
-   Do not invent live business metrics.

## 10. Developer Workflow

1.  Read requirements, architecture, design and assigned developer
    document.
2.  Confirm module dependencies and contracts.
3.  Create a feature branch from the agreed integration branch.
4.  Work only in assigned module paths unless a shared-file change is
    approved.
5.  Add tests and update documentation.
6.  Run lint/build/tests and verify the module.
7.  Open a PR with screenshots/API examples/schema notes as relevant.
8.  Resolve integration feedback.
9.  Merge only after review.

Suggested branch format: - `feature/authentication` -
`feature/products` - `feature/invoices` - `feature/recurring-billing`

## 11. Coding Agent Behavior

Before editing: - Inspect the existing repository and package scripts. -
Read relevant documentation. - Preserve working code and existing
conventions. - Identify files that may conflict with another developer's
work. - State the planned files and changes.

While editing: - Implement complete working functionality for the
assigned scope. - Do not replace working modules with mock-only
implementations. - Do not rewrite unrelated files. - Do not silently
change API contracts or database models. - Do not install unnecessary
dependencies. - Keep components and services focused.

After editing: - Run relevant tests, lint and build commands. - Report
exact files changed. - Report commands executed and their results. -
List environment variables/migrations required. - List incomplete items
and known limitations. - Never claim a test passed if it was not run.

## 12. Foundation Phase 00

Phase 00 is a shared prerequisite: - Developer A owns the complete
authentication vertical slice and initial backend/database foundation. -
Developer B owns the application shell, design system, role layouts,
navigation and route/page skeletons. - Both use the same agreed role
names and route map. - Developer B may use mock session data until the
authentication API is available. - Integrate and test the foundation
before feature phases begin.

## 13. Definition of Done

A phase is done only when: - All acceptance criteria are met. - UI and
backend are connected where applicable. - Authorization and validation
are enforced. - Database changes are migrated safely. - Tests and build
pass. - No unrelated files are modified. - Documentation is updated. -
Completion report includes evidence and limitations.
