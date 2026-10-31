# System Architecture — Subscription Management System

## 1. Project Overview

The Subscription Management System is a modular monolithic application designed to manage the complete lifecycle of a subscription-based business.

The application will use a feature-based architecture where each business module independently manages its frontend, backend, database interactions, validation and business logic.

The system will be developed by two developers working on separate business modules.

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Build Tool | Vite |
| Styling | Tailwind CSS + Custom CSS |
| Backend | Node.js + Express.js |
| Database | PostgreSQL |
| ORM | Prisma ORM |
| Routing | React Router |
| Validation | Zod |
| Authentication | JWT + HTTP-only cookies |
| API Testing | Postman |
| Version Control | Git + GitHub |

## 3. Architectural Pattern

The project follows a Modular Monolith / Feature-Based Architecture.

Each business feature is implemented as an independent vertical slice.

A vertical slice includes:

- React pages and components.
- Frontend API services.
- Express routes and controllers.
- Backend business logic.
- Prisma database operations.
- Input validation.
- Feature-specific testing.

The application will have one frontend application, one backend application and one PostgreSQL database.

Modules will remain logically independent while communicating through defined interfaces.

## 4. High-Level Architecture

```text
                  USERS
                    |
          ----------------------
          |          |         |
         Admin      Staff   Customer
          |          |         |
          ----------------------
                    |
              REACT CLIENT
                    |
          ----------------------
          |                    |
      Admin Panel         Customer Portal
          |                    |
          ----------------------
                    |
               API LAYER
             Express.js
                    |
          ----------------------
          |                    |
       Middleware          API Routes
          |                    |
          ----------------------
                    |
             BUSINESS MODULES
                    |
    -------------------------------------
    |       |       |       |           |
   Auth  Products  Plans  Subscriptions  ...
    |       |       |       |           |
    -------------------------------------
                    |
               PRISMA ORM
                    |
               POSTGRESQL
```

## 5. Application Modules

### 5.1 Authentication Module
- Registration
- Login and logout
- Password reset
- User authentication
- Role-based authorization

### 5.2 Product Management
- Product CRUD
- Product variants
- Variant additional pricing
- Product details

### 5.3 Subscription Plan Management
- Plan creation
- Billing frequency
- Minimum quantity
- Availability dates
- Pause and renewal configuration

### 5.4 Quotation Management
- Quotation templates
- Quotation creation
- Product and plan lines
- Quotation validity

### 5.5 Subscription Management
- Subscription creation
- Subscription lifecycle
- Activation
- Expiry and closure
- Pause and renewal

### 5.6 Tax Management
- Tax configuration
- Tax calculation
- Tax breakdown

### 5.7 Discount Management
- Fixed discounts
- Percentage discounts
- Discount eligibility
- Usage limits
- Automatic application

### 5.8 Admin and Staff Management
- Staff creation
- Role assignment
- Customer administration
- Access control

### 5.9 Invoice Management
- Invoice creation
- Invoice details
- Invoice status
- Invoice printing and sending

### 5.10 Recurring Billing
- Billing schedules
- Due subscription detection
- Automatic invoice generation
- Duplicate billing prevention

### 5.11 Payment Management
- Payment recording
- Payment methods
- Invoice mapping
- Outstanding balance

### 5.12 Overdue Management
- Overdue detection
- Collection tracking
- Payment follow-up

### 5.13 Financial Dashboard
- Active subscriptions
- Revenue received
- Outstanding amount
- Overdue invoices

### 5.14 Financial Reports
- Date-based filtering
- Customer filtering
- Subscription reports
- Invoice reports
- Payment reports

### 5.15 Customer Portal
- Customer dashboard
- My subscriptions
- My invoices
- Profile management

### 5.16 Notifications and Integration
- Email notification abstraction
- Module integration
- Performance optimization
- End-to-end testing

## 6. Developer Ownership

### Developer A

Responsible for complete implementation of:

1. Authentication and authorization
2. Product Management
3. Subscription Plan Management
4. Quotation Management
5. Subscription Lifecycle Management
6. Tax Management
7. Discount Management
8. Admin and Staff Management

### Developer B

Responsible for complete implementation of:

1. Invoice Management
2. Recurring Billing Engine
3. Payment Management
4. Overdue and Collection Management
5. Financial Dashboard
6. Financial Reports and Analytics
7. Customer Portal
8. Notifications, Integration and Performance

Both developers implement frontend, backend, database interactions and testing for their assigned features.

## 7. Foundation Phase — Phase 00

Before the 16 feature phases, establish the common application foundation.

Developer A:
- Express server setup
- PostgreSQL and Prisma setup
- Initial user schema
- Authentication APIs
- Login and signup pages
- Authentication context
- Protected route integration

Developer B:
- React application shell
- Odoo-inspired purple design system
- Admin, Staff and Customer layouts
- Sidebar and navbar
- Route configuration
- All page skeletons
- Reusable UI components
- Responsive design

Both developers must agree on authentication contracts, route names, role names and shared design tokens.

## 8. Module Communication

Modules must communicate through documented public interfaces.

Rules:

- Do not import private files from another module.
- Avoid circular dependencies.
- Use documented API contracts.
- Use backend public service interfaces for internal module communication.
- Keep business logic inside the owning module.
- Validate all external requests.
- Enforce permissions at the backend.

Example:

```text
Invoice Module
     |
     | Requests subscription details
     |
Subscription Module
     |
     | Returns subscription data
     |
Invoice Module
     |
     | Calculates taxes and discounts
     |
Invoice Generation
```

## 9. Database Architecture

- PostgreSQL is the primary database.
- Prisma ORM handles database access.
- All business modules share one database.
- Each module owns its logical database entities.
- Schema modifications require coordination.
- Database migrations must be reviewed before merging.
- Monetary values must use Decimal types.
- Financial operations must use database transactions where appropriate.

One designated integrator coordinates changes to the shared Prisma schema and migration history.

## 10. Frontend Architecture

Frontend follows feature-based organization.

```text
client/src/
|
├── app/
|   ├── App.jsx
|   ├── router.jsx
|   └── providers/
|
├── shared/
|   ├── components/
|   ├── layouts/
|   ├── hooks/
|   ├── services/
|   ├── navigation/
|   └── styles/
|
├── modules/
|   ├── auth/
|   ├── dashboard/
|   ├── products/
|   ├── plans/
|   ├── quotations/
|   ├── subscriptions/
|   ├── invoices/
|   ├── discounts/
|   ├── payments/
|   ├── reports/
|   └── customer-portal/
|
└── main.jsx
```

## 11. Backend Architecture

```text
server/src/
|
├── core/
|   ├── config/
|   ├── database/
|   ├── middlewares/
|   ├── errors/
|   └── utils/
|
├── modules/
|   ├── auth/
|   ├── products/
|   ├── plans/
|   ├── quotations/
|   ├── subscriptions/
|   ├── taxes/
|   ├── discounts/
|   ├── staff/
|   ├── invoices/
|   ├── billing/
|   ├── payments/
|   ├── overdue/
|   ├── reports/
|   └── notifications/
|
├── shared/
├── app.js
└── server.js
```

## 12. Security Architecture

- Password hashing.
- HTTP-only authentication cookies.
- Server-side role authorization.
- Customer data ownership verification.
- Zod request validation.
- Rate limiting for sensitive endpoints.
- Secure CORS configuration.
- Environment-based secrets.
- Safe error handling.

## 13. Performance Architecture

The application must target page response times below two seconds, including when thousands of subscriptions exist.

Use:

- Database indexes.
- Pagination.
- Optimized Prisma queries.
- Efficient aggregations.
- Avoidance of N+1 queries.
- Appropriate caching only where useful.
- Background jobs for recurring billing.

## 14. Integration Strategy

1. Complete Phase 00 foundation.
2. Freeze shared contracts.
3. Developers work on independent feature branches.
4. Test individual modules.
5. Merge through reviewed pull requests.
6. Integrate dependent modules using documented interfaces.
7. Run end-to-end tests.
8. Verify performance and security.

## 15. Architectural Principles

- Feature independence
- Single responsibility
- Low coupling
- High cohesion
- Reusable shared components
- Clear module ownership
- Consistent API contracts
- Secure data access
- Maintainable code
- Testable business logic

## 16. Final Architecture Goal

The final system should operate as one unified subscription management platform.

Every business module must remain independently maintainable while integrating with the rest of the system through clear contracts.