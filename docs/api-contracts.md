# API Contracts — Subscription Management System

## 1. Overview

This document defines the API communication standards and endpoint contracts for the Subscription Management System.

Backend: Express.js

Frontend: React

Database: PostgreSQL

ORM: Prisma

Base API URL:

`/api/v1`

All modules must follow the same response structure, validation rules and authorization conventions.

## 2. API Standards

### HTTP Methods

| Method | Purpose |
|---|---|
| GET | Retrieve data |
| POST | Create records or execute actions |
| PUT | Replace/update a record |
| PATCH | Partially update a record |
| DELETE | Delete or archive where permitted |

### Common Status Codes

| Code | Meaning |
|---|---|
| 200 | Successful request |
| 201 | Resource created |
| 204 | Successful request without response body |
| 400 | Invalid request |
| 401 | Authentication required |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict or duplicate |
| 422 | Validation error |
| 429 | Too many requests |
| 500 | Internal server error |

## 3. Standard Response Structure

### Success Response

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": "uuid",
    "name": "Project Management Software"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid product details",
    "details": [
      {
        "field": "salesPrice",
        "message": "Sales price must be greater than or equal to zero"
      }
    ]
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## 4. Authentication APIs

Base path: `/api/v1/auth`

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| POST | `/signup` | Customer registration | Public |
| POST | `/login` | User login | Public |
| POST | `/logout` | Logout | Authenticated |
| GET | `/me` | Current user details | Authenticated |
| POST | `/forgot-password` | Request reset link | Public |
| POST | `/reset-password` | Reset password | Public |

### Signup Request

```json
{
  "name": "John",
  "email": "john@example.com",
  "password": "Secure@123"
}
```

Public signup must always assign CUSTOMER role.

### Login Request

```json
{
  "email": "john@example.com",
  "password": "Secure@123"
}
```

The server sets the configured HTTP-only authentication cookie. Do not return the password or password hash.

### Current User Response

```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "name": "John",
    "email": "john@example.com",
    "role": "CUSTOMER"
  }
}
```

The browser must send credentials for cookie-based authentication according to the configured CORS policy.

## 5. Staff Management APIs

Base path: `/api/v1/staff`

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/` | List staff | Admin |
| POST | `/` | Create staff | Admin |
| GET | `/:id` | Staff details | Admin |
| PATCH | `/:id` | Update staff | Admin |
| PATCH | `/:id/status` | Activate/deactivate staff | Admin |

Staff accounts must not be created through public signup.

## 6. Customer Management APIs

Base path: `/api/v1/customers`

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/` | List customers | Admin, Staff |
| POST | `/` | Create customer through authorized workflow | Admin, Staff |
| GET | `/:id` | Customer details | Admin, Staff |
| PATCH | `/:id` | Update customer | Admin, Staff |

The server must validate permissions and prevent unauthorized access to customer information.

## 7. Product Management APIs

Base path: `/api/v1/products`

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/` | List products | Admin, Staff |
| POST | `/` | Create product | Admin |
| GET | `/:id` | Product details | Admin, Staff |
| PATCH | `/:id` | Update product | Admin |
| PATCH | `/:id/status` | Activate/deactivate product | Admin |
| GET | `/:id/variants` | List variants | Admin, Staff |
| POST | `/:id/variants` | Add variant | Admin |
| PATCH | `/variants/:variantId` | Update variant | Admin |

### Product Request

```json
{
  "name": "Project Management Software",
  "type": "SOFTWARE",
  "salesPrice": 1000,
  "costPrice": 500,
  "notes": "Business project management application"
}
```

### Variant Request

```json
{
  "name": "Odoo",
  "additionalPrice": 560
}
```

The final price is calculated on the backend.

## 8. Subscription Plan APIs

Base path: `/api/v1/plans`

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/` | List plans | Admin, Staff |
| POST | `/` | Create plan | Admin |
| GET | `/:id` | Plan details | Admin, Staff |
| PATCH | `/:id` | Update plan | Admin |
| PATCH | `/:id/status` | Activate/deactivate | Admin |

### Plan Request

```json
{
  "name": "Professional Monthly",
  "price": 999,
  "billingFrequency": "MONTHLY",
  "minimumQuantity": 1,
  "availableFrom": "2026-10-01",
  "availableUntil": "2027-10-01",
  "autoClose": true,
  "allowEarlyClose": true,
  "allowPause": true,
  "allowRenewal": true
}
```

The exact plan-product association must follow the finalized database model.

## 9. Quotation APIs

