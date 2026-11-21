import { getSupabaseBrowserClient } from './supabase/client';

/**
 * Phase 9: Desktop Client Tenant Sync with Supabase
 * Synchronizes local billing data (Invoices, Quotations, Items, DayBook)
 * to Supabase PostgreSQL under the authenticated customer's customer_id.
 * 
 * Works in tandem with local storage for instant responsiveness (`speed me click karo to turant respons ana chiya`).
 */

export async function syncInvoiceToSupabase(customerId: string, invoice: any) {
  try {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !customerId) return;

    // Upsert Invoice
    const { data: inv, error: invErr } = await supabase
      .from('invoices')
      .upsert(
        {
          customer_id: customerId,
          invoice_number: invoice.no,
          invoice_date: invoice.date || new Date().toISOString().split('T')[0],
          due_date: invoice.dueDate || null,
          client_name: invoice.custName || 'Cash Sale',
          client_mobile: invoice.custPhone || null,
          client_gstin: invoice.custGstin || null,
          client_address: invoice.custAddress || null,
          subtotal: Number(invoice.subtotal) || 0,
          cgst_amount: Number(invoice.tax || 0) / 2,
          sgst_amount: Number(invoice.tax || 0) / 2,
          total_amount: Number(invoice.total) || 0,
          paid_amount: Number(invoice.received) || 0,
          due_amount: Number(invoice.due) || 0,
          status: invoice.status === 'Paid' ? 'PAID' : 'UNPAID',
          payment_mode: (invoice.paymentMode || 'CASH').toUpperCase(),
          notes: invoice.notes || null,
          synced_to_sheet: true,
        },
        { onConflict: 'customer_id,invoice_number' }
      )
      .select()
      .single();

    if (invErr) {
      console.warn('[Supabase Sync] Invoice upsert notice:', invErr.message);
    }
  } catch (err: any) {
    console.error('[Supabase Sync] Sync failed:', err.message);
  }
}

export async function syncQuoteToSupabase(customerId: string, quote: any) {
  try {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !customerId) return;

    await supabase.from('quotations').upsert(
      {
        customer_id: customerId,
        quotation_number: quote.no,
        quotation_date: quote.date || new Date().toISOString().split('T')[0],
        expiry_date: quote.validUntil || null,
        client_name: quote.custName || 'Prospect',
        client_mobile: quote.custPhone || null,
        client_address: quote.custAddress || null,
        total_amount: Number(quote.total) || 0,
        status: (quote.status || 'PENDING').toUpperCase(),
        notes: quote.notes || null,
      },
      { onConflict: 'customer_id,quotation_number' }
    );
  } catch (err: any) {
    console.error('[Supabase Sync] Quote sync failed:', err.message);
  }
}
