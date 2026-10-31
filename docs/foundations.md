# DealFlow360 --- Foundation Pages & Access Control

> **Purpose:** Establish the application foundation before implementing
> business modules. This document defines the initial pages,
> authentication, role-based access control (RBAC), navigation rules,
> route protection, and the minimum backend/frontend contracts.
>
> **Implementation order:** Foundation first. Do not begin Products,
> Plans, Quotations, Subscriptions, Invoices, or Payments until the
> foundation is reviewed and approved.

## 1. Foundation goals

The foundation must provide:

-   A working application shell and consistent navigation.
-   Secure authentication using server-validated sessions.
-   Three roles: `ADMIN`, `STAFF`, and `CUSTOMER`.
-   Role-based page access and action-level authorization.
-   Customer data isolation: customers can access only their own
    records.
-   A clear user and staff administration workflow.
-   Reusable layouts, form controls, tables, dialogs, status badges, and
    feedback states.
-   A reliable API, database, validation, and error-handling baseline.

RBAC must be enforced by the backend. Hiding a button or route in React
is only a user-experience measure, never a security boundary.

## 2. Roles and responsibilities

### 2.1 Admin

The Admin is the system administrator and has access to internal
management features.

Can: - View the internal dashboard and system-wide operational
summaries. - Create, view, update, deactivate, and reactivate Staff
accounts. - View and manage customer accounts. - Manage products, plans,
quotations, subscriptions, invoices, discounts, taxes, and payments as
permitted by the business workflow. - View reports and system
settings. - Assign or change Staff permissions only if a later
permission model is explicitly approved. - Review audit information for
sensitive administrative actions.

Cannot: - Create another Admin through public signup. - Bypass
server-side validation or immutable financial history rules.

### 2.2 Staff

Staff are internal operational users.

Can: - Access the internal workspace. - View and manage customers and
business records required for their assigned work. - Create and process
quotations and subscriptions. - View invoices and record payments only
where the approved business workflow grants that ability. - View
operational information needed for their work.

Cannot: - Create, promote, or deactivate Admin accounts. - Manage
system-wide security settings. - Access another customer's private
portal session or credentials. - Perform Admin-only operations.

**Important:** The initial implementation may use a single `STAFF` role.
Do not invent granular Staff permissions without approval. Keep the
authorization design extensible for future permissions.

### 2.3 Customer

Customers use the customer portal.

Can: - View and update permitted fields in their own profile. - View
only their own subscriptions, invoices, quotations, and payment
history. - View invoice details and payment status. - Download documents
belonging to their own account, when document support is implemented.

Cannot: - Access internal Admin or Staff pages. - View another
customer's records by changing an ID in a URL or API request. - Create
Staff/Admin accounts. - Modify protected financial records or internal
statuses.

### 2.4 Public visitor

A visitor who is not authenticated can: - View Login, Signup, Forgot
Password, and Reset Password pages. - Register as a Customer if public
registration is enabled.

A visitor cannot access protected application data.

## 3. Role-permission matrix

  Capability                  Public      Customer       Staff            Admin
  ------------------------- -------- ------------- ----------- ----------------
  Sign in / sign out             Yes           Yes         Yes              Yes
  Public Customer signup         Yes            No          No               No
  Internal dashboard              No            No         Yes              Yes
  Customer portal                 No   Own account          No               No
  View own profile                No           Yes         Yes              Yes
  View all customers              No            No       Yes\*              Yes
  Create / edit customers         No            No       Yes\*              Yes
  Manage Staff accounts           No            No          No              Yes
  Manage Admin accounts           No            No          No   Bootstrap only
  Products and plans              No            No       Yes\*              Yes
  Quotations                      No   Own records       Yes\*              Yes
  Subscriptions                   No   Own records       Yes\*              Yes
  Invoices                        No   Own records       Yes\*              Yes
  Record payments                 No        No\*\*       Yes\*              Yes
  Discounts and taxes             No            No       Yes\*              Yes
  Reports and settings            No            No   Limited\*              Yes