Base path: `/api/v1/quotations`

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/` | List quotations | Admin, Staff |
| POST | `/` | Create quotation | Admin, Staff |
| GET | `/:id` | Quotation details | Admin, Staff |
| PATCH | `/:id` | Update quotation | Admin, Staff |
| POST | `/:id/confirm` | Confirm quotation acceptance | Authorized workflow |
| POST | `/:id/cancel` | Cancel quotation | Admin, Staff |

### Quotation Request

```json
{
  "customerId": "customer-uuid",
  "templateId": "template-uuid",
  "validUntil": "2026-11-30",
  "paymentTerms": "Payment due within 15 days",
  "lines": [
    {
      "productId": "product-uuid",
      "quantity": 5,
      "unitPrice": 1000
    }
  ]
}
```

The server must validate product prices and totals rather than trusting browser-submitted calculations.

## 10. Subscription APIs

Base path: `/api/v1/subscriptions`

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/` | List subscriptions | Admin, Staff |
| POST | `/` | Create subscription | Admin, Staff |
| GET | `/:id` | Subscription details | Admin, Staff |
| PATCH | `/:id` | Update permitted fields | Admin, Staff |
| POST | `/:id/confirm` | Confirm subscription | Authorized users |
| POST | `/:id/activate` | Activate subscription | Authorized users |
| POST | `/:id/pause` | Pause subscription | Authorized users |
| POST | `/:id/resume` | Resume subscription | Authorized users |
| POST | `/:id/renew` | Renew subscription | Authorized users |
| POST | `/:id/close` | Close subscription | Authorized users |

The required subscription lifecycle is:

`DRAFT → QUOTATION → CONFIRMED → ACTIVE → CLOSED`

Additional pause/resume operations must be handled according to the agreed lifecycle policy.

## 11. Tax Management APIs

Base path: `/api/v1/taxes`

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/` | List taxes | Admin, Staff |
| POST | `/` | Create tax rule | Admin |
| GET | `/:id` | Tax details | Admin, Staff |
| PATCH | `/:id` | Update tax rule | Admin |
| POST | `/calculate` | Calculate tax preview | Authorized users |

Tax calculation must follow the agreed tax configuration and rounding rules.

## 12. Discount APIs

Base path: `/api/v1/discounts`

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/` | List discounts | Admin |
| POST | `/` | Create discount | Admin |
| GET | `/:id` | Discount details | Admin |
| PATCH | `/:id` | Update discount | Admin |
| PATCH | `/:id/status` | Activate/deactivate | Admin |
| POST | `/validate` | Check eligibility | Authorized workflow |

### Discount Request

```json
{
  "name": "Bulk Purchase Discount",
  "discountType": "PERCENTAGE",
  "discountValue": 10,
  "minimumPurchase": 5000,
  "minimumQuantity": 5,
  "startDate": "2026-10-01",
  "endDate": "2026-12-31",
  "usageLimit": 100,
  "scope": "PRODUCT"
}
```

Discount usage must be checked and updated transactionally.

## 13. Invoice APIs

Base path: `/api/v1/invoices`

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/` | List invoices | Admin, Staff |
| GET | `/:id` | Invoice details | Admin, Staff |
| POST | `/` | Create authorized invoice | Admin, Staff |
| POST | `/:id/confirm` | Confirm invoice | Admin, Staff |
| POST | `/:id/cancel` | Cancel invoice | Admin, Staff |
| POST | `/:id/send` | Send invoice | Admin, Staff |
| GET | `/:id/print` | Download/print invoice | Admin, Staff, owning Customer |

Required invoice states:

`DRAFT → CONFIRMED → PAID`

Cancelled invoices must be handled separately and must not be treated as paid.

## 14. Recurring Billing APIs

Base path: `/api/v1/billing`

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| POST | `/run` | Trigger billing run | Admin or protected scheduler |
| GET | `/runs` | List billing runs | Admin |
| GET | `/runs/:id` | Billing run details | Admin |
| GET | `/due` | View subscriptions due for billing | Admin, Staff |

The scheduled billing process must:

- Identify eligible active subscriptions.
- Calculate billing periods.
- Generate invoices.
- Prevent duplicate billing.
- Record successful and failed processing.
- Support safe retries.

Scheduler authentication must not rely on an ordinary public endpoint.

## 15. Payment APIs

Base path: `/api/v1/payments`

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/` | List payments | Admin, Staff |
| POST | `/` | Record payment | Admin, Staff |
| GET | `/:id` | Payment details | Admin, Staff |
| GET | `/invoice/:invoiceId` | Payments for invoice | Admin, Staff |

### Payment Request

