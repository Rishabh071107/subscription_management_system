import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import KPIStatCard from '../../components/KPIStatCard.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningBilling, setRunningBilling] = useState(false);

  const { success, error } = useNotification();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/summary');
      setMetrics(res.data?.metrics || {});
    } catch (err) {
      error(err.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRunBilling = async () => {
    try {
      setRunningBilling(true);
      const res = await api.post('/invoices/run-billing-cycle');
      success(`Billing cycle completed. Evaluated: ${res.data.totalEvaluated}, Generated: ${res.data.generated.length}`);
      fetchDashboardData();
    } catch (err) {
      error(err.message || 'Billing cycle execution failed');
    } finally {
      setRunningBilling(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading system metrics..." />;
  }

  const formattedRevenue = Number(metrics?.totalRevenue || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const formattedPayments = Number(metrics?.paymentsReceived || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return (
    <div className="admin-dashboard-root">
      {/* Page Header */}
      <PageHeader
        title="Admin Executive Overview"
        subtitle="Real-time metrics, recurring revenues, and operational workflows"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={handleRunBilling}
              loading={runningBilling}
            >
              ⚡ Run Automated Billing Cycle
            </Button>
            <Link to="/quotations" className="btn btn-primary">
              + New Quotation
            </Link>
          </>
        }
      />

      {/* KPI Metrics Responsive Grid (3-col Desktop, 2-col Tablet, 1-col Mobile) */}
      <section className="metrics-grid" aria-label="Key Performance Indicators">
        <KPIStatCard
          title="Total Revenue"
          icon="💰"
          iconTheme="revenue"
          value={`$${formattedRevenue}`}
          footer="Billed across all confirmed invoices"
        />

        <KPIStatCard
          title="Payments Received"
          icon="💳"
          iconTheme="payments"
          value={`$${formattedPayments}`}
          valueColor="#059669"
          footer="Reconciled cash & digital receipts"
        />

        <KPIStatCard
          title="Active Subscriptions"
          icon="🔄"
          iconTheme="subscriptions"
          value={metrics?.activeSubscriptions || 0}
          valueColor="#714B67"
          footer={`Closed / Cancelled: ${metrics?.closedSubscriptions || 0}`}
        />

        <KPIStatCard
          title="Total Customers"
          icon="👥"
          iconTheme="customers"
          value={metrics?.totalCustomers || 0}
          footer={`Active Staff: ${metrics?.totalStaff || 0}`}
        />

        <KPIStatCard
          title="Pending Invoices"
          icon="⏳"
          iconTheme="pending"
          value={metrics?.pendingInvoices || 0}
          valueColor="#D97706"
          footer="Awaiting customer payment"
        />

        <KPIStatCard
          title="Overdue Invoices"
          icon="⚠️"
          iconTheme="overdue"
          value={metrics?.overdueInvoices || 0}
          valueColor="#DC2626"
          footer="Past specified payment terms"
        />
      </section>

      {/* Operational Sections */}
      <section className="dashboard-action-grid" aria-label="Quick Management Modules">
        <Card title="Catalog & Subscription Setup">
          <p className="card-description">
            Configure recurring plans with daily, weekly, monthly, and yearly cycles. Manage products and variants.
          </p>
          <div className="card-action-links">
            <Link to="/plans" className="btn btn-secondary btn-sm">Manage Plans</Link>
            <Link to="/products" className="btn btn-secondary btn-sm">Manage Products</Link>
            <Link to="/discounts" className="btn btn-secondary btn-sm">Coupons & Discounts</Link>
          </div>
        </Card>

        <Card title="Financial Reconciliation">
          <p className="card-description">
            Record customer payments, print/download PDF invoices, and monitor aged accounts receivables.
          </p>
          <div className="card-action-links">
            <Link to="/invoices" className="btn btn-secondary btn-sm">Browse Invoices</Link>
            <Link to="/payments" className="btn btn-secondary btn-sm">Record Payment</Link>
            <Link to="/reports" className="btn btn-secondary btn-sm">View Reports</Link>
          </div>
        </Card>

        <Card title="Staff & Access Control">
          <p className="card-description">
            Create operational staff accounts, audit users, and manage account activation/deactivation.
          </p>
          <div className="card-action-links">
            <Link to="/admin/staff" className="btn btn-secondary btn-sm">Manage Staff & Users</Link>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default AdminDashboard;
