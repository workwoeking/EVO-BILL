import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { license_key, hardware_machine_id, device_name, os_info } = body;

    if (!license_key || !hardware_machine_id) {
      return NextResponse.json(
        { valid: false, error: 'License key and hardware machine ID are required.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // 1. Check License
    const { data: license, error: licErr } = await supabase
      .from('licenses')
      .select('*, customer:customers(*)')
      .eq('license_key', license_key.trim())
      .single();

    if (licErr || !license) {
      return NextResponse.json({ valid: false, error: 'Invalid license key.' }, { status: 404 });
    }

    if (license.status !== 'active') {
      return NextResponse.json(
        { valid: false, error: `License is ${license.status}. Please contact Super Admin.` },
        { status: 403 }
      );
    }

    if (new Date(license.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, error: 'License has expired. Please renew your subscription.' },
        { status: 403 }
      );
    }

    // 2. Check Customer Status
    if (license.customer?.account_status !== 'active') {
      return NextResponse.json(
        { valid: false, error: `Account is ${license.customer?.account_status}. Access restricted.` },
        { status: 403 }
      );
    }

    // 3. Hardware Device Binding Check
    const { data: devices } = await supabase
      .from('customer_devices')
      .select('*')
      .eq('customer_id', license.customer_id);

    const existingDevice = (devices || []).find(
      (d) => d.hardware_machine_id === hardware_machine_id
    );

    if (!existingDevice) {
      // Check maximum allowed devices
      if ((devices?.length || 0) >= license.max_devices) {
        return NextResponse.json(
          {
            valid: false,
            error: `Maximum allowed devices (${license.max_devices}) reached for this license. Please unbind an older PC or upgrade plan.`,
          },
          { status: 403 }
        );
      }

      // Register new device
      await supabase.from('customer_devices').insert({
        customer_id: license.customer_id,
        license_id: license.license_id,
        hardware_machine_id,
        device_name: device_name || 'Windows Desktop PC',
        os_info: os_info || 'Windows Desktop',
      });
    } else {
      // Update last active timestamp
      await supabase
        .from('customer_devices')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', existingDevice.id);
    }

    // Update license last validated
    await supabase
      .from('licenses')
      .update({ last_validated_at: new Date().toISOString() })
      .eq('license_id', license.license_id);

    return NextResponse.json({
      valid: true,
      customerId: license.customer_id,
      customerName: license.customer.customer_name,
      businessName: license.customer.business_name,
      expiresAt: license.expires_at,
      maxDevices: license.max_devices,
      message: 'License verified successfully.',
    });
  } catch (error: any) {
    return NextResponse.json({ valid: false, error: error.message }, { status: 500 });
  }
}
