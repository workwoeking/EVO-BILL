import { getSupabaseAdminClient } from './admin';
import { Customer, Subscription, License, Payment, Plan, GoogleSheetMapping, AdminActivityLog } from './types';

/**
 * Super Admin Service - Centralized Database Operations
 * Uses Service Role key (Server-side only) to query across all tenants.
 */

export async function getDashboardMetrics() {
  const supabase = getSupabaseAdminClient();

  try {
    // 1. Fetch Customers
    const { data: customers, error: custErr } = await supabase
      .from('customers')
      .select('customer_id, account_status, registration_date, created_at');

    if (custErr) throw custErr;

    const totalCustomers = customers?.length || 0;
    const activeCustomers = customers?.filter((c) => c.account_status === 'active').length || 0;
    const expiredCustomers = customers?.filter((c) => c.account_status === 'expired').length || 0;
    const suspendedCustomers = customers?.filter((c) => c.account_status === 'suspended').length || 0;

    // 2. Fetch Subscriptions for Expiry Feeds
    const today = new Date();
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(today.getDate() + 30);

    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*, customer:customers(*), plan:plans(*)')
      .order('expiry_date', { ascending: true });

    const expiringSoonList = (subscriptions || []).filter((sub) => {
      const exp = new Date(sub.expiry_date);
      return exp >= today && exp <= thirtyDaysAhead;
    });

    const expiringSoonCount = expiringSoonList.length;

    // 3. Fetch Payments & Revenue
    const { data: payments } = await supabase
      .from('payments')
      .select('total_amount, paid_amount, pending_amount, payment_date, payment_status');

    let totalRevenue = 0;
    let pendingPayments = 0;
    let monthlyRevenue = 0;
    let yearlyRevenue = 0;

    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    (payments || []).forEach((p) => {
      const pDate = new Date(p.payment_date);
      const paid = Number(p.paid_amount) || 0;
      const pending = Number(p.pending_amount) || 0;

      if (p.payment_status === 'paid') {
        totalRevenue += paid;
        if (pDate.getFullYear() === currentYear) {
          yearlyRevenue += paid;
          if (pDate.getMonth() === currentMonth) {
            monthlyRevenue += paid;
          }
        }
      } else if (p.payment_status === 'pending') {
        pendingPayments += pending > 0 ? pending : Number(p.total_amount) || 0;
      }
    });

    // 4. Recent Registrations
    const { data: recentCustomers } = await supabase
      .from('customers')
      .select('*, subscriptions(*, plan:plans(*))')
      .order('created_at', { ascending: false })
      .limit(5);

    // 5. Recent Payments
    const { data: recentPayments } = await supabase
      .from('payments')
      .select('*, customer:customers(*)')
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      success: true,
      metrics: {
        totalCustomers,
        activeCustomers,
        expiredCustomers,
        suspendedCustomers,
        expiringSoon: expiringSoonCount,
        totalRevenue,
        pendingPayments,
        monthlyRevenue,
        yearlyRevenue,
      },
      expiringSoonList: expiringSoonList.slice(0, 5),
      recentCustomers: recentCustomers || [],
      recentPayments: recentPayments || [],
    };
  } catch (error: any) {
    console.error('getDashboardMetrics error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch metrics',
      metrics: {
        totalCustomers: 0,
        activeCustomers: 0,
        expiredCustomers: 0,
        suspendedCustomers: 0,
        expiringSoon: 0,
        totalRevenue: 0,
        pendingPayments: 0,
        monthlyRevenue: 0,
        yearlyRevenue: 0,
      },
      expiringSoonList: [],
      recentCustomers: [],
      recentPayments: [],
    };
  }
}

/**
 * Generate Next Unique Customer ID (e.g. EVO-2026-0001)
 */
