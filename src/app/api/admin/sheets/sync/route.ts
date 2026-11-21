/**
 * POST /api/admin/sheets/sync
 * Appends invoice/quotation row to customer's Google Sheet via Apps Script Web App
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { appendRowToSheet, buildInvoiceRow, buildQuotationRow } from '@/lib/google/sheetsService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer_id, type, data } = body;

    if (!customer_id || !type || !data) {
      return NextResponse.json(
        { success: false, error: 'customer_id, type, and data are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Get the customer's spreadsheet ID
    const { data: mapping } = await supabase
      .from('google_sheet_mapping')
      .select('spreadsheet_id')
      .eq('customer_id', customer_id)
      .maybeSingle();

    if (!mapping?.spreadsheet_id || mapping.spreadsheet_id.startsWith('placeholder_')) {
      return NextResponse.json(
        { success: false, error: 'No real Google Sheet found. Create it first.' },
        { status: 404 }
      );
    }

    const spreadsheetId = mapping.spreadsheet_id;
    let result;

    if (type === 'invoice') {
      const row = buildInvoiceRow(data);
      result = await appendRowToSheet(spreadsheetId, 'Invoices', row);
    } else if (type === 'quotation') {
      const row = buildQuotationRow(data);
      result = await appendRowToSheet(spreadsheetId, 'Quotations', row);
    } else {
      return NextResponse.json({ success: false, error: `Unknown type: ${type}` }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    // Update last_sync_at
    await supabase
      .from('google_sheet_mapping')
      .update({ last_sync_at: new Date().toISOString(), sync_status: 'active', last_sync_error: null })
      .eq('customer_id', customer_id);

    // Log success
    await supabase.from('sync_logs').insert({
      customer_id,
      entity_type: type,
      entity_id: data.invoiceNo || data.quoteNo || 'unknown',
      operation: 'append',
      status: 'success',
    });

    return NextResponse.json({ success: true, message: `${type} synced to Google Sheet` });
  } catch (error: any) {
    console.error('[sheets/sync] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