```json
{
  "invoiceId": "invoice-uuid",
  "paymentMethod": "UPI",
  "amount": 5000,
  "paymentDate": "2026-10-31T10:00:00+05:30",
  "note": "October subscription payment"
}
```

The backend must calculate the outstanding balance and invoice payment status.

## 16. Overdue Management APIs

Base path: `/api/v1/overdue`

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/invoices` | List overdue invoices | Admin, Staff |
| GET | `/summary` | Overdue summary | Admin, Staff |
| GET | `/invoices/:id` | Overdue invoice details | Admin, Staff |

An invoice is overdue when:
- Its due date has passed.
- It has a positive outstanding balance.
- It is not cancelled.

## 17. Financial Dashboard APIs

Base path: `/api/v1/reports/dashboard`

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/summary` | Financial KPI summary | Admin |
| GET | `/revenue` | Revenue received over time | Admin |
| GET | `/subscriptions` | Subscription statistics | Admin |
| GET | `/payments` | Payment summary | Admin |
| GET | `/overdue` | Overdue summary | Admin |

### Example Summary Response

```json
{
  "success": true,
  "data": {
    "activeSubscriptions": 120,
    "revenueReceived": 150000,
    "outstandingAmount": 25000,
    "overdueInvoices": 8
  }
}
```

The numbers above are illustrative only. Real values must come from database queries.

Revenue received must be calculated from recorded payments, not simply invoice totals.

## 18. Financial Reports APIs

Base path: `/api/v1/reports`

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/subscriptions` | Subscription report | Admin |
| GET | `/invoices` | Invoice report | Admin |
| GET | `/payments` | Payment report | Admin |
| GET | `/revenue` | Revenue report | Admin |

Suggested query parameters:

- `startDate`
- `endDate`
- `customerId`
- `status`
- `page`
- `limit`

All filters must be validated.

## 19. Customer Portal APIs

Base path: `/api/v1/portal`

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/dashboard` | Customer dashboard | Customer |
| GET | `/subscriptions` | Own subscriptions | Customer |
| GET | `/subscriptions/:id` | Own subscription details | Customer |
| GET | `/invoices` | Own invoices | Customer |
| GET | `/invoices/:id` | Own invoice details | Customer |
| GET | `/profile` | Own profile | Customer |
| PATCH | `/profile` | Update permitted profile fields | Customer |

Customer identity must be obtained from the authenticated session.

Never trust a customer ID supplied by the frontend to determine ownership.

## 20. Notifications APIs

Base path: `/api/v1/notifications`

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/` | List permitted notifications | Authenticated |
| GET | `/:id` | Notification details | Owner/Admin as permitted |

Notification delivery should be handled through a backend provider abstraction or background job.

Do not expose provider secrets through API responses.

## 21. API Security Requirements

- All protected endpoints require authentication.
- Role authorization must be enforced on the backend.
- Customer endpoints must enforce resource ownership.
- Validate all request bodies, parameters and query strings.
- Use secure cookies.
- Configure CORS correctly.
- Apply rate limits to sensitive endpoints.
- Use database transactions for financial operations.
- Never trust client-side totals or discount calculations.
- Avoid returning sensitive database fields.

## 22. Pagination and Filtering

List endpoints should support:

```text
?page=1&limit=10&search=keyword
```

Where applicable, also support status and date filters.

Pagination response must follow the common response format.

Set a sensible maximum page size to prevent expensive requests.

## 23. Frontend API Integration Standards

- Use centralized API configuration.
- Use a shared HTTP client.
- Enable credentials for cookie-based authentication.
- Keep API calls in module-specific service files.
- Handle 401, 403, 404 and 500 responses consistently.
- Display useful loading, success and error states.
- Do not duplicate backend business calculations in frontend code.

## 24. Module Integration Rules

Before implementing a dependent module:

1. Read this API contract.
2. Confirm the endpoint and response format.
3. Agree on any missing fields with the owning developer.
4. Use mock data only until the actual API is ready.
5. Do not independently change an established contract.
6. Update this document through a reviewed change if the contract changes.

## 25. Important Contract Decisions

The endpoint list is the agreed initial API blueprint. Exact request fields, response fields, status transitions and permissions must be finalized with the owning module before implementation.

In particular, coordinate:
- Product and plan pricing.
- Subscription-to-invoice relationships.
- Tax calculation and rounding.
- Discount eligibility and usage.
- Partial payments and overpayment.
- Invoice cancellation.
- Billing period and timezone.
- Email provider behavior.

## 26. Final Goal

All 16 feature phases must communicate through consistent, secure and documented APIs.

The final application should function as one integrated subscription management platform, without tightly coupling the internal implementation of individual modules.