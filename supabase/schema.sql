-- ==============================================================================
-- EVO BILL - SUPABASE POSTGRESQL PRODUCTION DDL SCHEMA
-- Multi-Tenant SaaS Architecture with Strict Row-Level Security (RLS)
-- Software Owner / Super Admin: workwoeking@gmail.com
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. SUPER ADMIN ROLES & SYSTEM ACCOUNTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL DEFAULT 'Super Admin',
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'support_agent', 'billing_manager')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 2. SUBSCRIPTION PLANS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.plans (
    id TEXT PRIMARY KEY, -- 'monthly', 'half_yearly', 'yearly', 'lifetime'
    name TEXT NOT NULL,
    billing_period_months INT NOT NULL,
    price_inr NUMERIC(10, 2) NOT NULL,
    max_devices INT NOT NULL DEFAULT 2,
    features JSONB DEFAULT '{"google_sheet_sync": true, "unlimited_invoices": true, "gst_reports": true}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Plans
INSERT INTO public.plans (id, name, billing_period_months, price_inr, max_devices)
VALUES
    ('monthly', 'Monthly Starter Plan', 1, 499.00, 1),
    ('half_yearly', 'Half-Yearly Growth Plan', 6, 2499.00, 2),
    ('yearly', 'Yearly Enterprise Plan', 12, 4499.00, 3)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price_inr = EXCLUDED.price_inr;

-- ==============================================================================
-- 3. CUSTOMER ACCOUNTS (TENANTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
    customer_id TEXT PRIMARY KEY, -- Format: EVO-YYYY-XXXX (e.g. EVO-2026-0001)
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    business_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    mobile TEXT NOT NULL,
    address TEXT,
    gstin TEXT,
    state_code TEXT,
    account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'expired', 'blocked')),
    registration_date TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    notes TEXT,
    created_by UUID REFERENCES public.admin_roles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON public.customers(mobile);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(account_status);

-- ==============================================================================
-- 4. SUBSCRIPTIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL REFERENCES public.customers(customer_id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES public.plans(id),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expiring_soon', 'expired', 'suspended')),
    auto_renew BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON public.subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expiry ON public.subscriptions(expiry_date);

-- ==============================================================================
-- 5. LICENSES & HARDWARE DEVICE BINDING
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.licenses (
    license_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL REFERENCES public.customers(customer_id) ON DELETE CASCADE,
    license_key TEXT UNIQUE NOT NULL, -- Format: EVO-XXXX-XXXX-XXXX-XXXX
    max_devices INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'suspended', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    last_validated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.customer_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL REFERENCES public.customers(customer_id) ON DELETE CASCADE,
    license_id UUID NOT NULL REFERENCES public.licenses(license_id) ON DELETE CASCADE,
    hardware_machine_id TEXT NOT NULL,
    device_name TEXT NOT NULL,
    os_info TEXT,
    ip_address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (customer_id, hardware_machine_id)
);

-- ==============================================================================
-- 6. PAYMENTS & BILLING RECORDS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    payment_id TEXT PRIMARY KEY, -- Format: PAY-YYYYMMDD-XXXX
    customer_id TEXT NOT NULL REFERENCES public.customers(customer_id) ON DELETE CASCADE,
    plan_id TEXT REFERENCES public.plans(id),
    total_amount NUMERIC(10, 2) NOT NULL,
    paid_amount NUMERIC(10, 2) NOT NULL,
    pending_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('UPI', 'Cash', 'Bank Transfer', 'Cheque', 'Online Gateway')),
    transaction_reference TEXT,
    payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'failed', 'refunded')),
    verified_by UUID REFERENCES public.admin_roles(id),
    invoice_receipt_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. GOOGLE SPREADSHEET AUTOMATION & MAPPING
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.google_sheet_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT UNIQUE NOT NULL REFERENCES public.customers(customer_id) ON DELETE CASCADE,
    spreadsheet_id TEXT NOT NULL,
    spreadsheet_name TEXT NOT NULL,
    spreadsheet_url TEXT NOT NULL,
    created_via_service_account TEXT NOT NULL DEFAULT 'evo-bill-sync@serviceaccount.com',
    sync_status TEXT NOT NULL DEFAULT 'active' CHECK (sync_status IN ('active', 'failing', 'paused', 'created_pending_auth')),
    last_sync_at TIMESTAMPTZ,
    last_sync_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL REFERENCES public.customers(customer_id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('invoice', 'quotation', 'customer', 'item', 'expense', 'daily_book')),
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'retrying')),
    error_message TEXT,
    sync_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. AUDIT LOGS & NOTIFICATIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.admin_roles(id) ON DELETE SET NULL,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    metadata JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT REFERENCES public.customers(customer_id) ON DELETE CASCADE,
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('admin', 'customer', 'both')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('subscription_expiring', 'subscription_expired', 'payment_pending', 'new_customer', 'sync_failed', 'license_revoked')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 9. CUSTOMER BUSINESS TENANT TABLES
-- ==============================================================================

