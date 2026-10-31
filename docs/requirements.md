# Subscription Management System --- Requirements

## 1. Project Overview

Build a unified Subscription Management System for Brightloop Software.
The platform manages the full subscription-business lifecycle: customer
accounts, products, product variants, subscription plans, quotations,
subscriptions, taxes, discounts, recurring invoices, payments and
financial reporting.

The system must replace spreadsheet-based tracking and manual billing
workflows with a centralized application.

## 2. Goals

-   Centralize subscription and customer information.
-   Manage products, variants, plans, quotations and subscriptions.
-   Generate invoices from subscriptions when billing is due.
-   Apply configured taxes and eligible discounts.
-   Record payments against invoices.
-   Identify outstanding and overdue invoices.
-   Provide role-specific experiences for Admin, Staff and Customer.
-   Provide a financial overview with filters and summary information.
-   Keep pages responsive under the specified performance target.

## 3. User Roles and Access

### 3.1 Admin

-   Access the administration dashboard.
-   Manage products, variants, plans, taxes and discounts.
-   Create and manage staff accounts.
-   View and manage customers.
-   View and manage quotations, subscriptions, invoices and payments.
-   View financial reports and system settings.

### 3.2 Staff

-   Handle permitted day-to-day customer and subscription operations.
-   Manage customer records.
-   Prepare quotations from templates.
-   View and manage subscriptions.
-   Manage invoices and record payments.
-   Access only the functions permitted by the authorization policy.

### 3.3 Customer

-   Register using an email address and password.
-   Log in and log out.
-   View only their own profile, subscriptions and invoices.
-   Access the customer portal.
-   Use account recovery through a registered email address.

### 3.4 Access Rules

-   Each email address must belong to only one account.
-   Only Admin can create Staff accounts.
-   Public signup creates Customer accounts only.
-   Backend authorization is mandatory; hiding frontend navigation items
    is not security.
-   Customers must never access another customer's records.
-   Admin, Staff and Customer permissions must be enforced by
    server-side middleware/services.

## 4. Authentication Requirements

-   Registration with email and password.
-   Unique email validation.
-   Password must contain more than eight characters, at least one
    uppercase letter, one lowercase letter and one special character.
-   Login and logout.
-   Forgot-password flow that sends a reset link to the registered
    email.
-   Reset token must be validated and expire.
-   Passwords must be securely hashed; plaintext passwords must never be
    stored.
-   Authentication should use secure HTTP-only cookies for the browser
    session.
-   Configure cookie `secure`, `sameSite`, domain and CORS settings
    appropriately for the deployment environment.
-   Protect state-changing requests against CSRF where required by the
    chosen cookie strategy.
-   Create the initial Admin through a controlled seed/bootstrap
    process, not public signup.

## 5. Product Management

Admin can create and manage products with: - Product name. - Product
type. - Sales price. - Cost price. - Notes. - Variants.

Variant requirements: - A product may have one or more variants. - A
variant may add an additional amount to the base product price. -
Example: base price ₹1,000 plus an Odoo variant surcharge of ₹560
results in ₹1,560 before applicable taxes/discounts. - Validate prices
and quantities; do not accept invalid negative values unless a
specifically documented business rule permits them.

## 6. Subscription Plan Management

Plans must support: - Plan name and associated product(s), as defined by
the agreed data model. - Price. - Billing frequency: daily, weekly,
monthly or yearly. - Minimum quantity. - Availability start and end
dates. - Plan-specific behavior for automatic closure at the end date. -
Early closure where permitted. - Pause and renewal behavior according to
plan configuration.

The system must distinguish a reusable plan/catalog definition from an
individual customer's subscription.

## 7. Quotation Management

-   Create quotation templates containing predefined plan and product
    lines.
-   Set template validity in days.
-   Create quotations from templates.
-   Store customer, plan, start date, expiry date and payment terms as
    applicable.
-   Store quotation lines with product, quantity, unit price, taxes and
    amount.
-   Track quotation/subscription progression through the required
    states.

## 8. Subscription Lifecycle

The required lifecycle is:

`Draft → Quotation → Confirmed → Active → Closed`

-   Every subscription has a unique subscription number.
-   Store customer, plan, start date, expiry date and payment terms.
-   Store subscription lines with product, quantity, unit price, taxes
    and amount.
-   Authorized users can see the current status.
-   Validate permitted state transitions on the backend.
-   Prevent invalid transitions and duplicate activation/billing
    operations.
-   Support closure, pause and renewal behavior in accordance with the
    plan and subscription rules.

## 9. Tax Management

-   Admin-configured tax rules must be used when calculating invoice
    amounts.
-   Tax calculation must be centralized and reusable.
-   Preserve the applied tax details on invoice lines so historical
    invoices do not change when tax configuration is later edited.
-   The exact tax categories, jurisdictions and inclusive/exclusive
    behavior must be agreed before implementation; do not invent
    jurisdiction-specific tax rules.

## 10. Invoice Management

-   Identify subscriptions whose billing is due.
-   Generate invoices from subscription data.
-   Populate customer details, product lines, quantities, prices, taxes
    and totals.
-   Support invoice actions: confirm, cancel, send and print.
-   Required invoice states: `Draft → Confirmed → Paid`.
-   Track due date and outstanding balance.
-   Prevent duplicate invoices for the same subscription and billing
    period.