`*` Exact Staff permissions must follow the approved business workflow.
Until a more detailed permission policy is approved, use the default
Staff access configured by the project owner.

`**` Customer payment-gateway checkout is out of the initial foundation
scope. Do not allow customers to mark invoices as paid.

## 4. Authentication and account lifecycle

### 4.1 Authentication requirements

-   Use a server-managed authentication mechanism.
-   Prefer short-lived access sessions with secure, HTTP-only cookies;
    never store authentication tokens in `localStorage`.
-   In production, cookies must use `HttpOnly`, `Secure`, and an
    appropriate `SameSite` policy.
-   Apply CSRF protection when cookie-based authentication is used for
    state-changing requests.
-   Hash passwords using Argon2id or bcrypt with a suitable work factor.
-   Never store or log plaintext passwords, session secrets, or reset
    tokens.
-   Validate all request bodies and parameters on the backend.
-   Return generic login errors so the API does not reveal whether an
    email exists.
-   Add rate limiting to login, signup, and password-reset endpoints.
-   Invalidate sessions on logout, account deactivation, and password
    reset where supported.

### 4.2 Signup policy

-   Public signup creates only a `CUSTOMER` account.
-   The client must not be allowed to submit a role field that changes
    the assigned role.
-   The backend assigns `CUSTOMER` regardless of any role value supplied
    by the client.
-   Staff accounts are created by an Admin.
-   The first Admin is created through a controlled seed/bootstrap
    process, not public signup.
-   Do not expose an open Admin-registration route.

### 4.3 Account states

Use a clear account status such as:

-   `ACTIVE` --- account may authenticate and use authorized features.
-   `INACTIVE` --- account is disabled and cannot start a new session.
-   `PENDING_VERIFICATION` --- optional, only if email verification is
    implemented.

Do not delete accounts that are referenced by financial or audit
records. Prefer deactivation.

## 5. Foundation pages

Build these pages before business modules. All pages must use the shared
design system defined in `design.md`.

### 5.1 Public authentication pages

  --------------------------------------------------------------------------
  Page              Route                Purpose           Required UI
  ----------------- -------------------- ----------------- -----------------
  Login             `/login`             Authenticate an   Email, password,
                                         existing user     show/hide
                                                           password,
                                                           validation,
                                                           submit,
                                                           forgot-password
                                                           link

  Signup            `/signup`            Register a        Name, email,
                                         Customer          password, confirm
                                                           password, terms
                                                           acknowledgement
                                                           if required

  Forgot Password   `/forgot-password`   Request a         Email field,
                                         password reset    generic success
                                                           message

  Reset Password    `/reset-password`    Set a new         New password,
                                         password          confirmation,
                                                           token validation,
                                                           success/error
                                                           states

  Access Denied     `/403`               Explain           Clear message and
                                         insufficient      safe navigation
                                         permissions       back
  --------------------------------------------------------------------------

### 5.2 Internal application pages

  --------------------------------------------------------------------------
  Page              Route                Access            Purpose
  ----------------- -------------------- ----------------- -----------------
  Admin Dashboard   `/admin/dashboard`   Admin             System-wide
                                                           overview and
                                                           operational KPIs

  Staff Management  `/admin/staff`       Admin             Create, view,
                                                           edit, deactivate
                                                           Staff

  Customer          `/customers`         Staff, Admin      Search and manage
  Management                                               customer accounts

  User Profile      `/profile`           Authenticated     View and update
                                         users             permitted profile
                                                           fields

  Settings          `/settings`          Admin             Initial
                                                           system-level
                                                           settings shell
  --------------------------------------------------------------------------

### 5.3 Customer portal foundation pages

  -----------------------------------------------------------------------------
  Page              Route                 Access            Purpose
  ----------------- --------------------- ----------------- -------------------
  Portal Dashboard  `/portal/dashboard`   Customer          Customer-specific
                                                            overview

  Portal Profile    `/portal/profile`     Customer          Own profile and
                                                            contact details
  -----------------------------------------------------------------------------

