/**
 * EVO BILL - Google Apps Script Web App
 * Deploy as Web App → Execute as: Me → Anyone can access
 * 
 * This script handles:
 * 1. Creating a new Google Sheet for each customer (doPost with action=create)
 * 2. Appending invoice/quotation rows (action=append)
 * 3. Health check (doGet)
 */

// ─── Web App Entry Points ─────────────────────────────────────────────────────

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'EVO BILL Sheets API is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === 'create') {
      return createCustomerSheet(data);
    } else if (action === 'append') {
      return appendRowToSheet(data);
    } else {
      return jsonResponse({ success: false, error: 'Unknown action: ' + action });
    }
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ─── Create Customer Sheet ────────────────────────────────────────────────────

function createCustomerSheet(data) {
  var customerId   = data.customer_id   || 'UNKNOWN';
  var businessName = data.business_name || 'Business';
  var ownerEmail   = data.owner_email   || '';

  var title = 'EVO BILL - ' + businessName + ' - ' + customerId;

  // Check if sheet already exists in Drive to prevent duplicates
  var existing = DriveApp.getFilesByName(title);
  if (existing.hasNext()) {
    var existingFile = existing.next();
    var existingId   = existingFile.getId();
    return jsonResponse({
      success: true,
      already_existed: true,
      spreadsheet_id: existingId,
      spreadsheet_url: 'https://docs.google.com/spreadsheets/d/' + existingId + '/edit',
      title: title
    });
  }

  // Create new Spreadsheet
  var ss = SpreadsheetApp.create(title);
  var ssId  = ss.getId();
  var ssUrl = ss.getUrl();

  // ─── Setup Sheets ──────────────────────────────────────────────────────────
  // Rename default sheet to Invoices
  var sheet1 = ss.getSheets()[0];
  sheet1.setName('Invoices');
  setupInvoiceHeaders(sheet1);

  // Add more sheets
  var quotSheet   = ss.insertSheet('Quotations');
  var dailySheet  = ss.insertSheet('Daily Book');
  var expSheet    = ss.insertSheet('Expenses');
  var custSheet   = ss.insertSheet('Customers');
  var itemSheet   = ss.insertSheet('Items');

  setupQuotationHeaders(quotSheet);
  setupDailyBookHeaders(dailySheet);
  setupExpenseHeaders(expSheet);
  setupCustomerHeaders(custSheet);
  setupItemHeaders(itemSheet);

  // ─── Share with owner if email provided ───────────────────────────────────
  if (ownerEmail && ownerEmail.length > 0) {
    try {
      DriveApp.getFileById(ssId).addEditor(ownerEmail);
    } catch (shareErr) {
      // non-fatal
    }
  }

  return jsonResponse({
    success: true,
    spreadsheet_id: ssId,
    spreadsheet_url: ssUrl,
    title: title
  });
}

// ─── Append Row to Sheet ──────────────────────────────────────────────────────

function appendRowToSheet(data) {
  var ssId     = data.spreadsheet_id;
  var sheetName = data.sheet_name || 'Invoices';
  var row       = data.row;         // array of values

  if (!ssId || !row) {
    return jsonResponse({ success: false, error: 'spreadsheet_id and row are required' });
  }

  var ss    = SpreadsheetApp.openById(ssId);
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    return jsonResponse({ success: false, error: 'Sheet "' + sheetName + '" not found' });
  }

  sheet.appendRow(row);

  return jsonResponse({ success: true, message: 'Row appended to ' + sheetName });
}

// ─── Header Setup Helpers ─────────────────────────────────────────────────────

function setupInvoiceHeaders(sheet) {
  var headers = [
    'Invoice No', 'Date', 'Customer Name', 'GSTIN', 'Phone',
    'Items', 'Sub Total', 'GST %', 'GST Amount', 'Discount',
    'Grand Total', 'Payment Status'
  ];
  setHeaders(sheet, headers);
}

function setupQuotationHeaders(sheet) {
  var headers = [
    'Quote No', 'Date', 'Customer Name', 'Phone',
    'Items', 'Sub Total', 'GST %', 'GST Amount', 'Discount',
    'Grand Total', 'Status'
  ];
  setHeaders(sheet, headers);
}

function setupDailyBookHeaders(sheet) {
  setHeaders(sheet, ['Date', 'Type', 'Description', 'Credit', 'Debit', 'Balance']);
}

function setupExpenseHeaders(sheet) {
  setHeaders(sheet, ['Date', 'Category', 'Description', 'Amount', 'Note']);
}

function setupCustomerHeaders(sheet) {
  setHeaders(sheet, ['Name', 'Phone', 'Email', 'Address', 'GSTIN', 'Opening Balance', 'Added Date']);
}

function setupItemHeaders(sheet) {
  setHeaders(sheet, ['Item Name', 'HSN Code', 'Unit', 'Purchase Price', 'Sale Price', 'GST %']);
}

function setHeaders(sheet, headers) {
  var range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers]);
  range.setFontWeight('bold');
  range.setBackground('#1a73e8');
  range.setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  // Auto-resize columns
  for (var i = 1; i <= headers.length; i++) {
    sheet.setColumnWidth(i, 130);
  }
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
