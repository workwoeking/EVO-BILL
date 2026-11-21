import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { logAdminActivity } from '@/lib/supabase/adminService';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id;
    const supabase = getSupabaseAdminClient();

    const { data: customer, error } = await supabase
      .from('customers')
      .select('*, subscriptions(*, plan:plans(*)), licenses(*, customer_devices(*)), google_sheet_mapping(*), payments(*)')
      .eq('customer_id', customerId)
      .single();

    if (error || !customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id;
    const body = await req.json();
    const supabase = getSupabaseAdminClient();

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.account_status) updates.account_status = body.account_status;
    if (body.customer_name) updates.customer_name = body.customer_name;
    if (body.business_name) updates.business_name = body.business_name;
    if (body.mobile) updates.mobile = body.mobile;
    if (body.gstin !== undefined) updates.gstin = body.gstin;
    if (body.address !== undefined) updates.address = body.address;
    if (body.notes !== undefined) updates.notes = body.notes;

    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('customer_id', customerId)
      .select()
      .single();

    if (error) throw error;

    // If extending subscription
    if (body.extend_months) {
      const months = parseInt(body.extend_months, 10);
      const { data: currentSub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('customer_id', customerId)
        .order('expiry_date', { ascending: false })
        .limit(1)
        .single();

      if (currentSub) {
        const currExp = new Date(currentSub.expiry_date);
        const baseDate = currExp > new Date() ? currExp : new Date();
        baseDate.setMonth(baseDate.getMonth() + months);

        await supabase
          .from('subscriptions')
          .update({
            expiry_date: baseDate.toISOString().split('T')[0],
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentSub.id);

        // Also extend license
        await supabase
          .from('licenses')
          .update({
            expires_at: baseDate.toISOString(),
            status: 'active',
          })
          .eq('customer_id', customerId);
      }
    }

    await logAdminActivity({
      admin_email: 'workwoeking@gmail.com',
      action: 'UPDATE_CUSTOMER',
      target_type: 'CUSTOMER',
      target_id: customerId,
      metadata: body,
    });

    return NextResponse.json({ success: true, customer: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