-   Ensure eligible due billings are not silently skipped.
-   Use database transactions and uniqueness/idempotency controls for
    billing generation.
-   A cancelled invoice must not be treated as paid.

## 11. Discount Management

Only Admin can create discount rules.

Support: - Fixed-amount discounts. - Percentage discounts. - Minimum
purchase amount and/or minimum quantity. - Start and end dates. -
Maximum usage count. - Application to specified products or whole
subscriptions. - Automatic application to the next eligible invoice. -
Stop applying discounts after expiry or exhaustion of the usage limit. -
Validate eligibility on the server at the time of application. - Record
discount details on the invoice for historical accuracy.

## 12. Payment Management

Record each payment with: - Payment method. - Amount. - Date. - Note. -
Associated invoice.

The system must: - Support multiple payment methods as records; a
payment gateway is not required unless separately agreed. - Link
payments to the correct invoice. - Show paid and outstanding invoices. -
Calculate remaining balance. - Identify overdue invoices. - Prevent
overpayment or define an explicit policy for it. - Preserve payment
history and avoid silently deleting financial records.

## 13. Dashboard and Reporting

Provide a summary view showing: - Active subscription count. - Revenue
received for a selected period. - Amount still owed. - Overdue
invoices. - Payment information.

Provide filters and summary views. Suggested filters include date range,
customer, subscription status and invoice status. These are
implementation recommendations; the required brief only states that
filters and a summary view are needed.

Define revenue metrics clearly. For the initial implementation,
distinguish money received from invoiced value and outstanding balance;
do not label unpaid invoices as collected revenue.

## 14. Customer Portal

Customers can: - View their own dashboard. - View their own
subscriptions and statuses. - View their own invoices and payment
status. - View/update permitted profile information. - Never access
another customer's records.

## 15. Non-functional Requirements

### Performance

-   Every page should respond in under two seconds, including when
    thousands of subscriptions exist.
-   Measure performance with representative seeded data.
-   Use pagination, indexes, efficient queries and appropriate
    aggregation.
-   Avoid loading entire datasets into the browser.

### Security

-   Validate all incoming data on the server.
-   Enforce authorization at the API/service layer.
-   Hash passwords.
-   Keep secrets in environment variables.
-   Do not expose stack traces or secrets to clients.
-   Apply secure HTTP headers, rate limiting on sensitive endpoints and
    safe error handling.
-   Restrict CORS to approved origins.

### Reliability and Data Integrity

-   Use database transactions for multi-step financial operations.
-   Use idempotency/unique constraints for recurring invoice generation.
-   Store timestamps consistently and define the business timezone for
    billing.
-   Keep an audit trail for important financial/status changes where
    practical.

### Usability

-   Consistent navigation and page layouts.
-   Responsive desktop and mobile layouts.
-   Loading, empty, validation and error states.
-   Accessible labels, keyboard focus and adequate contrast.

## 16. Foundation Phase (Phase 00)

Before the 16 feature phases: - Establish React/Vite and Express
application startup. - Establish PostgreSQL/Prisma connection and
initial schema. - Create the shared Odoo-inspired purple design
system. - Create role-specific application layouts and navigation. -
Create all agreed route/page skeletons. - Implement login/signup and
authentication integration. - Create protected routes and role-aware
navigation. - Create a seeded Admin account securely. - Create
placeholder states for business pages. - Verify client/server startup,
routing, authentication and access control.

Foundation route list:

  Route                     Access
  ------------------------- --------------
  `/login`                  Public
  `/signup`                 Public
  `/forgot-password`        Public
  `/reset-password`         Public
  `/admin/dashboard`        Admin
  `/admin/staff`            Admin
  `/customers`              Admin, Staff
  `/products`               Admin, Staff
  `/products/:id`           Admin, Staff
  `/plans`                  Admin, Staff
  `/plans/:id`              Admin, Staff
  `/quotations`             Admin, Staff
  `/quotations/new`         Admin, Staff
  `/subscriptions`          Admin, Staff
  `/subscriptions/:id`      Admin, Staff
  `/invoices`               Admin, Staff
  `/invoices/:id`           Admin, Staff
  `/discounts`              Admin
  `/payments`               Admin, Staff
  `/reports`                Admin
  `/settings`               Admin
  `/portal/dashboard`       Customer
  `/portal/subscriptions`   Customer
  `/portal/invoices`        Customer
  `/portal/profile`         Customer

## 17. Out of Scope Unless Explicitly Approved

The following are not explicit requirements in the supplied brief: -
Payment gateway integration (Razorpay/Stripe). - Automatic
bank-statement reconciliation. - SMS/WhatsApp notifications. - Refund
processing. - Multi-currency billing. - Advanced revenue forecasting. -
Subscription upgrade/downgrade workflows.

Treat these as optional enhancements, not mandatory acceptance criteria.

## 18. Definition of Done

A feature is complete only when: - Its UI is implemented and connected
to real APIs. - Its backend validation and authorization work. - Its
Prisma/database changes are migrated and documented. - Loading, empty,
success and error states are handled. - Unit/integration tests cover
critical behavior. - It works with the agreed API contract. - It does
not break another module. - Its README/completion notes and known
limitations are updated.
