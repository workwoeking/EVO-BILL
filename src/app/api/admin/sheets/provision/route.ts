/**
 * POST /api/admin/sheets/provision
 * Creates a real Google Spreadsheet for a customer using Google Service Account
 * Updates google_sheet_mapping table in Supabase
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createCustomerSpreadsheet } from '@/lib/google/sheetsService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer_id, business_name } = body;

    if (!customer_id || !business_name) {
      return NextResponse.json(
        { success: false, error: 'customer_id and business_name are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Check if sheet already exists (prevent duplicates)
    const { data: existing } = await supabase
      .from('google_sheet_mapping')
      .select('spreadsheet_id, spreadsheet_url')
      .eq('customer_id', customer_id)
      .not('spreadsheet_id', 'like', 'placeholder_%')
      .maybeSingle();

    if (existing?.spreadsheet_id) {
      return NextResponse.json({
        success: true,
        already_existed: true,
        spreadsheet_id: existing.spreadsheet_id,
        spreadsheet_url: existing.spreadsheet_url,
        message: 'Google Sheet already exists for this customer',
      });
    }

    // Create real Google Spreadsheet
    const ownerEmail = process.env.SUPER_ADMIN_EMAIL || 'workwoeking@gmail.com';
    const sheet = await createCustomerSpreadsheet(customer_id, business_name, ownerEmail);

    // Upsert into google_sheet_mapping
    const { error: upsertError } = await supabase
      .from('google_sheet_mapping')
      .upsert(
        {
          customer_id,
          spreadsheet_id: sheet.spreadsheetId,
          spreadsheet_url: sheet.spreadsheetUrl,
          sheet_title: sheet.title,
          sync_status: 'active',
          last_sync_at: new Date().toISOString(),
          last_sync_error: null,
        },
        { onConflict: 'customer_id' }
      );

    if (upsertError) {
      console.error('Supabase upsert error:', upsertError);
      // Sheet was created in Drive but DB update failed — still return sheet info
      return NextResponse.json({
        success: true,
        db_warning: upsertError.message,
        spreadsheet_id: sheet.spreadsheetId,
        spreadsheet_url: sheet.spreadsheetUrl,
        title: sheet.title,
      });
    }

    // Log the creation
    await supabase.from('sync_logs').insert({
      customer_id,
      entity_type: 'google_sheet',
      entity_id: sheet.spreadsheetId,
      operation: 'create',
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      spreadsheet_id: sheet.spreadsheetId,
      spreadsheet_url: sheet.spreadsheetUrl,
      title: sheet.title,
      message: `Google Sheet created: ${sheet.title}`,
    });
  } catch (error: any) {
    console.error('[sheets/provision] Error:', error);

    // Log the failure
    try {
      const { body: rawBody } = await req.clone().json().catch(() => ({})) as any;
      const supabase = getSupabaseAdminClient();
      await supabase.from('sync_logs').insert({
        customer_id: (await req.clone().json().catch(() => ({})) as any).customer_id || 'unknown',
        entity_type: 'google_sheet',
        entity_id: 'provision',
        operation: 'create',
        status: 'failed',
        error_message: error.message,
      });
    } catch (_) {}

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        hint: error.message.includes('credentials')
          ? 'Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY in .env.local'
          : undefined,
      },
      { status: 500 }
    );
  }
}
