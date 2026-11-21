import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();

    const [customersRes, paymentsRes, subsRes] = await Promise.all([
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
      supabase.from('payments').select('*, customer:customers(*)').order('payment_date', { ascending: false }),
      supabase.from('subscriptions').select('*, plan:plans(*), customer:customers(*)'),
    ]);

    return NextResponse.json({
      success: true,
      customers: customersRes.data || [],
      payments: paymentsRes.data || [],
      subscriptions: subsRes.data || [],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
