/**
 * POST /api/admin/sheets/provision
 * Creates a real Google Spreadsheet via Apps Script Web App (FREE)
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

    // Check if real sheet already exists (prevent duplicates)
    const { data: existing } = await supabase
      .from('google_sheet_mapping')
      .select('spreadsheet_id, spreadsheet_url')
      .eq('customer_id', customer_id)
      .maybeSingle();

    if (existing?.spreadsheet_id && !existing.spreadsheet_id.startsWith('placeholder_')) {
      return NextResponse.json({
        success: true,
        already_existed: true,
        spreadsheet_id: existing.spreadsheet_id,
        spreadsheet_url: existing.spreadsheet_url,
        message: 'Google Sheet already exists for this customer',
      });
    }

    // Create real Google Spreadsheet via Apps Script Web App (FREE)
    const ownerEmail = process.env.SUPER_ADMIN_EMAIL || 'workwoeking@gmail.com';
    const result = await createCustomerSpreadsheet(customer_id, business_name, ownerEmail);

    if (!result.success || !result.spreadsheetId) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Sheet creation failed',
        hint: !process.env.APPS_SCRIPT_WEB_APP_URL
          ? 'Set APPS_SCRIPT_WEB_APP_URL in .env.local — Deploy SheetCreator.gs as a Web App in script.google.com'
          : undefined,
      }, { status: 500 });
    }

    // Upsert into google_sheet_mapping
    await supabase
      .from('google_sheet_mapping')
      .upsert(
        {
          customer_id,
          spreadsheet_id: result.spreadsheetId,
          spreadsheet_url: result.spreadsheetUrl,
          spreadsheet_name: result.title,
          sheet_title: result.title,
          sync_status: 'active',
          last_sync_at: new Date().toISOString(),
          last_sync_error: null,
        },
        { onConflict: 'customer_id' }
      );

    // Log the creation
    await supabase.from('sync_logs').insert({
      customer_id,
      entity_type: 'google_sheet',
      entity_id: result.spreadsheetId,
      operation: 'create',
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      already_existed: result.already_existed || false,
      spreadsheet_id: result.spreadsheetId,
      spreadsheet_url: result.spreadsheetUrl,
      title: result.title,
      message: result.already_existed
        ? 'Sheet already existed in Google Drive'
        : `Google Sheet created: ${result.title}`,
    });

  } catch (error: any) {
    console.error('[sheets/provision] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