The following customer pages can be added when their business modules
are implemented: - `/portal/quotations` - `/portal/subscriptions` -
`/portal/invoices` - `/portal/payments`

Do not build placeholder pages that imply an unfinished feature is
operational. If a route is reserved, show a deliberate "Not available
yet" state or keep it out of navigation until its phase is implemented.

## 6. Navigation and layout rules

### 6.1 Public layout

-   No authenticated sidebar.
-   Brand mark and a focused authentication card.
-   Responsive layout for mobile and desktop.
-   Links between Login, Signup, and Forgot Password.

### 6.2 Internal layout

-   Shared sidebar for Admin and Staff.
-   Top navigation with page title/breadcrumb, user menu, and sign out.
-   Navigation items filtered by role.
-   Active route clearly indicated.
-   Sidebar collapses on smaller screens.
-   Do not expose Admin links to Staff as a substitute for
    authorization; backend protection remains mandatory.

### 6.3 Customer portal layout

-   Separate customer-facing navigation and visual hierarchy.
-   Do not expose internal operational navigation.
-   Show customer identity and account menu.
-   Keep portal data scoped to the authenticated customer.

## 7. Route protection and authorization behavior

Implement reusable route guards in the frontend:

-   `PublicOnlyRoute`: redirects authenticated users away from
    Login/Signup to their correct home page.
-   `RequireAuth`: requires a valid authenticated session.
-   `RequireRole`: checks whether the current role is allowed to open a
    route.
-   `CustomerPortalRoute`: allows only `CUSTOMER`.
-   `InternalRoute`: allows `STAFF` or `ADMIN`.
-   `AdminRoute`: allows only `ADMIN`.

Recommended post-login redirects:

  Role       Destination
  ---------- -------------------------------------------------
  Admin      `/admin/dashboard`
  Staff      `/customers` or the approved Staff landing page
  Customer   `/portal/dashboard`

Authorization must also be checked in every protected Express
controller/service. Never trust role, user ID, customer ID, or ownership
values supplied by the browser.

### Customer ownership rule

For customer-owned resources, derive the customer identity from the
authenticated server session. Do not query a record using a
client-provided `customerId` without verifying ownership. A customer
requesting another customer's resource must receive a safe `404` or
`403` response according to the API convention, without leaking record
details.

## 8. Minimum data model for the foundation

The initial schema should be agreed before migrations are created. At
minimum, plan for:

### User

-   `id` --- UUID primary key.
-   `name`
-   `email` --- unique, normalized.
-   `passwordHash`
-   `role` --- enum: `ADMIN`, `STAFF`, `CUSTOMER`.
-   `status` --- enum: `ACTIVE`, `INACTIVE`, optionally
    `PENDING_VERIFICATION`.
-   `createdAt`
-   `updatedAt`
-   `lastLoginAt` --- optional.

### CustomerProfile

Use a separate profile model if customer-specific business fields are
needed. Link it one-to-one to `User` or to a dedicated Customer entity,
but choose one approach consistently before implementation.

### Session / RefreshSession

If the chosen authentication design requires persisted sessions or
refresh-token rotation, store only hashed session/refresh-token
identifiers, expiry, revocation state, and user relation.

### AuditLog

Plan an audit trail for sensitive actions such as user creation, role
changes, deactivation, and financial state changes. The exact schema can
be finalized with the module architecture.

**Schema coordination rule:** Prisma schema and migration files are
shared resources. One designated integrator coordinates changes.
Developers must not independently edit the same schema or create
conflicting migrations.

## 9. Initial API contract

