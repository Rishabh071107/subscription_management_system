# Brightloop — Subscription Management System

<p align="center">
  <strong>A centralized platform for managing subscriptions, recurring billing, quotations, invoices, and payments.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Under%20Development-orange?style=for-the-badge" alt="Project Status"/>
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/ORM-Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma"/>
</p>

---

## 1. Overview

**Brightloop** is a subscription management platform designed to simplify and centralize the complete subscription lifecycle for businesses.

Managing customers, subscription plans, quotations, recurring billing, invoices, payments, and financial records across disconnected systems can become complicated and inefficient.

Brightloop aims to bring these operations together through a unified enterprise workspace.

The platform enables administrators and staff to manage business operations while customers can access their own subscriptions, invoices, and payment information through a dedicated customer portal.

### Key objectives

- Centralize subscription and customer management.
- Simplify subscription plan creation and administration.
- Manage quotations and their approval lifecycle.
- Automate recurring billing and invoice generation.
- Track payments and outstanding balances.
- Monitor overdue invoices and collection activities.
- Provide financial insights through dashboards and reports.
- Maintain secure, role-based access to business information.

---

## 2. Core Features

Brightloop is organized into interconnected business modules.

### 2.1 Authentication and Role-Based Access Control

Secure authentication and role-based authorization for different types of users.

- User registration and login.
- Secure password hashing.
- Session management.
- Role-based route protection.
- Backend authorization middleware.
- Account activation and deactivation.
- Customer data ownership enforcement.

**Supported roles:**

| Role | Responsibilities |
|---|---|
| Admin | Complete authorized system administration and business management |
| Staff | Internal operational and customer management |
| Customer | Access to personal subscriptions, quotations, invoices and payments |

Public registration is restricted to Customer accounts. Staff accounts are created by Admin, and the initial Admin is provisioned through a controlled bootstrap process.

### 2.2 Product Management

Manage the products offered through the subscription platform.

- Create and update products.
- Manage product descriptions.
- Configure sales and cost prices.
- Manage product identifiers and SKUs.
- Support product variants and additional pricing.
- Activate and deactivate products.

### 2.3 Subscription Plan Management

Create and manage subscription plans with configurable billing terms.

- Configure plan pricing.
- Associate products with plans.
- Set billing frequencies.
- Configure minimum quantities.
- Define plan availability periods.
- Configure renewal and closure behavior.
- Manage plan activation status.

**Supported billing frequencies:**

- Daily
- Weekly
- Monthly
- Yearly

### 2.4 Quotation Management

Manage customer quotations before subscription confirmation.

- Create quotations.
- Add customers and products.
- Configure quantities and prices.
- Apply eligible discounts.
- Calculate taxes.
- Generate quotation totals.
- Configure quotation validity.
- Track quotation status.
- Manage quotation templates where supported.

### 2.5 Subscription Lifecycle Management

Manage subscriptions throughout their lifecycle.

- Create subscriptions.
- Confirm subscriptions.
- Activate subscriptions.
- Pause and resume subscriptions.
- Renew subscriptions.
- Close subscriptions.
- Track billing dates.
- Maintain subscription history.

### 2.6 Tax Management

Configure and manage applicable taxes.

- Create and update tax configurations.
- Configure tax rates.
- Manage tax applicability.
- Activate and deactivate taxes.
- Preserve historical tax information on finalized records.

### 2.7 Discount Management

Create and manage promotional and commercial discounts.

- Fixed-amount discounts.
- Percentage-based discounts.
- Minimum purchase requirements.
- Minimum quantity restrictions.
- Validity periods.
- Usage restrictions.
- Product and plan eligibility.
- Automatic application where configured.

### 2.8 Invoice Management

Manage invoices generated from eligible subscriptions.

- Generate invoices.
- View invoice details.
- Track invoice status.
- Calculate taxes and discounts.
- Track invoice due dates.
- Display paid and outstanding amounts.
- Prevent duplicate invoices for the same billing period.

### 2.9 Recurring Billing Engine

Automate subscription billing operations.

- Identify subscriptions eligible for billing.
- Calculate billing periods.
- Generate invoices.
- Update next billing dates.
- Handle paused and closed subscriptions.
- Prevent duplicate billing.
- Record billing execution history.
- Handle billing failures and retries safely.

### 2.10 Payment Management

Track and manage payments against invoices.

- Record payments.
- Support partial and full payments.
- Link payments to invoices.
- Track payment dates and methods.
- Calculate outstanding balances.
- Maintain payment history.

### 2.11 Overdue and Collection Management

Monitor unpaid and overdue invoices.

- Identify overdue invoices.
- Calculate days overdue.
- Track outstanding balances.
- Filter overdue records.
- Maintain collection notes and follow-up activities where supported.

