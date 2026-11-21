/**
 * POST /api/admin/sheets/sync
 * Syncs invoice/quotation data to customer's Google Spreadsheet
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { appendInvoiceToSheet, appendQuotationToSheet } from '@/lib/google/sheetsService';

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
    const { data: mapping, error: mapError } = await supabase
      .from('google_sheet_mapping')
      .select('spreadsheet_id')
      .eq('customer_id', customer_id)
      .maybeSingle();

    if (mapError || !mapping?.spreadsheet_id) {
      return NextResponse.json(
        { success: false, error: 'No Google Sheet found for this customer. Create it first.' },
        { status: 404 }
      );
    }

    const spreadsheetId = mapping.spreadsheet_id;

    // Skip placeholder IDs
    if (spreadsheetId.startsWith('placeholder_')) {
      return NextResponse.json(
        { success: false, error: 'Customer has a placeholder sheet. Provision a real sheet first.' },
        { status: 422 }
      );
    }

    // Sync based on type
    if (type === 'invoice') {
      await appendInvoiceToSheet(spreadsheetId, data);
    } else if (type === 'quotation') {
      await appendQuotationToSheet(spreadsheetId, data);
    } else {
      return NextResponse.json({ success: false, error: `Unknown sync type: ${type}` }, { status: 400 });
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