Agree request/response shapes before frontend and backend integration.
Suggested foundation endpoints:

  -----------------------------------------------------------------------------------------
  Method            Endpoint                        Access            Purpose
  ----------------- ------------------------------- ----------------- ---------------------
  POST              `/api/auth/signup`              Public            Create Customer
                                                                      account

  POST              `/api/auth/login`               Public            Authenticate

  POST              `/api/auth/logout`              Authenticated     End session

  GET               `/api/auth/me`                  Authenticated     Return current user
                                                                      and role

  POST              `/api/auth/forgot-password`     Public            Request password
                                                                      reset

  POST              `/api/auth/reset-password`      Public with valid Reset password
                                                    token             

  GET               `/api/admin/staff`              Admin             List Staff

  POST              `/api/admin/staff`              Admin             Create Staff

  PATCH             `/api/admin/staff/:id`          Admin             Update permitted
                                                                      Staff fields

  PATCH             `/api/admin/staff/:id/status`   Admin             Activate/deactivate
                                                                      Staff

  GET               `/api/customers`                Staff, Admin      List customers

  GET               `/api/customers/:id`            Staff, Admin      View customer

  PATCH             `/api/profile`                  Authenticated     Update own permitted
                                                                      profile fields
  -----------------------------------------------------------------------------------------

Use a consistent response format, for example:

``` json
{
  "success": true,
  "data": {},
  "message": "Operation completed"
}
```

Use a consistent error format:

``` json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action"
  }
}
```

These are proposed contracts. Confirm them with both developers before
implementation; do not silently create competing response formats.

## 10. Frontend foundation architecture

Suggested structure (adapt to the agreed repository layout):

``` text
apps/
  web/
    src/
      app/
        App.jsx
        router.jsx
        providers/
          AuthProvider.jsx
      components/
        common/
        forms/
        feedback/
        navigation/
      layouts/
        PublicLayout.jsx
        InternalLayout.jsx
        CustomerPortalLayout.jsx
      pages/
        auth/
          LoginPage.jsx
          SignupPage.jsx
          ForgotPasswordPage.jsx
          ResetPasswordPage.jsx
          AccessDeniedPage.jsx
        admin/
          AdminDashboardPage.jsx
          StaffManagementPage.jsx
        customers/
          CustomerListPage.jsx
        profile/
          ProfilePage.jsx
        portal/
          PortalDashboardPage.jsx
        settings/
          SettingsPage.jsx
      routes/
        RequireAuth.jsx
        RequireRole.jsx
      services/
        apiClient.js
        authService.js
      styles/
        index.css
```

## 11. Backend foundation architecture

Suggested structure:

``` text
apps/
  api/
    src/
      app.js
      server.js
      config/
      middleware/
        authenticate.js
        authorize.js
        validate.js
        errorHandler.js
      modules/
        auth/
          auth.routes.js
          auth.controller.js
          auth.service.js
          auth.schema.js
        users/
          users.routes.js
          users.controller.js
          users.service.js
          users.schema.js
        customers/
      lib/
        prisma.js
        password.js
      utils/
    prisma/
      schema.prisma
      migrations/
      seed.js
```

Keep routes/controllers thin. Put business rules in services. Validate
external input at the API boundary. Return sanitized user data; never
return `passwordHash`, reset tokens, or session secrets.

## 12. Foundation implementation sequence

### Foundation 00A --- Repository and application baseline

-   Confirm monorepo/folder structure and package scripts.
-   Configure environment variables and `.env.example`.
-   Configure React/Vite and Express startup.
-   Configure PostgreSQL and Prisma connection.
-   Add health-check endpoint.
-   Add linting, formatting, and test commands.
-   Confirm local setup instructions.

### Foundation 00B --- Design system and application shell

-   Implement the uploaded `design.md` tokens in the shared stylesheet.
-   Build typography, spacing, colors, borders, shadows, and reusable
    components.
-   Build public, internal, and customer portal layouts.
-   Build responsive sidebar, top navigation, breadcrumbs, and user
    menu.
-   Establish consistent loading, empty, error, and not-found states.

### Foundation 00C --- Authentication

