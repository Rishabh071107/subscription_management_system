import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedReportsData() {
  console.log('--- Seeding Comprehensive Reports & Analytics Real-time Data ---');

  const salt = await bcrypt.genSalt(10);
  const defaultPass = await bcrypt.hash('Customer@2026!', salt);

  // 1. Ensure Staff and Admin exist
  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  let staff = await prisma.user.findFirst({ where: { role: 'STAFF' } });

  if (!staff) {
    staff = await prisma.user.create({
      data: {
        email: 'staff@brightloop.io',
        password: await bcrypt.hash('Staff@2026!', salt),
        firstName: 'Sarah',
        lastName: 'Jenkins',
        role: 'STAFF',
        isActive: true
      }
    });
  }

  // 2. Ensure Diverse Customer Accounts
  const customerProfiles = [
    { email: 'alex.morgan@acmecorp.com', firstName: 'Alex', lastName: 'Morgan', phone: '+1 555-0182' },
    { email: 'jordan.lee@apexsolutions.io', firstName: 'Jordan', lastName: 'Lee', phone: '+1 555-0211' },
    { email: 'elena.rostova@globex.com', firstName: 'Elena', lastName: 'Rostova', phone: '+1 555-0322' },
    { email: 'marcus.vance@starlight.io', firstName: 'Marcus', lastName: 'Vance', phone: '+1 555-0433' },
    { email: 'priya.sharma@nexuscloud.com', firstName: 'Priya', lastName: 'Sharma', phone: '+1 555-0544' }
  ];

  const customers = [];
  for (const cp of customerProfiles) {
    let cust = await prisma.user.findUnique({ where: { email: cp.email } });
    if (!cust) {
      cust = await prisma.user.create({
        data: {
          ...cp,
          password: defaultPass,
          role: 'CUSTOMER',
          isActive: true
        }
      });
    }
    customers.push(cust);
  }
  console.log(`Verified ${customers.length} customer accounts for analytics.`);

  // 3. Ensure Active Plans
  const plansData = [
    { name: 'Professional Monthly', code: 'PLAN-M-START', billingInterval: 'MONTHLY', price: 499.00 },
    { name: 'Enterprise Annual', code: 'PLAN-Y-ENT', billingInterval: 'YEARLY', price: 4999.00 },
    { name: 'Agile Weekly Sprint', code: 'PLAN-W-SPRINT', billingInterval: 'WEEKLY', price: 149.00 },
    { name: 'On-Demand Daily Compute', code: 'PLAN-D-BURST', billingInterval: 'DAILY', price: 29.00 }
  ];

  const plans = [];
  for (const pd of plansData) {
    let plan = await prisma.plan.findUnique({ where: { code: pd.code } });
    if (!plan) {
      plan = await prisma.plan.create({
        data: {
          ...pd,
          description: `Managed ${pd.billingInterval} subscription tier`,
          intervalCount: 1,
          minQuantity: 1,
          availabilityStartDate: new Date('2026-01-01'),
          status: 'ACTIVE'
        }
      });
    }
    plans.push(plan);
  }
  console.log(`Verified ${plans.length} subscription plans.`);

  // 4. Ensure Products
  let product = await prisma.product.findFirst();
  if (!product) {
    product = await prisma.product.create({
      data: {
        name: 'Brightloop Enterprise Cloud Platform',
        productType: 'SOFTWARE',
        salesPrice: 499.00,
        costPrice: 120.00,
        isActive: true
      }
    });
  }

  // 5. Seed Subscriptions across cohorts
  const subscriptionBlueprints = [
    { customer: customers[0], plan: plans[0], status: 'ACTIVE', totalAmount: 499.00 },
    { customer: customers[1], plan: plans[1], status: 'ACTIVE', totalAmount: 4999.00 },
    { customer: customers[2], plan: plans[2], status: 'ACTIVE', totalAmount: 149.00 },
    { customer: customers[3], plan: plans[3], status: 'ACTIVE', totalAmount: 870.00 }, // 30 days * $29
    { customer: customers[4], plan: plans[0], status: 'ACTIVE', totalAmount: 499.00 },
    { customer: customers[0], plan: plans[2], status: 'PAUSED', totalAmount: 149.00 },
    { customer: customers[1], plan: plans[0], status: 'PAUSED', totalAmount: 499.00 },
    { customer: customers[2], plan: plans[1], status: 'CLOSED', totalAmount: 4999.00 },
    { customer: customers[3], plan: plans[0], status: 'CLOSED', totalAmount: 499.00 },
    { customer: customers[4], plan: plans[1], status: 'ACTIVE', totalAmount: 4999.00 }
  ];

  const subscriptions = [];
  for (let i = 0; i < subscriptionBlueprints.length; i++) {
    const sb = subscriptionBlueprints[i];
    const subNum = `SUB-REP-${String(i + 1).padStart(3, '0')}`;
    let sub = await prisma.subscription.findUnique({ where: { subscriptionNumber: subNum } });
    if (!sub) {
      const now = new Date();
      sub = await prisma.subscription.create({
        data: {
          subscriptionNumber: subNum,
          customerId: sb.customer.id,
          planId: sb.plan.id,
          status: sb.status,
          startDate: new Date(now.getTime() - 45 * 86400000),
          nextBillingDate: new Date(now.getTime() + 15 * 86400000),
          billingInterval: sb.plan.billingInterval,
          subtotal: sb.totalAmount,
          taxRate: 18.00,
          taxAmount: Math.round(sb.totalAmount * 0.18 * 100) / 100,
          discountAmount: 0,
          totalAmount: Math.round(sb.totalAmount * 1.18 * 100) / 100,
          autoRenew: true
        }
      });
    }
    subscriptions.push(sub);
  }
  console.log(`Configured ${subscriptions.length} cohort subscriptions.`);

  // 6. Seed Invoices & Timeline Payments over the past 30 days
  const now = new Date();
  const pastDays = (d) => new Date(now.getTime() - d * 86400000);

  const paymentTimelineItems = [
    { daysAgo: 28, amount: 499.00, method: 'CARD', customer: customers[0], note: 'Monthly auto-debit' },
    { daysAgo: 25, amount: 1200.00, method: 'BANK_TRANSFER', customer: customers[1], note: 'Enterprise quarterly installment' },
    { daysAgo: 22, amount: 588.82, method: 'UPI', customer: customers[2], note: 'Weekly sprint payment via UPI' },
    { daysAgo: 19, amount: 4999.00, method: 'BANK_TRANSFER', customer: customers[3], note: 'Annual contract settlement' },
    { daysAgo: 16, amount: 750.00, method: 'CARD', customer: customers[4], note: 'Corporate card auto-charge' },
    { daysAgo: 13, amount: 1050.00, method: 'UPI', customer: customers[0], note: 'Add-on service settlement' },
    { daysAgo: 10, amount: 2499.00, method: 'BANK_TRANSFER', customer: customers[1], note: 'Mid-term renewal wire transfer' },
    { daysAgo: 7, amount: 500.00, method: 'CASH', customer: customers[2], note: 'Direct cash deposit' },
    { daysAgo: 5, amount: 1499.00, method: 'CARD', customer: customers[3], note: 'Upgrade payment' },
    { daysAgo: 3, amount: 850.00, method: 'UPI', customer: customers[4], note: 'Consulting service fee' },
    { daysAgo: 1, amount: 1200.00, method: 'BANK_TRANSFER', customer: customers[0], note: 'Accounts payable wire' },
    { daysAgo: 0, amount: 2100.00, method: 'CARD', customer: customers[1], note: 'Real-time online portal payment' },
    { daysAgo: 0, amount: 950.00, method: 'UPI', customer: customers[2], note: 'Instant UPI payment confirmation' }
  ];

  for (let i = 0; i < paymentTimelineItems.length; i++) {
    const item = paymentTimelineItems[i];
    const pmtDate = pastDays(item.daysAgo);
    const invNum = `INV-REP-${String(i + 1).padStart(3, '0')}`;
    const pmtNum = `PAY-REP-${String(i + 1).padStart(3, '0')}`;

    let invoice = await prisma.invoice.findUnique({ where: { invoiceNumber: invNum } });
    if (!invoice) {
      invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: invNum,
          customerId: item.customer.id,
          subscriptionId: subscriptions[i % subscriptions.length].id,
          issueDate: new Date(pmtDate.getTime() - 2 * 86400000),
          dueDate: new Date(pmtDate.getTime() + 14 * 86400000),
          billingPeriodStart: new Date(pmtDate.getTime() - 30 * 86400000),
          billingPeriodEnd: pmtDate,
          status: 'PAID',
          subtotal: item.amount,
          taxRate: 0,
          taxAmount: 0,
          discountAmount: 0,
          total: item.amount,
          amountPaid: item.amount,
          outstandingAmount: 0,
          notes: `Reconciled invoice for ${item.customer.firstName} ${item.customer.lastName}`,
          createdAt: pmtDate
        }
      });
    }

    let payment = await prisma.payment.findUnique({ where: { paymentNumber: pmtNum } });
    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          paymentNumber: pmtNum,
          invoiceId: invoice.id,
          customerId: item.customer.id,
          recordedById: staff.id,
          paymentMethod: item.method,
          amount: item.amount,
          paymentDate: pmtDate,
          referenceNote: item.note,
          transactionId: `TXN-REP-${1000 + i}`,
          createdAt: pmtDate
        }
      });
    }
  }
  console.log(`Seeded ${paymentTimelineItems.length} timeline payments spanning 30 days.`);

  // 7. Seed Explicit Overdue Invoices for Aging & Overdue Receivables Report
  const overdueScenarios = [
    {
      invNum: 'INV-OVERDUE-001',
      customer: customers[3],
      daysPastDue: 35,
      total: 3500.00,
      paid: 500.00,
      outstanding: 3000.00,
      note: 'Critical delinquent account. 2 follow-up notices sent.'
    },
    {
      invNum: 'INV-OVERDUE-002',
      customer: customers[4],
      daysPastDue: 18,
      total: 1850.00,
      paid: 0.00,
      outstanding: 1850.00,
      note: 'Payment grace period expired on Net 15 terms.'
    },
    {
      invNum: 'INV-OVERDUE-003',
      customer: customers[0],
      daysPastDue: 8,
      total: 948.00,
      paid: 200.00,
      outstanding: 748.00,
      note: 'Customer requested extension; follow up scheduled.'
    }
  ];

  for (const od of overdueScenarios) {
    let inv = await prisma.invoice.findUnique({ where: { invoiceNumber: od.invNum } });
    const dueDate = pastDays(od.daysPastDue);
    const issueDate = new Date(dueDate.getTime() - 15 * 86400000);

    if (!inv) {
      await prisma.invoice.create({
        data: {
          invoiceNumber: od.invNum,
          customerId: od.customer.id,
          issueDate,
          dueDate,
          billingPeriodStart: new Date(issueDate.getTime() - 30 * 86400000),
          billingPeriodEnd: issueDate,
          status: 'OVERDUE',
          subtotal: od.total,
          taxRate: 0,
          taxAmount: 0,
          discountAmount: 0,
          total: od.total,
          amountPaid: od.paid,
          outstandingAmount: od.outstanding,
          notes: od.note,
          createdAt: issueDate
        }
      });
    }
  }
  console.log(`Seeded ${overdueScenarios.length} delinquent invoices for overdue report.`);

  console.log('--- Seeding Reports & Analytics Completed Successfully ---');
}

seedReportsData()
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

