import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Brightloop Subscription Management System ---');

  // 1. Seed Users
  const salt = await bcrypt.genSalt(10);
  const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@brightloop.io';
  const adminRawPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || 'Brightloop@2026';
  const adminPassword = await bcrypt.hash(adminRawPassword, salt);
  const staffPassword = await bcrypt.hash('Staff@2026!', salt);
  const customerPassword = await bcrypt.hash('Customer@2026!', salt);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+1 555-0199',
      role: 'ADMIN',
      isActive: true
    }
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@brightloop.io' },
    update: {},
    create: {
      email: 'staff@brightloop.io',
      password: staffPassword,
      firstName: 'Sarah',
      lastName: 'Jenkins',
      phone: '+1 555-0144',
      role: 'STAFF',
      isActive: true
    }
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@acmecorp.com' },
    update: {},
    create: {
      email: 'customer@acmecorp.com',
      password: customerPassword,
      firstName: 'Alex',
      lastName: 'Morgan',
      phone: '+1 555-0182',
      role: 'CUSTOMER',
      isActive: true
    }
  });

  console.log('Seeded Users: Admin, Staff, Customer');

  // 2. Seed Products
  const odooProduct = await prisma.product.create({
    data: {
      name: 'Odoo ERP Suite',
      productType: 'SOFTWARE',
      salesPrice: 1200.00,
      costPrice: 400.00,
      notes: 'Enterprise modular ERP system with multi-currency support',
      isActive: true,
      variants: {
        create: [
          { name: 'Additional module', additionalPrice: 560.00, sku: 'ODOO-MOD-01' },
          { name: 'Priority Support SLA', additionalPrice: 250.00, sku: 'ODOO-SLA-01' }
        ]
      }
    },
    include: { variants: true }
  });

  const crmProduct = await prisma.product.create({
    data: {
      name: 'Brightloop CRM Pro',
      productType: 'SOFTWARE',
      salesPrice: 499.00,
      costPrice: 120.00,
      notes: 'Omnichannel customer relationship and sales pipeline platform',
      isActive: true,
      variants: {
        create: [
          { name: 'AI Lead Scoring', additionalPrice: 150.00, sku: 'CRM-AI-01' },
          { name: 'Multi-Tenant Portal', additionalPrice: 300.00, sku: 'CRM-MT-01' }
        ]
      }
    },
    include: { variants: true }
  });

  const cloudProduct = await prisma.product.create({
    data: {
      name: 'Cloud Security Shield',
      productType: 'SERVICE',
      salesPrice: 299.00,
      costPrice: 75.00,
      notes: 'Automated vulnerability scanning and 24/7 web application firewall',
      isActive: true
    }
  });

  console.log('Seeded Products & Variants');

  // 3. Seed Plans
  const monthlyPlan = await prisma.plan.upsert({
    where: { code: 'PLAN-M-START' },
    update: {},
    create: {
      name: 'Professional Monthly',
      code: 'PLAN-M-START',
      description: 'Standard monthly billing for growing businesses with 15-day payment terms',
      billingInterval: 'MONTHLY',
      intervalCount: 1,
      price: 499.00,
      minQuantity: 1,
      availabilityStartDate: new Date(),
      status: 'ACTIVE'
    }
  });

  const yearlyPlan = await prisma.plan.upsert({
    where: { code: 'PLAN-Y-ENT' },
    update: {},
    create: {
      name: 'Enterprise Annual',
      code: 'PLAN-Y-ENT',
      description: 'Annual commitment with 20% cost savings and premier SLA',
      billingInterval: 'YEARLY',
      intervalCount: 1,
      price: 4999.00,
      minQuantity: 1,
      availabilityStartDate: new Date(),
      status: 'ACTIVE'
    }
  });

  const weeklyPlan = await prisma.plan.upsert({
    where: { code: 'PLAN-W-SPRINT' },
    update: {},
    create: {
      name: 'Agile Weekly Sprint',
      code: 'PLAN-W-SPRINT',
      description: 'Short cycle billing for rapid development sprints',
      billingInterval: 'WEEKLY',
      intervalCount: 1,
      price: 149.00,
      minQuantity: 1,
      availabilityStartDate: new Date(),
      status: 'ACTIVE'
    }
  });

  const dailyPlan = await prisma.plan.upsert({
    where: { code: 'PLAN-D-BURST' },
    update: {},
    create: {
      name: 'On-Demand Daily Compute',
      code: 'PLAN-D-BURST',
      description: 'Per-day high-performance cloud resource allocation',
      billingInterval: 'DAILY',
      intervalCount: 1,
      price: 29.00,
      minQuantity: 1,
      availabilityStartDate: new Date(),
      status: 'ACTIVE'
    }
  });

  console.log('Seeded Plans (Daily, Weekly, Monthly, Yearly)');

  // 4. Seed Discounts
  await prisma.discount.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      description: '10% off for initial customer subscriptions',
      discountType: 'PERCENTAGE',
      value: 10.00,
      scope: 'ENTIRE_SUBSCRIPTION',
      minPurchaseAmount: 200.00,
      minQuantity: 1,
      startDate: new Date(),
      usageLimit: 100,
      isActive: true
    }
  });

  await prisma.discount.upsert({
    where: { code: 'FLAT50' },
    update: {},
    create: {
      code: 'FLAT50',
      description: '$50 flat reduction on orders over $300',
      discountType: 'FIXED',
      value: 50.00,
      scope: 'ENTIRE_SUBSCRIPTION',
      minPurchaseAmount: 300.00,
      startDate: new Date(),
      usageLimit: 50,
      isActive: true
    }
  });

  console.log('Seeded Discounts (Percentage & Fixed)');

  // 5. Seed Demo Quotation
  const quotation = await prisma.quotation.create({
    data: {
      quotationNumber: 'QT-2026-0001',
      customerId: customer.id,
      createdById: staff.id,
      status: 'CONFIRMED',
      templateName: 'Standard SaaS Suite',
      isTemplate: true,
      subtotal: 1499.00,
      taxRate: 18.00,
      taxAmount: 269.82,
      discountAmount: 50.00,
      totalAmount: 1718.82,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: 'Initial quotation including CRM Pro with AI lead scoring and Cloud Shield',
      lines: {
        create: [
          {
            productId: crmProduct.id,
            variantId: crmProduct.variants[0].id,
            description: 'Brightloop CRM Pro + AI Lead Scoring',
            quantity: 1,
            unitPrice: 649.00,
            taxRate: 18.00,
            subtotal: 649.00,
            total: 765.82
          },
          {
            productId: cloudProduct.id,
            description: 'Cloud Security Shield',
            quantity: 1,
            unitPrice: 299.00,
            taxRate: 18.00,
            subtotal: 299.00,
            total: 352.82
          }
        ]
      }
    }
  });

  // 6. Seed Active Subscription
  const subStartDate = new Date();
  const subNextBilling = new Date();
  subNextBilling.setMonth(subNextBilling.getMonth() + 1);

  const subscription = await prisma.subscription.create({
    data: {
      subscriptionNumber: 'SUB-2026-0001',
      customerId: customer.id,
      planId: monthlyPlan.id,
      quotationId: quotation.id,
      status: 'ACTIVE',
      startDate: subStartDate,
      nextBillingDate: subNextBilling,
      paymentTerms: 'Net 15',
      billingInterval: 'MONTHLY',
      subtotal: 948.00,
      taxRate: 18.00,
      taxAmount: 170.64,
      discountAmount: 50.00,
      totalAmount: 1068.64,
      autoRenew: true,
      notes: 'Active live subscription converted from confirmed quote',
      lines: {
        create: [
          {
            productId: crmProduct.id,
            variantId: crmProduct.variants[0].id,
            quantity: 1,
            unitPrice: 649.00,
            taxRate: 18.00,
            subtotal: 649.00,
            total: 765.82
          },
          {
            productId: cloudProduct.id,
            quantity: 1,
            unitPrice: 299.00,
            taxRate: 18.00,
            subtotal: 299.00,
            total: 352.82
          }
        ]
      }
    }
  });

  // 7. Seed Invoice
  const invDueDate = new Date();
  invDueDate.setDate(invDueDate.getDate() + 15);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0001',
      customerId: customer.id,
      subscriptionId: subscription.id,
      billingPeriodStart: subStartDate,
      billingPeriodEnd: subNextBilling,
      issueDate: new Date(),
      dueDate: invDueDate,
      status: 'PARTIALLY_PAID',
      subtotal: 948.00,
      taxRate: 18.00,
      taxAmount: 170.64,
      discountAmount: 50.00,
      total: 1068.64,
      amountPaid: 500.00,
      outstandingAmount: 568.64,
      notes: 'Initial billing cycle invoice',
      lines: {
        create: [
          {
            productId: crmProduct.id,
            variantId: crmProduct.variants[0].id,
            description: 'Brightloop CRM Pro + AI Lead Scoring (Monthly)',
            quantity: 1,
            unitPrice: 649.00,
            taxRate: 18.00,
            subtotal: 649.00,
            total: 765.82
          },
          {
            productId: cloudProduct.id,
            description: 'Cloud Security Shield (Monthly)',
            quantity: 1,
            unitPrice: 299.00,
            taxRate: 18.00,
            subtotal: 299.00,
            total: 352.82
          }
        ]
      }
    }
  });

  // 8. Seed Payment against invoice
  await prisma.payment.create({
    data: {
      paymentNumber: 'PAY-2026-0001',
      invoiceId: invoice.id,
      customerId: customer.id,
      recordedById: staff.id,
      paymentMethod: 'BANK_TRANSFER',
      amount: 500.00,
      paymentDate: new Date(),
      referenceNote: 'Partial bank wire transfer received',
      transactionId: 'WIRE-8893410'
    }
  });

  console.log('Seeded Quotation, Subscription, Invoice, and Payment');
  console.log('--- Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