### 2.12 Financial Dashboard and Analytics

Provide business-level financial insights.

- Total invoiced value.
- Payments received.
- Active subscriptions.
- Total customers.
- Pending invoices.
- Overdue invoices.
- Outstanding balances.
- Revenue and collection trends.

### 2.13 Customer Portal

Provide customers with a dedicated interface to access their own information.

- Customer dashboard.
- Profile management.
- Quotation history.
- Subscription details.
- Invoice history.
- Payment history.
- Upcoming billing information.

Customer access is restricted to records belonging to the authenticated customer.

### 2.14 Notifications and Integrations

Provide notifications for important business events.

- Invoice generation.
- Payment recording.
- Upcoming billing.
- Overdue invoices.
- Billing failures.
- Subscription events.

External notification integrations are subject to approved provider access and configuration.

---

## 3. Technology Stack

Brightloop uses a modern JavaScript full-stack architecture.

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React | Component-based user interface |
| Build Tool | Vite | Frontend development and production builds |
| Styling | Tailwind CSS / Custom CSS | Responsive design system |
| Routing | React Router | Application navigation |
| Backend | Node.js | Server-side runtime |
| API Framework | Express.js | REST API development |
| Database | PostgreSQL | Relational data storage |
| ORM | Prisma | Database access and schema management |
| Validation | Zod / approved validation library | Request validation |
| Authentication | Secure cookie-based sessions | User authentication |
| Version Control | Git and GitHub | Source code management |

Additional libraries and integrations may be introduced according to approved project requirements.

---

## 4. System Architecture

Brightloop follows a modular architecture that separates frontend presentation, backend business logic, and database operations.

```text
                    BRIGHTLOOP
                         |
          +--------------+--------------+
          |                             |
      FRONTEND                       BACKEND
       React                         Express
          |                             |
    React Router                 API Routes
          |                             |
    Shared Components            Middleware
          |                             |
    Feature Pages                Controllers
          |                             |
    API Services                 Services
          |                             |
          +-------------+---------------+
                        |
                    Prisma ORM
                        |
                    PostgreSQL
```

### Backend architecture

The backend follows a modular structure:

```text
Request
   |
   v
Route
   |
   v
Authentication Middleware
   |
   v
Authorization Middleware
   |
   v
Request Validation
   |
   v
Controller
   |
   v
Service Layer
   |
   v
Prisma ORM
   |
   v
PostgreSQL
```

### Architecture principles

- Modular feature organization.
- Separation of concerns.
- Reusable frontend components.
- Centralized API communication.
- Backend-enforced authorization.
- Server-side financial calculations.
- Consistent request validation.
- Transactional financial operations.
- Reusable error handling.

---

## 5. User Roles and Access Control

Brightloop implements Role-Based Access Control (RBAC).

### Admin

- Access the internal administration workspace.
- Manage Staff accounts.
- Manage customers.
- Manage products and plans.
- Manage quotations and subscriptions.
- Configure taxes and discounts.
- Access financial and operational features.
- Manage approved system settings.

### Staff

- Access the internal workspace.
- Manage customers according to assigned access.
- Perform authorized business operations.
- Manage permitted quotations and subscriptions.
- Access operational records.

### Customer

- Access the customer portal.
- View personal profile information.
- View personal quotations.
- View personal subscriptions.
- View personal invoices.
- View personal payment history.

**Security principle:** Authorization is enforced by the backend. Hiding frontend navigation items is not considered sufficient access control.

---

## 6. Project Structure

The following is the intended modular structure. The actual repository may evolve as implementation progresses.

```text
Brightloop/
│
├── apps/
│   │
│   ├── web/
│   │   ├── public/
│   │   └── src/
│   │       ├── app/
│   │       │   ├── providers/
│   │       │   ├── App.jsx
│   │       │   └── router.jsx
│   │       │
│   │       ├── components/
│   │       │   ├── common/
│   │       │   ├── forms/
│   │       │   ├── navigation/
│   │       │   └── feedback/
│   │       │
│   │       ├── layouts/
│   │       │   ├── PublicLayout.jsx
│   │       │   ├── InternalLayout.jsx
│   │       │   └── CustomerPortalLayout.jsx
│   │       │
│   │       ├── pages/
│   │       │   ├── auth/
│   │       │   ├── admin/
│   │       │   ├── customers/
│   │       │   ├── products/
│   │       │   ├── plans/
│   │       │   ├── quotations/
│   │       │   ├── subscriptions/
│   │       │   ├── invoices/
│   │       │   ├── payments/
│   │       │   ├── reports/
│   │       │   └── portal/
│   │       │
│   │       ├── services/
│   │       ├── routes/
│   │       ├── hooks/
│   │       └── styles/
│   │
│   └── api/
│       ├── src/
│       │   ├── config/
│       │   ├── middleware/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── users/
│       │   │   ├── customers/
│       │   │   ├── products/
│       │   │   ├── plans/
│       │   │   ├── quotations/
│       │   │   ├── subscriptions/
│       │   │   ├── taxes/
│       │   │   ├── discounts/
│       │   │   ├── invoices/
│       │   │   ├── billing/
│       │   │   ├── payments/
│       │   │   └── reports/
│       │   │
│       │   ├── lib/
│       │   ├── utils/
│       │   ├── app.js
│       │   └── server.js
│       │
│       └── prisma/
│           ├── schema.prisma
│           ├── migrations/
│           └── seed.js
│
├── docs/
│   ├── requirements.md
│   ├── foundations.md
│   ├── design.md
│   ├── architecture.md
│   ├── database-schema.md
│   ├── api-contracts.md
│   ├── developer_A.md
│   └── developer_B.md
│
├── .gitignore
├── README.md
└── package.json
```

