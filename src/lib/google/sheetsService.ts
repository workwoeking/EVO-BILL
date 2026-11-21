/**
 * EVO BILL - Google Sheets Service
 * Uses Google Service Account for per-customer spreadsheet provisioning
 * NEVER import this in client-side code — server/API routes only
 */

import { google } from 'googleapis';

// ─── Auth ─────────────────────────────────────────────────────────────────────
function getGoogleAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new Error(
      'Google Service Account credentials are not configured. ' +
      'Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY in .env.local'
    );
  }

  // Replace escaped newlines (common when storing PEM in .env)
  const privateKey = rawKey.replace(/\\n/g, '\n');

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: privateKey,
    },
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });

  return auth;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ProvisionedSheet {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

// ─── Create a new Google Sheet for a customer ─────────────────────────────────
export async function createCustomerSpreadsheet(
  customerId: string,
  businessName: string,
  ownerEmail: string = 'workwoeking@gmail.com'
): Promise<ProvisionedSheet> {
  const auth = getGoogleAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const drive = google.drive({ version: 'v3', auth });

  const title = `EVO BILL - ${businessName} - ${customerId}`;

  // 1️⃣ Create the spreadsheet
  const createRes = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
      sheets: [
        { properties: { sheetId: 0, title: 'Invoices', index: 0 } },
        { properties: { sheetId: 1, title: 'Quotations', index: 1 } },
        { properties: { sheetId: 2, title: 'Daily Book', index: 2 } },
        { properties: { sheetId: 3, title: 'Expenses', index: 3 } },
        { properties: { sheetId: 4, title: 'Customers', index: 4 } },
        { properties: { sheetId: 5, title: 'Items', index: 5 } },
      ],
    },
  });

  const spreadsheetId = createRes.data.spreadsheetId!;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  // 2️⃣ Add header rows on each sheet
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        {
          range: 'Invoices!A1:L1',
          values: [[
            'Invoice No', 'Date', 'Customer Name', 'GSTIN', 'Phone',
            'Items', 'Sub Total', 'GST %', 'GST Amount', 'Discount',
            'Grand Total', 'Payment Status'
          ]],
        },
        {
          range: 'Quotations!A1:K1',
          values: [[
            'Quote No', 'Date', 'Customer Name', 'Phone',
            'Items', 'Sub Total', 'GST %', 'GST Amount', 'Discount',
            'Grand Total', 'Status'
          ]],
        },
        {
          range: 'Daily Book!A1:F1',
          values: [['Date', 'Type', 'Description', 'Credit', 'Debit', 'Balance']],
        },
        {
          range: 'Expenses!A1:E1',
          values: [['Date', 'Category', 'Description', 'Amount', 'Note']],
        },
        {
          range: 'Customers!A1:G1',
          values: [['Name', 'Phone', 'Email', 'Address', 'GSTIN', 'Opening Balance', 'Added Date']],
        },
        {
          range: 'Items!A1:F1',
          values: [['Item Name', 'HSN Code', 'Unit', 'Purchase Price', 'Sale Price', 'GST %']],
        },
      ],
    },
  });

  // 3️⃣ Bold the header rows
  const boldRequests = [0, 1, 2, 3, 4, 5].map((sheetId) => ({
    repeatCell: {
      range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
      cell: {
        userEnteredFormat: {
          textFormat: { bold: true },
          backgroundColor: { red: 0.2, green: 0.6, blue: 0.9 },
        },
      },
      fields: 'userEnteredFormat(textFormat,backgroundColor)',
    },
  }));

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: boldRequests },
  });

  // 4️⃣ Share with owner email (editor access)
  if (ownerEmail) {
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        role: 'writer',
        type: 'user',
        emailAddress: ownerEmail,
      },
      sendNotificationEmail: false,
    });
  }

  return { spreadsheetId, spreadsheetUrl, title };
}

// ─── Append invoice row to customer's spreadsheet ─────────────────────────────
export async function appendInvoiceToSheet(
  spreadsheetId: string,
  invoice: {
    invoiceNo: string;
    date: string;
    customerName: string;
    gstin?: string;
    phone?: string;
    items: string;
    subTotal: number;
    gstPercent: number;
    gstAmount: number;
    discount: number;
    grandTotal: number;
    paymentStatus: string;
  }
): Promise<void> {
  const auth = getGoogleAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Invoices!A:L',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        invoice.invoiceNo,
        invoice.date,
        invoice.customerName,
        invoice.gstin || '',
        invoice.phone || '',
        invoice.items,
        invoice.subTotal,
        invoice.gstPercent,
        invoice.gstAmount,
        invoice.discount,
        invoice.grandTotal,
        invoice.paymentStatus,
      ]],
    },
  });
}

// ─── Append quotation row ─────────────────────────────────────────────────────
export async function appendQuotationToSheet(
  spreadsheetId: string,
  quote: {
    quoteNo: string;
    date: string;
    customerName: string;
    phone?: string;
    items: string;
    subTotal: number;
    gstPercent: number;
    gstAmount: number;
    discount: number;
    grandTotal: number;
    status: string;
  }
): Promise<void> {
  const auth = getGoogleAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Quotations!A:K',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        quote.quoteNo,
        quote.date,
        quote.customerName,
        quote.phone || '',
        quote.items,
        quote.subTotal,
        quote.gstPercent,
        quote.gstAmount,
        quote.discount,
        quote.grandTotal,
        quote.status,
      ]],
    },
  });
}