export async function generateNextCustomerId(): Promise<string> {
  const supabase = getSupabaseAdminClient();
  const year = new Date().getFullYear();

  const { data } = await supabase
    .from('customers')
    .select('customer_id')
    .like('customer_id', `EVO-${year}-%`)
    .order('customer_id', { ascending: false })
    .limit(1);

  if (!data || data.length === 0) {
    return `EVO-${year}-0001`;
  }

  const lastId = data[0].customer_id;
  const match = lastId.match(/EVO-\d{4}-(\d+)/);
  if (match) {
    const nextSeq = parseInt(match[1], 10) + 1;
    return `EVO-${year}-${String(nextSeq).padStart(4, '0')}`;
  }

  return `EVO-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
}

/**
 * Generate Unique 16-character License Key
 */
export function generateLicenseKeyString(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segment = () => {
    let s = '';
    for (let i = 0; i < 4; i++) {
      s += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return s;
  };
  return `EVO-${segment()}-${segment()}-${segment()}-${segment()}`;
}

/**
 * Create a Full New Customer Tenant
 */
export async function createNewCustomer(payload: {
  customer_name: string;
  business_name: string;
  email: string;
  mobile: string;
  address?: string;
  gstin?: string;
  state_code?: string;
  plan_id: string;
  payment_method?: string;
  paid_amount?: number;
  notes?: string;
}) {
  const supabase = getSupabaseAdminClient();
  const customerId = await generateNextCustomerId();

  // 1. Insert Customer
  const { data: customer, error: custErr } = await supabase
    .from('customers')
    .insert({
      customer_id: customerId,
      customer_name: payload.customer_name.trim(),
      business_name: payload.business_name.trim(),
      email: payload.email.trim().toLowerCase(),
      mobile: payload.mobile.trim(),
      address: payload.address || null,
      gstin: payload.gstin ? payload.gstin.trim().toUpperCase() : null,
      state_code: payload.state_code || '07',
      account_status: 'active',
      notes: payload.notes || null,
    })
    .select()
    .single();

  if (custErr) throw custErr;

  // 2. Fetch Plan Details
  const { data: plan } = await supabase
    .from('plans')
    .select('*')
    .eq('id', payload.plan_id)
    .single();

  const months = plan?.billing_period_months || 12;
  const startDate = new Date();
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + months);

  // 3. Create Subscription
  const { data: subscription, error: subErr } = await supabase
    .from('subscriptions')
    .insert({
      customer_id: customerId,
      plan_id: payload.plan_id,
      start_date: startDate.toISOString().split('T')[0],
      expiry_date: expiryDate.toISOString().split('T')[0],
      status: 'active',
    })
    .select()
    .single();

  if (subErr) console.error('Subscription creation warning:', subErr);

  // 4. Generate License
  const licenseKey = generateLicenseKeyString();
  const { data: license, error: licErr } = await supabase
    .from('licenses')
    .insert({
      customer_id: customerId,
      license_key: licenseKey,
      max_devices: plan?.max_devices || 2,
      status: 'active',
      expires_at: expiryDate.toISOString(),
    })
    .select()
    .single();

  if (licErr) console.error('License creation warning:', licErr);

  // 5. Record Payment
  const planPrice = Number(plan?.price_inr) || 0;
  const paid = payload.paid_amount !== undefined ? Number(payload.paid_amount) : planPrice;
  const pending = Math.max(0, planPrice - paid);

  const paymentId = `PAY-${startDate.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
  await supabase.from('payments').insert({
    payment_id: paymentId,
    customer_id: customerId,
    plan_id: payload.plan_id,
    total_amount: planPrice,
    paid_amount: paid,
    pending_amount: pending,
    payment_date: startDate.toISOString().split('T')[0],
    payment_method: (payload.payment_method as any) || 'UPI',
    payment_status: pending === 0 ? 'paid' : 'pending',
    notes: `Initial onboarding subscription for ${plan?.name || payload.plan_id}`,
  });

  // 6. Pre-provision Google Sheet Mapping Entry
  const sheetName = `EVO BILL - ${payload.business_name} - ${customerId}`;
  const mockSheetId = `1${Buffer.from(customerId + Date.now()).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 30)}`;
  await supabase.from('google_sheet_mapping').insert({
    customer_id: customerId,
    spreadsheet_id: mockSheetId,
    spreadsheet_name: sheetName,
    spreadsheet_url: `https://docs.google.com/spreadsheets/d/${mockSheetId}/edit`,
    sync_status: 'active',
  });

  // 7. Audit Log
  await logAdminActivity({
    admin_email: 'workwoeking@gmail.com',
    action: 'CREATE_CUSTOMER',
    target_type: 'CUSTOMER',
    target_id: customerId,
    metadata: {
      business_name: payload.business_name,
      plan_id: payload.plan_id,
      license_key: licenseKey,
    },
  });

  return {
    customer,
    subscription,
    license,
    customerId,
    licenseKey,
  };
}

/**
 * Log Administrative Action
 */
export async function logAdminActivity(entry: {
  admin_email: string;
  action: string;
  target_type: string;
  target_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
}) {
  try {
    const supabase = getSupabaseAdminClient();
    await supabase.from('admin_activity_logs').insert(entry);
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}