---

## 7. Design System

Brightloop follows an Odoo-inspired enterprise design language based on the supplied DealFlow360 visual specification.

### Brand colors

| Purpose | Color |
|---|---|
| Primary | `#714B67` |
| Primary hover | `#5F3D56` |
| Primary light | `#F3E9F1` |
| Sidebar | `#1E293B` |
| Page background | `#FFFFFF` |
| Surface | `#F8F9FA` |
| Main text | `#212529` |

### Typography

- Outfit — headings.
- Inter — body content.
- DM Sans — navigation and labels.
- Space Grotesk — financial metrics.

### Design principles

- Clean enterprise layouts.
- Consistent spacing and alignment.
- Clear financial data presentation.
- Reusable UI components.
- Responsive page layouts.
- Accessible status indicators.
- Minimal decorative styling.

Refer to [`design.md`](design.md) for the complete design specification.

---

## 8. Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

Install the following:

- Node.js (version compatible with the repository).
- npm.
- PostgreSQL.
- Git.

### Step 1 — Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd Brightloop
```

Replace `<YOUR_REPOSITORY_URL>` with the actual GitHub repository URL.

### Step 2 — Install dependencies

Install the dependencies using the repository's package structure.

For a monorepo with a root workspace:

```bash
npm install
```

If the frontend and backend maintain independent package files:

```bash
cd apps/web
npm install

cd ../api
npm install
```

### Step 3 — Configure environment variables

Create the required environment files using the repository's `.env.example`.

Typical configuration values may include:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/brightloop"

PORT=5000
NODE_ENV=development

CLIENT_URL="http://localhost:5173"

SESSION_SECRET="replace-with-a-secure-random-secret"
```

The exact variable names must match the application's implementation.

**Never commit actual credentials, API keys, database passwords or session secrets.**

### Step 4 — Configure PostgreSQL

Create a PostgreSQL database named:

```sql
CREATE DATABASE brightloop;
```

Ensure the database credentials match the configured connection string.

### Step 5 — Configure Prisma

From the backend workspace, run the Prisma commands supported by the repository:

```bash
npx prisma generate
```

Apply the existing migrations:

```bash
npx prisma migrate dev
```

If the project uses a different migration workflow, follow its documented instructions.

### Step 6 — Seed initial data

If a seed script is configured:

```bash
npx prisma db seed
```

Use the approved bootstrap process to provision the initial Admin account.

Do not create privileged accounts through public registration.

### Step 7 — Start the application

Start the backend:

```bash
npm run dev
```

Start the frontend in a separate terminal:

```bash
npm run dev
```

Run these commands from the appropriate workspaces or use the root workspace scripts if configured.

