# Brightloop Subscription Management System

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4.21-lightgrey.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-v18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-v5-purple.svg)](https://vitejs.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-v5-teal.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v14%2B-blue.svg)](https://www.postgresql.org/)

A production-grade, full-stack Subscription Management System developed for **Brightloop Software**. Engineered with a modular monolithic MVC architecture, featuring JWT authentication, strict role-based access control (RBAC), multi-variant product catalog, flexible recurring billing intervals, automated quotation-to-subscription conversion, idempotent recurring invoice generation, payment processing, tiered discount engines, and dynamic role-specific dashboards.

---

## Table of Contents
- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Complete Folder Structure](#complete-folder-structure)
- [Prerequisites](#prerequisites)
- [Installation Instructions](#installation-instructions)
- [PostgreSQL Database Setup & Prisma](#postgresql-database-setup--prisma)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Authentication & Authorization (RBAC)](#authentication--authorization-rbac)
- [Business Logic & Billing Rules](#business-logic--billing-rules)
- [Troubleshooting](#troubleshooting)

---

## Project Overview
Brightloop Subscription Management System provides end-to-end management of the customer billing and subscription lifecycle:
1. **Multi-Role User Hierarchy**: Admin, Staff, and Customer with complete backend-enforced authorization and customer data isolation.
2. **Catalog & Plan Flexibility**: Daily, weekly, monthly, and yearly recurring plans with quantity minimums and availability windows.
3. **Quotation Workflow**: Interactive line items with real-time tax/discount calculations, reusable templates, and one-click conversion to live subscriptions.
4. **Subscription Lifecycle**: Robust state transitions (`DRAFT` → `QUOTATION` → `CONFIRMED` → `ACTIVE` → `PAUSED` → `CLOSED`), early closure, and renewal.
5. **Billing & Invoices**: Idempotent billing period generation, double-billing prevention via composite database constraints, PDF downloads, and printing.
6. **Payment Processing**: Multi-method reconciliation (`CASH`, `CARD`, `BANK_TRANSFER`, `UPI`, `OTHER`) with overpayment protection.
7. **Discount Engine**: Percentage and fixed coupons, minimum thresholds, cross-user limits, and automatic billing application.

---

## Technology Stack

### Frontend – Client
- **React.js 18** & **Vite 5**
- **JavaScript (ES6+)**
- **Plain CSS3**: Custom design system in a clean, modern **White & Lavender** visual theme (no Tailwind CSS).
- **React Router DOM v6**: Client-side routing and layout hierarchies.
- **Axios**: HTTP client with request/response interceptors for token attachment and auto-refresh.
- **Context API**: Authentication and notification state management.

### Backend – Server
- **Node.js** (ES Modules: `"type": "module"`)
- **Express.js**: RESTful API endpoints.
- **Prisma ORM**: Relational modeling, migrations, and database transactions.
- **PostgreSQL**: ACID-compliant relational database.
- **JWT (`jsonwebtoken`)**: Stateless authentication tokens.
- **bcryptjs**: Password hashing (minimum 10 salt rounds).
- **Middleware**: Authentication, role authorization, and centralized error handling.

---

## Complete Folder Structure

```
brightloop-subscription-management/
│
├── client/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── app/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── layouts/
│   │   │   ├── AuthLayout.jsx
│   │   │   ├── DashboardLayout.jsx
│   │   │   └── Navbar.jsx
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── products/
│   │   │   ├── plans/
│   │   │   ├── quotations/
│   │   │   ├── subscriptions/
│   │   │   ├── invoices/
│   │   │   ├── payments/
│   │   │   └── discounts/
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── hooks/
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── utils/
│   │   ├── styles/
│   │   │   ├── theme.css
│   │   │   └── main.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── jwt.js
│   │   ├── middleware/
│   │   │   ├── authenticate.js
│   │   │   ├── authorize.js
│   │   │   └── errorHandler.js
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── products/
│   │   │   ├── plans/
│   │   │   ├── quotations/
│   │   │   ├── subscriptions/
│   │   │   ├── invoices/
│   │   │   ├── payments/
│   │   │   ├── discounts/
│   │   │   └── dashboard/
│   │   ├── utils/
│   │   │   ├── response.js
│   │   │   └── validators.js
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
├── docs/
│   └── architecture.md
├── .gitignore
└── README.md
```

---

## Prerequisites
- Node.js (v18.x or v20.x+)
- npm (v9.x+)
- PostgreSQL (v14.x or newer) running locally or remotely

---

## Installation Instructions

1. **Clone repository & inspect structure**:
   ```bash
   git clone <repo-url>
   cd brightloop-subscription-management
   ```

2. **Install Server Dependencies**:
   ```bash
   cd server
   npm install
   ```

3. **Install Client Dependencies**:
   ```bash
   cd ../client
   npm install
   ```

---

## PostgreSQL Database Setup & Prisma

1. Ensure your PostgreSQL server is active. Create a database:
   ```sql
   CREATE DATABASE brightloop_subscriptions;
   ```

2. Configure `server/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/brightloop_subscriptions?schema=public"
   ```

3. Run migrations and generate Prisma Client:
   ```bash
   cd server
   npx prisma migrate dev --name init
   npx prisma generate
   ```

4. (Optional) Run Database Seeder for initial Admin, Staff, and demo data:
   ```bash
   npm run prisma:seed
   ```

---

## Running the Application

### 1. Start Backend API Server
```bash
cd server
npm run dev
# Server will run on http://localhost:5000
# API Health Check: http://localhost:5000/api/health
```

### 2. Start Frontend Client
```bash
cd client
npm run dev
# Frontend will run on http://localhost:5173
```

---

## Authentication & Authorization (RBAC)

Three distinct roles are enforced via backend middleware:
- **`ADMIN`**:
  - Full system privileges.
  - Staff creation and access provisioning.
  - Comprehensive revenue, customer, and subscription analytics.
- **`STAFF`**:
  - Operational handling: Customer onboarding, quotation generation, invoice creation, and payment recording.
  - Cannot access system configuration or create staff/admin accounts.
- **`CUSTOMER`**:
  - Data isolation: Every query for subscriptions, invoices, and payments is scoped using `req.user.id`.
  - Self-service portal to review active services, invoices, and payment history.
