import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createNewCustomer, logAdminActivity } from '@/lib/supabase/adminService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('customers')
      .select('*, subscriptions(*, plan:plans(*)), licenses(*), google_sheet_mapping(*)', { count: 'exact' });

    if (search) {
      query = query.or(
        `customer_id.ilike.%${search}%,customer_name.ilike.%${search}%,business_name.ilike.%${search}%,mobile.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    if (status && status !== 'all') {
      query = query.eq('account_status', status);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: customers, count, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      customers: customers || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.customer_name || !body.business_name || !body.email || !body.mobile || !body.plan_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required customer onboarding fields.' },
        { status: 400 }
      );
    }

    const result = await createNewCustomer(body);

    return NextResponse.json({
      success: true,
      message: 'Customer onboarded successfully',
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
