/**
 * EVO BILL - Google Sheets Service (via Apps Script Web App - FREE)
 * 
 * NO Google Cloud Console needed.
 * NO Service Account needed.
 * 100% FREE using Google Apps Script Web App.
 * 
 * Setup:
 * 1. Open: https://script.google.com
 * 2. Create new project, paste SheetCreator.gs code
 * 3. Deploy → New Deployment → Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy Web App URL → paste in .env.local as APPS_SCRIPT_WEB_APP_URL
 */

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_WEB_APP_URL || '';

export interface SheetResult {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  title?: string;
  already_existed?: boolean;
  error?: string;
}

// ─── Create a new Google Sheet for a customer ─────────────────────────────────
export async function createCustomerSpreadsheet(
  customerId: string,
  businessName: string,
  ownerEmail: string = 'workwoeking@gmail.com'
): Promise<SheetResult> {
  if (!APPS_SCRIPT_URL) {
    return {
      success: false,
      error: 'APPS_SCRIPT_WEB_APP_URL is not set in .env.local. Deploy the SheetCreator.gs as a Web App first.',
    };
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, // Apps Script requires text/plain for JSON POST
      body: JSON.stringify({
        action: 'create',
        customer_id: customerId,
        business_name: businessName,
        owner_email: ownerEmail,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Apps Script returned ${response.status}: ${text.slice(0, 200)}` };
    }

    const result = await response.json();
    return {
      success: result.success ?? false,
      spreadsheetId: result.spreadsheet_id,
      spreadsheetUrl: result.spreadsheet_url,
      title: result.title,
      already_existed: result.already_existed,
      error: result.error,
    };
  } catch (err: any) {
    return { success: false, error: `Fetch failed: ${err.message}` };
  }
}

// ─── Append a row to customer's sheet ─────────────────────────────────────────
export async function appendRowToSheet(
  spreadsheetId: string,
  sheetName: 'Invoices' | 'Quotations' | 'Daily Book' | 'Expenses' | 'Customers' | 'Items',
  row: (string | number)[]
): Promise<{ success: boolean; error?: string }> {
  if (!APPS_SCRIPT_URL) {
    return { success: false, error: 'APPS_SCRIPT_WEB_APP_URL not configured' };
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'append',
        spreadsheet_id: spreadsheetId,
        sheet_name: sheetName,
        row,
      }),
    });

    if (!response.ok) {
      return { success: false, error: `Apps Script error: ${response.status}` };
    }

    const result = await response.json();
    return { success: result.success ?? false, error: result.error };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── Helper: Build invoice row array ─────────────────────────────────────────
export function buildInvoiceRow(invoice: {
  invoiceNo: string; date: string; customerName: string;
  gstin?: string; phone?: string; items: string;
  subTotal: number; gstPercent: number; gstAmount: number;
  discount: number; grandTotal: number; paymentStatus: string;
}): (string | number)[] {
  return [
    invoice.invoiceNo, invoice.date, invoice.customerName,
    invoice.gstin || '', invoice.phone || '', invoice.items,
    invoice.subTotal, invoice.gstPercent, invoice.gstAmount,
    invoice.discount, invoice.grandTotal, invoice.paymentStatus,
  ];
}

// ─── Helper: Build quotation row array ───────────────────────────────────────
export function buildQuotationRow(quote: {
  quoteNo: string; date: string; customerName: string; phone?: string;
  items: string; subTotal: number; gstPercent: number; gstAmount: number;
  discount: number; grandTotal: number; status: string;
}): (string | number)[] {
  return [
    quote.quoteNo, quote.date, quote.customerName,
    quote.phone || '', quote.items,
    quote.subTotal, quote.gstPercent, quote.gstAmount,
    quote.discount, quote.grandTotal, quote.status,
  ];
}