### Step 8 — Open the application

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:5000
```

Health check, if configured:

```text
http://localhost:5000/api/health
```

Actual ports and scripts depend on the repository configuration.

---

## 9. Development Workflow

Brightloop is developed using two independent development tracks.

### Developer A — Core Business Modules

Responsible for:

| Phase | Module |
|---|---|
| 01 | Authentication and Authorization Completion |
| 02 | Product Management |
| 03 | Subscription Plan Management |
| 04 | Quotation Management |
| 05 | Subscription Lifecycle Management |
| 06 | Tax Management |
| 07 | Discount Management |
| 08 | Admin, Staff and Customer Management |

### Developer B — Billing and Financial Modules

Responsible for:

| Phase | Module |
|---|---|
| 09 | Invoice Management |
| 10 | Recurring Billing Engine |
| 11 | Payment Management |
| 12 | Overdue and Collection Management |
| 13 | Financial Dashboard |
| 14 | Financial Reports and Analytics |
| 15 | Customer Portal |
| 16 | Notifications, Integration and Performance |

### Development principles

Both developers are responsible for complete vertical feature slices:

**Frontend + Backend + Database + API Integration + Testing.**

Developers must:

- Respect module ownership.
- Avoid modifying the other developer's modules.
- Coordinate shared Prisma schema changes.
- Follow agreed API contracts.
- Reuse the shared design system.
- Test their changes before requesting approval.
- Provide phase completion reports.

### Git workflow

Suggested branches:

```text
main
developer-a
developer-b
```

Feature branches may be created for individual phases.

Commits require explicit reviewer approval.

Do not automatically push or merge changes without authorization.

Separate Git worktrees or clones are recommended for independent development.

---

## 10. Security Considerations

Security is an important part of Brightloop's architecture.

The implementation must follow these principles:

- Secure password hashing using Argon2id or bcrypt.
- HTTP-only cookies for cookie-based authentication.
- Secure cookie configuration for production.
- CSRF protection for cookie-authenticated state-changing requests.
- Backend-enforced RBAC.
- Request validation.
- Login and password-reset rate limiting.
- Customer data isolation.
- Secure session invalidation.
- Environment-based secret management.
- Safe error handling.
- Audit logging for sensitive operations.
- Transactional financial operations.

Never trust client-provided roles, customer IDs or financial totals.

All important financial calculations must be validated and performed on the backend.

---

## 11. Testing and Quality Assurance

Testing is required throughout development.

### Frontend testing

- Component rendering.
- Form validation.
- API integration.
- Role-based navigation.
- Responsive layouts.
- Loading states.
- Empty states.
- Error handling.

### Backend testing

- API endpoint tests.
- Service-level tests.
- Authentication tests.
- Authorization tests.
- Database integration tests.
- Input validation.
- Error handling.

### Business integrity testing

- Duplicate invoice prevention.
- Recurring billing calculations.
- Partial payment handling.
- Full payment handling.
- Outstanding balance calculations.
- Tax and discount calculations.
- Subscription lifecycle transitions.
- Customer data ownership.
- Overdue invoice detection.

Builds and tests must be executed before a phase is marked complete.

---

## 12. Project Documentation

The project uses the following documentation:

| Document | Purpose |
|---|---|
| `README.md` | Project introduction and setup |
| `requirements.md` | Functional and non-functional requirements |
| `foundations.md` | Application foundation, authentication and RBAC |
| `design.md` | Visual design system |
| `architecture.md` | System architecture |
| `database-schema.md` | Database model reference |
| `api-contracts.md` | API specifications |
| `developer_A.md` | Developer A responsibilities |
| `developer_B.md` | Developer B responsibilities |
| `agents.md` | AI development and coding guidelines |

Keep documentation updated when approved architectural or business changes are made.

---

## 13. Implementation Roadmap

Brightloop is developed through the following stages:

### Stage 1 — Foundation

- Application setup.
- Design system.
- Authentication.
- RBAC.
- User management.
- Shared layouts and navigation.

### Stage 2 — Core Business Management

- Products.
- Subscription plans.
- Quotations.
- Subscription lifecycle.
- Taxes.
- Discounts.
- Admin and Staff management.

### Stage 3 — Billing and Financial Operations

- Invoice management.
- Recurring billing.
- Payment management.
- Overdue tracking.
- Collection workflows.

### Stage 4 — Analytics and Customer Experience

- Financial dashboard.
- Reports and analytics.
- Customer portal.
- Notifications.
- Performance optimization.

### Stage 5 — Integration and Final Verification

- Cross-module integration.
- Security verification.
- Regression testing.
- Performance testing.
- Documentation.
- Deployment preparation.

---

## 14. Current Project Status

**Project status: Under Development**

Brightloop is being implemented incrementally.

The roadmap defines the target functionality; individual features should be considered complete only after their implementation, integration and verification have been completed.

---

## 15. Future Enhancements

Potential enhancements, subject to approval:

- Payment gateway integration.
- Automated email notifications.
- SMS and WhatsApp notifications.
- Invoice PDF generation.
- Multi-currency support.
- Advanced revenue forecasting.
- Subscription analytics.
- External accounting integrations.
- Advanced audit and activity reporting.

---

## 16. Contribution Guidelines

Before contributing:

1. Read the project documentation.
2. Understand the module ownership boundaries.
3. Follow the established folder structure.
4. Reuse shared components and utilities.
5. Follow the design system.
6. Validate inputs on the backend.
7. Write tests for business logic.
8. Review all changed files.
9. Request approval before committing.
10. Update relevant documentation.

Do not commit secrets, credentials, generated build files or unrelated changes.

---

## 17. License

License information will be added once the project's licensing terms are finalized.

---

<p align="center">
  <strong>Brightloop</strong>
  <br/>
  <em>Bringing subscriptions, billing and business operations together.</em>
</p>
