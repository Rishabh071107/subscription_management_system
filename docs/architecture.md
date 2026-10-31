# Brightloop Subscription Management System - Architecture & API Reference

## 1. System Overview
Brightloop Subscription Management System is a modular monolithic SaaS platform engineered with Node.js/Express, PostgreSQL, Prisma ORM, and React.js (Vite). It delivers comprehensive subscription lifecycle management, recurring automated billing, quota tracking, quotation-to-subscription workflows, payments handling, discounts, and role-based access control.

## 2. Core Modules
- **Authentication**: JWT token management, bcryptjs hashing, registration, login, password recovery.
- **Role-Based Access Control**:
  - `ADMIN`: Global permissions, staff provisioning, revenue oversight, audit log analysis.
  - `STAFF`: Operational handling of customers, quotations, invoices, and payments.
  - `CUSTOMER`: Self-service portal scoped strictly to user-owned subscriptions and payment records.
- **Product & Plan Management**: Configurable billing cycles (DAILY, WEEKLY, MONTHLY, YEARLY), multi-variant pricing, availability windows.
- **Quotations & Subscriptions**: Quotation workflows with revision states, automated conversion to active subscriptions, pause/resume/renew controls.
- **Invoices & Payments**: Idempotent billing period generation, multi-channel payment reconciliation (Card, UPI, Bank Transfer, Cash), PDF generation/printing.
- **Discounts Engine**: Percentage & fixed discounts, threshold gating (min quantity, min spend), usage limits, and product-scoped vouchers.
- **Reporting & Dashboards**: Aggregated metrics for MRR, active subscribers, collections, outstanding aging, and churn analysis.

## 3. Database Schema Overview
The database uses PostgreSQL with 15 relational entities managed through Prisma ORM:
- `User`, `PasswordResetToken`, `AuditLog`
- `Product`, `ProductVariant`, `Plan`
- `Quotation`, `QuotationLine`
- `Subscription`, `SubscriptionLine`
- `Invoice`, `InvoiceLine`
- `Payment`, `Discount`, `DiscountUsage`
