import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*, customer:customers(*), plan:plans(*)')
      .order('payment_date', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, payments: payments || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = getSupabaseAdminClient();

    const paymentId = `PAY-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data, error } = await supabase
      .from('payments')
      .insert({
        payment_id: paymentId,
        customer_id: body.customer_id,
        plan_id: body.plan_id || null,
        total_amount: Number(body.total_amount) || 0,
        paid_amount: Number(body.paid_amount) || 0,
        pending_amount: Number(body.pending_amount) || 0,
        payment_date: body.payment_date || new Date().toISOString().split('T')[0],
        payment_method: body.payment_method || 'UPI',
        transaction_reference: body.transaction_reference || null,
        payment_status: body.payment_status || 'paid',
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, payment: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
