// ==============================================================================
// EVO BILL - SUPABASE DATABASE TYPES
// ==============================================================================

export type AdminRoleType = 'super_admin' | 'support_agent' | 'billing_manager';
export type AccountStatusType = 'active' | 'suspended' | 'expired' | 'blocked';
export type SubscriptionStatusType = 'active' | 'expiring_soon' | 'expired' | 'suspended';
export type LicenseStatusType = 'active' | 'revoked' | 'suspended' | 'expired';
export type PaymentStatusType = 'paid' | 'pending' | 'failed' | 'refunded';
export type PaymentMethodType = 'UPI' | 'Cash' | 'Bank Transfer' | 'Cheque' | 'Online Gateway';

export interface AdminRole {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  role: AdminRoleType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  billing_period_months: number;
  price_inr: number;
  max_devices: number;
  features: {
    google_sheet_sync?: boolean;
    unlimited_invoices?: boolean;
    gst_reports?: boolean;
    [key: string]: unknown;
  };
  is_active: boolean;
  created_at: string;
}

export interface Customer {
  customer_id: string;
  auth_user_id?: string | null;
  customer_name: string;
  business_name: string;
  email: string;
  mobile: string;
  address?: string | null;
  gstin?: string | null;
  state_code?: string | null;
  account_status: AccountStatusType;
  registration_date: string;
  last_login_at?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  subscriptions?: Subscription[];
  licenses?: License[];
  google_sheet?: GoogleSheetMapping | null;
}

export interface Subscription {
  id: string;
  customer_id: string;
  plan_id: string;
  start_date: string;
  expiry_date: string;
  status: SubscriptionStatusType;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
  plan?: Plan;
}

export interface License {
  license_id: string;
  customer_id: string;
  license_key: string;
  max_devices: number;
  status: LicenseStatusType;
  expires_at: string;
  issued_at: string;
  last_validated_at?: string | null;
  devices?: CustomerDevice[];
}

export interface CustomerDevice {
  id: string;
  customer_id: string;
  license_id: string;
  hardware_machine_id: string;
  device_name: string;
  os_info?: string | null;
  ip_address?: string | null;
  is_active: boolean;
  registered_at: string;
  last_active_at: string;
}

export interface Payment {
  payment_id: string;
  customer_id: string;
  plan_id?: string | null;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  payment_date: string;
  payment_method: PaymentMethodType;
  transaction_reference?: string | null;
  payment_status: PaymentStatusType;
  verified_by?: string | null;
  invoice_receipt_number?: string | null;
  notes?: string | null;
  created_at: string;
  customer?: Customer;
}

export interface GoogleSheetMapping {
  id: string;
  customer_id: string;
  spreadsheet_id: string;
  spreadsheet_name: string;
  spreadsheet_url: string;
  created_via_service_account: string;
  sync_status: 'active' | 'failing' | 'paused' | 'created_pending_auth';
  last_sync_at?: string | null;
  last_sync_error?: string | null;
  created_at: string;
}

export interface AdminActivityLog {
  id: string;
  admin_id?: string | null;
  admin_email: string;
  action: string;
  target_type: string;
  target_id?: string | null;
  metadata?: Record<string, unknown> | null;
  ip_address?: string | null;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  customer_id?: string | null;
  recipient_type: 'admin' | 'customer' | 'both';
  title: string;
  message: string;
  type: 'subscription_expiring' | 'subscription_expired' | 'payment_pending' | 'new_customer' | 'sync_failed' | 'license_revoked';
  is_read: boolean;
  created_at: string;
}
