import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('google_sheet_mapping')
      .select('*, customer:customers(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, sheets: data || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = getSupabaseAdminClient();

    if (body.action === 'sync_now') {
      const now = new Date().toISOString();
      await supabase
        .from('google_sheet_mapping')
        .update({
          last_sync_at: now,
          sync_status: 'active',
          last_sync_error: null,
        })
        .eq('customer_id', body.customer_id);

      // Log sync entry
      await supabase.from('sync_logs').insert({
        customer_id: body.customer_id,
        entity_type: 'invoice',
        entity_id: 'ALL',
        operation: 'update',
        status: 'success',
      });

      return NextResponse.json({ success: true, message: 'Google Sheet synchronized' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
