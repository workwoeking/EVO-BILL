import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { generateLicenseKeyString, logAdminActivity } from '@/lib/supabase/adminService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();
    const { data: licenses, error } = await supabase
      .from('licenses')
      .select('*, customer:customers(*), customer_devices(*)')
      .order('issued_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, licenses: licenses || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = getSupabaseAdminClient();

    if (body.action === 'generate_new') {
      const newKey = generateLicenseKeyString();
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const { data, error } = await supabase
        .from('licenses')
        .insert({
          customer_id: body.customer_id,
          license_key: newKey,
          max_devices: body.max_devices || 1,
          status: 'active',
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, license: data });
    }

    if (body.action === 'revoke') {
      const { error } = await supabase
        .from('licenses')
        .update({ status: 'revoked' })
        .eq('license_id', body.license_id);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'License revoked' });
    }

    if (body.action === 'reset_device') {
      const { error } = await supabase
        .from('customer_devices')
        .delete()
        .eq('id', body.device_id);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Device unbound' });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
