import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { logAdminActivity } from '@/lib/supabase/adminService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();

    const [plansRes, subsRes] = await Promise.all([
      supabase.from('plans').select('*').order('billing_period_months', { ascending: true }),
      supabase
        .from('subscriptions')
        .select('*, customer:customers(*), plan:plans(*)')
        .order('created_at', { ascending: false }),
    ]);

    return NextResponse.json({
      success: true,
      plans: plansRes.data || [],
      subscriptions: subsRes.data || [],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = getSupabaseAdminClient();

    // Create or update plan
    if (body.action === 'save_plan') {
      const { id, name, billing_period_months, price_inr, max_devices } = body.plan;
      const { data, error } = await supabase
        .from('plans')
        .upsert({
          id,
          name,
          billing_period_months,
          price_inr,
          max_devices,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, plan: data });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