-- Company Profiles
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL REFERENCES public.customers(customer_id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    gstin TEXT,
    bank_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    upi_id TEXT,
    terms TEXT,
    logo_url TEXT,
    is_default BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer's B2B / Retail Clients
CREATE TABLE IF NOT EXISTS public.business_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL REFERENCES public.customers(customer_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT,
    gstin TEXT,
    address TEXT,
    balance NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer's Inventory / Items
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL REFERENCES public.customers(customer_id) ON DELETE CASCADE,
    item_code TEXT,
    name TEXT NOT NULL,
    category TEXT,
    stock NUMERIC(10, 2) DEFAULT 0,
    unit TEXT DEFAULT 'PCS',
    purchase_price NUMERIC(10, 2) DEFAULT 0.00,
    sale_price NUMERIC(10, 2) NOT NULL,
    gst_percent NUMERIC(5, 2) DEFAULT 18.00,
    hsn_sac_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL REFERENCES public.customers(customer_id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    client_name TEXT NOT NULL,
    client_mobile TEXT,
    client_gstin TEXT,
    client_address TEXT,
    subtotal NUMERIC(12, 2) NOT NULL,
    cgst_amount NUMERIC(10, 2) DEFAULT 0.00,
    sgst_amount NUMERIC(10, 2) DEFAULT 0.00,
    igst_amount NUMERIC(10, 2) DEFAULT 0.00,
    discount_amount NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL,
    paid_amount NUMERIC(12, 2) DEFAULT 0.00,
    due_amount NUMERIC(12, 2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'PAID' CHECK (status IN ('PAID', 'PARTIAL', 'UNPAID', 'OVERDUE')),
    payment_mode TEXT DEFAULT 'CASH',
    notes TEXT,
    synced_to_sheet BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (customer_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL REFERENCES public.customers(customer_id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    unit TEXT DEFAULT 'PCS',
    rate NUMERIC(10, 2) NOT NULL,
    discount_percent NUMERIC(5, 2) DEFAULT 0.00,
    gst_percent NUMERIC(5, 2) DEFAULT 18.00,
    cgst_amount NUMERIC(10, 2) DEFAULT 0.00,
    sgst_amount NUMERIC(10, 2) DEFAULT 0.00,
    igst_amount NUMERIC(10, 2) DEFAULT 0.00,
    amount NUMERIC(12, 2) NOT NULL
);

-- Quotations
CREATE TABLE IF NOT EXISTS public.quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL REFERENCES public.customers(customer_id) ON DELETE CASCADE,
    quotation_number TEXT NOT NULL,
    quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE,
    client_name TEXT NOT NULL,
    client_mobile TEXT,
    client_address TEXT,
    total_amount NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CONVERTED')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (customer_id, quotation_number)
);

-- Daily Book / Cash Register
CREATE TABLE IF NOT EXISTS public.daily_book (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL REFERENCES public.customers(customer_id) ON DELETE CASCADE,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    category TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_mode TEXT DEFAULT 'CASH',
    description TEXT,
    reference_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Repair Jobs
CREATE TABLE IF NOT EXISTS public.repair_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL REFERENCES public.customers(customer_id) ON DELETE CASCADE,
    job_number TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_mobile TEXT NOT NULL,
    device_model TEXT NOT NULL,
    problem_description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'DIAGNOSING', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED')),
    estimated_cost NUMERIC(10, 2),
    final_cost NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (customer_id, job_number)
);

-- Employees & Salaries
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL REFERENCES public.customers(customer_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    designation TEXT,
    salary_amount NUMERIC(10, 2) NOT NULL,
    joining_date DATE,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.salary_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL REFERENCES public.customers(customer_id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    month_year TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_mode TEXT DEFAULT 'BANK_TRANSFER',
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) & HELPER FUNCTIONS
-- ==============================================================================

-- Function to check if current authenticated user is Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_roles
        WHERE auth_user_id = auth.uid()
          AND role = 'super_admin'
          AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current customer's customer_id from their auth.uid()
CREATE OR REPLACE FUNCTION public.get_auth_customer_id()
RETURNS TEXT AS $$
DECLARE
    cid TEXT;
BEGIN
    SELECT customer_id INTO cid
    FROM public.customers
    WHERE auth_user_id = auth.uid()
    LIMIT 1;
    RETURN cid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_sheet_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_book ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- RLS POLICIES FOR SUPER ADMIN
-- -----------------------------------------------------------------------------
CREATE POLICY admin_roles_policy ON public.admin_roles
    FOR ALL USING (public.is_super_admin());

CREATE POLICY plans_admin_policy ON public.plans
    FOR ALL USING (public.is_super_admin());

CREATE POLICY plans_read_policy ON public.plans
    FOR SELECT USING (TRUE); -- Plans can be viewed by all

CREATE POLICY customers_admin_policy ON public.customers
    FOR ALL USING (public.is_super_admin());

CREATE POLICY subscriptions_admin_policy ON public.subscriptions
    FOR ALL USING (public.is_super_admin());

CREATE POLICY licenses_admin_policy ON public.licenses
    FOR ALL USING (public.is_super_admin());

CREATE POLICY payments_admin_policy ON public.payments
    FOR ALL USING (public.is_super_admin());

CREATE POLICY google_sheet_admin_policy ON public.google_sheet_mapping
    FOR ALL USING (public.is_super_admin());

CREATE POLICY admin_activity_logs_policy ON public.admin_activity_logs
    FOR ALL USING (public.is_super_admin());

-- -----------------------------------------------------------------------------
-- RLS POLICIES FOR CUSTOMER DATA ISOLATION (Customer A can never see Customer B)
-- -----------------------------------------------------------------------------
CREATE POLICY customer_self_read ON public.customers
    FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY customer_devices_policy ON public.customer_devices
    FOR ALL USING (customer_id = public.get_auth_customer_id() OR public.is_super_admin());

CREATE POLICY customer_subscription_read ON public.subscriptions
    FOR SELECT USING (customer_id = public.get_auth_customer_id() OR public.is_super_admin());

CREATE POLICY companies_tenant_policy ON public.companies
    FOR ALL USING (customer_id = public.get_auth_customer_id() OR public.is_super_admin());

CREATE POLICY business_customers_tenant_policy ON public.business_customers
    FOR ALL USING (customer_id = public.get_auth_customer_id() OR public.is_super_admin());

CREATE POLICY items_tenant_policy ON public.items
    FOR ALL USING (customer_id = public.get_auth_customer_id() OR public.is_super_admin());

CREATE POLICY invoices_tenant_policy ON public.invoices
    FOR ALL USING (customer_id = public.get_auth_customer_id() OR public.is_super_admin());

CREATE POLICY invoice_items_tenant_policy ON public.invoice_items
    FOR ALL USING (customer_id = public.get_auth_customer_id() OR public.is_super_admin());

CREATE POLICY quotations_tenant_policy ON public.quotations
    FOR ALL USING (customer_id = public.get_auth_customer_id() OR public.is_super_admin());

CREATE POLICY daily_book_tenant_policy ON public.daily_book
    FOR ALL USING (customer_id = public.get_auth_customer_id() OR public.is_super_admin());

CREATE POLICY repair_jobs_tenant_policy ON public.repair_jobs
    FOR ALL USING (customer_id = public.get_auth_customer_id() OR public.is_super_admin());

CREATE POLICY employees_tenant_policy ON public.employees
    FOR ALL USING (customer_id = public.get_auth_customer_id() OR public.is_super_admin());

CREATE POLICY salary_payments_tenant_policy ON public.salary_payments
    FOR ALL USING (customer_id = public.get_auth_customer_id() OR public.is_super_admin());

-- ==============================================================================
-- 11. AUTOMATIC ADMIN REGISTRATION TRIGGER
-- Automatically makes workwoeking@gmail.com a Super Admin when the user signs up
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_admin_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email = 'workwoeking@gmail.com' THEN
        INSERT INTO public.admin_roles (auth_user_id, email, full_name, role, is_active)
        VALUES (NEW.id, NEW.email, 'Software Owner (Super Admin)', 'super_admin', TRUE)
        ON CONFLICT (email) DO UPDATE SET
            auth_user_id = NEW.id,
            is_active = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_admin_auth_user();
