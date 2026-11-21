import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { generateNextCustomerId, generateLicenseKeyString } from '@/lib/supabase/adminService';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth_error=No_code_provided`);
  }

  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    '';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // ignore in route handler
        }
      },
    },
  });

  const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

  if (sessionError || !session?.user) {
    console.error('OAuth exchange error:', sessionError);
    return NextResponse.redirect(`${origin}/?auth_error=Failed_to_exchange_token`);
  }

  const user = session.user;
  const email = (user.email || '').toLowerCase();
  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0];

  const adminClient = getSupabaseAdminClient();

  // 1. If Super Admin (Owner: workwoeking@gmail.com)
  if (email === 'workwoeking@gmail.com') {
    await adminClient.from('admin_roles').upsert(
      {
        auth_user_id: user.id,
        email: email,
        full_name: 'Software Owner (Super Admin)',
        role: 'super_admin',
        is_active: true,
      },
      { onConflict: 'email' }
    );

    const response = NextResponse.redirect(`${origin}/admin`);
    response.cookies.set('evo_admin_session', 'active', {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });
    return response;
  }

  // 2. Regular Customer / New User Auto-Onboarding
  try {
    // Check if customer already exists for this auth_user_id or email
    const { data: existingCust } = await adminClient
      .from('customers')
      .select('customer_id, account_status, auth_user_id')
      .or(`auth_user_id.eq.${user.id},email.eq.${email}`)
      .limit(1)
      .single();

    let customerId = existingCust?.customer_id;

    if (!existingCust) {
      // Automatically register new customer in Supabase!
      customerId = await generateNextCustomerId();
      const businessName = `${fullName}'s Business`;

      // Insert customer
      await adminClient.from('customers').insert({
        customer_id: customerId,
        auth_user_id: user.id,
        customer_name: fullName,
        business_name: businessName,
        email: email,
        mobile: user.phone || '9999999999',
        account_status: 'active',
      });

      // Default Monthly Trial Subscription (1 Month)
      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);

      await adminClient.from('subscriptions').insert({
        customer_id: customerId,
        plan_id: 'monthly',
        start_date: startDate.toISOString().split('T')[0],
        expiry_date: expiryDate.toISOString().split('T')[0],
        status: 'active',
      });

      // Generate Hardware License Key
      const licenseKey = generateLicenseKeyString();
      await adminClient.from('licenses').insert({
        customer_id: customerId,
        license_key: licenseKey,
        max_devices: 1,
        status: 'active',
        expires_at: expiryDate.toISOString(),
      });

      // Google Sheet Mapping
      const sheetName = `EVO BILL - ${businessName} - ${customerId}`;
      const mockSheetId = `1${Buffer.from(customerId + Date.now()).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 30)}`;
      await adminClient.from('google_sheet_mapping').insert({
        customer_id: customerId,
        spreadsheet_id: mockSheetId,
        spreadsheet_name: sheetName,
        spreadsheet_url: `https://docs.google.com/spreadsheets/d/${mockSheetId}/edit`,
        sync_status: 'active',
      });
    } else if (!existingCust.auth_user_id) {
      // Link auth_user_id if was created by admin without auth
      await adminClient
        .from('customers')
        .update({ auth_user_id: user.id })
        .eq('customer_id', customerId);
    }

    const response = NextResponse.redirect(`${origin}/?auth_success=true&customer_id=${customerId}`);
    // Store customer session cookie
    response.cookies.set('evo_customer_id', customerId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
    });
    return response;
  } catch (err) {
    console.error('Customer onboarding error:', err);
    return NextResponse.redirect(`${origin}/?auth_error=Customer_provisioning_failed`);
  }
}