-   Implement Customer signup, login, logout, current-user endpoint.
-   Implement secure password hashing and cookie/session handling.
-   Implement Admin bootstrap/seed.
-   Add frontend auth provider and API client.
-   Ensure authentication survives refresh according to the selected
    session strategy.

### Foundation 00D --- RBAC

-   Implement backend authentication middleware.
-   Implement role authorization middleware.
-   Protect routes and API operations.
-   Enforce customer ownership in service/query layer.
-   Verify role-specific redirects and access-denied behavior.

### Foundation 00E --- Staff and customer administration

-   Admin creates and deactivates Staff.
-   Staff/Admin can manage customers according to the agreed policy.
-   Validate duplicate email, invalid roles, and invalid status changes.
-   Add audit events for sensitive actions.

### Foundation 00F --- Foundation verification and approval

-   Run frontend build, lint, and tests.
-   Run backend tests and API checks.
-   Verify migrations on a clean database.
-   Verify all role access combinations.
-   Verify customer A cannot read customer B's records.
-   Review accessibility, responsive behavior, and error states.
-   Prepare a completion report and request human approval before
    committing.

## 13. Required RBAC test cases

  -----------------------------------------------------------------------
  Test                                Expected result
  ----------------------------------- -----------------------------------
  Unauthenticated user opens          Redirect to Login
  `/admin/dashboard`                  

  Customer opens `/admin/dashboard`   Access denied / redirect to `/403`

  Staff opens `/admin/staff`          Access denied

  Admin opens `/admin/staff`          Allowed

  Customer opens `/portal/dashboard`  Allowed

  Staff opens `/portal/dashboard`     Access denied

  Customer calls an internal Admin    `403`
  API                                 

  Customer requests another           No data disclosure; `404` or `403`
  customer's invoice ID               

  Signup request submits              Account is still created only as
  `role: ADMIN`                       `CUSTOMER`

  Staff attempts to create an Admin   `403`

  Inactive user attempts login        Authentication denied

  Logged-out user calls a protected   `401`
  API                                 
  -----------------------------------------------------------------------

## 14. Security and quality checklist

-   [ ] Backend authorization exists for every protected endpoint.
-   [ ] Public signup cannot assign privileged roles.
-   [ ] Passwords are securely hashed.
-   [ ] Cookies are configured securely for the deployment environment.
-   [ ] CSRF protection is addressed for cookie-authenticated mutations.
-   [ ] Login and password-reset endpoints are rate-limited.
-   [ ] Customer ownership is enforced server-side.
-   [ ] Sensitive values are excluded from logs and API responses.
-   [ ] Errors do not reveal private record existence unnecessarily.
-   [ ] Deactivation revokes or invalidates active sessions.
-   [ ] Admin bootstrap is documented and not publicly accessible.
-   [ ] Audit events cover sensitive administrative actions.

## 15. Definition of Done

The foundation is complete only when:

1.  The application starts locally using documented setup instructions.
2.  PostgreSQL and Prisma work from a clean database.
3.  Login, logout, signup, and current-user retrieval work end-to-end.
4.  Admin, Staff, and Customer roles are represented and enforced.
5.  All foundation pages render using the shared design system.
6.  Frontend routes and backend APIs enforce matching access policies.
7.  Customer ownership tests pass.
8.  Staff creation/deactivation works for Admin only.
9.  Error, loading, empty, and responsive states are implemented.
10. Both developers review the shared contracts and integration.
11. The phase completion report is presented for human approval.
12. No commit is created until the authorized reviewer explicitly
    approves it.

## 16. Scope boundaries

The foundation phase does not implement full product, plan, quotation,
subscription, invoice, tax, discount, payment, collection, or analytics
workflows. It creates the secure application structure those modules
will use.

Do not add unapproved roles, permission tiers, payment gateway behavior,
multi-tenant architecture, or advanced identity-provider integrations.
Record suggestions and obtain approval before expanding scope.
