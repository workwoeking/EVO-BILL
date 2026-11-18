/**
 * ====================================================================
 * EVO BILL - Google Apps Script Cloud Engine
 * Destination Account: workwoeking@gmail.com
 * ====================================================================
 * 
 * This script connects your EVO BILL desktop/web application directly to 
 * your Google Sheets and sends real-time email summaries to workwoeking@gmail.com.
 * 
 * HOW TO DEPLOY:
 * 1. Open Google Sheets (https://sheets.new) in your Google account (workwoeking@gmail.com).
 * 2. Click "Extensions" -> "Apps Script".
 * 3. Delete any code in the editor and PASTE THIS ENTIRE FILE.
 * 4. Click "Deploy" (top right) -> "New deployment".
 * 5. Select type: "Web app".
 * 6. Set Description: "EVO BILL Sync".
 * 7. Set "Execute as": "Me (workwoeking@gmail.com)".
 * 8. Set "Who has access": "Anyone" (allows EVO BILL app to send data).
 * 9. Click "Deploy", authorize permissions, and COPY the Web App URL.
 * 10. Paste the Web App URL in EVO BILL Settings -> Google Cloud Sync!
 */

const TARGET_EMAIL = "workwoeking@gmail.com";

function doPost(e) {
  try {
    var raw = e.postData.contents;
    var payload = JSON.parse(raw);
    var action = payload.action || 'sync';
    var db = payload.data;
    var targetEmail = payload.targetEmail || TARGET_EMAIL;

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      ss = SpreadsheetApp.create("EVO BILL - Live Database & Cloud Backup");
    }

    if (action === 'sync' || action === 'push') {
      // 1. Sync Invoices
      syncInvoices(ss, db.invoices || []);
      
      // 2. Sync Customers
      syncCustomers(ss, db.customers || []);
      
      // 3. Sync Inventory Items
      syncItems(ss, db.items || []);
      
      // 4. Sync Daily Cashbook
      syncDaybook(ss, db.daybook || []);
      
      // 5. Sync Repair Jobs
      syncJobs(ss, db.jobs || []);
      
      // 6. Sync Salary
      syncSalary(ss, db.employees || []);
      
      // 7. Save Master JSON Backup (for 100% lossless restore)
      saveMasterBackup(ss, db);

      // 8. Optionally send email notification if requested or on new entries
      if (payload.sendEmail) {
        sendBackupEmail(targetEmail, db, ss.getUrl());
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "All data successfully saved to Google Sheets and workwoeking@gmail.com!",
        sheetUrl: ss.getUrl(),
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'email_report') {
      sendBackupEmail(targetEmail, db, ss.getUrl());
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Email report sent to " + targetEmail,
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "Unknown action"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || 'pull';
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'ping') {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        status: "connected",
        account: TARGET_EMAIL,
        sheetUrl: ss ? ss.getUrl() : ""
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Pull database from Master Backup sheet
    if (action === 'pull') {
      var sheet = ss.getSheetByName("Master_JSON_Backup");
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: "No backup sheet found yet."
        })).setMimeType(ContentService.MimeType.JSON);
      }
      var jsonStr = sheet.getRange(1, 1).getValue();
      return ContentService.createTextOutput(jsonStr).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput("EVO BILL Google Apps Script Service is Active.").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/* ====================================================================
 * SHEET SYNC HELPERS
 * ==================================================================== */

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function formatHeader(sheet, headers) {
  sheet.clear();
  sheet.appendRow(headers);
  var range = sheet.getRange(1, 1, 1, headers.length);
  range.setFontWeight("bold");
  range.setBackground("#ff7a00");
  range.setFontColor("#ffffff");
}

function syncInvoices(ss, invoices) {
  var sheet = getOrCreateSheet(ss, "Invoices");
  formatHeader(sheet, ["Invoice No", "Date", "Customer Name", "Phone", "Subtotal (₹)", "Tax/GST (₹)", "Total (₹)", "Paid (₹)", "Due (₹)", "Status", "Items Summary"]);
  if (!invoices || !invoices.length) return;

  var rows = invoices.map(function(i) {
    var itemsSummary = (i.items || []).map(function(it) {
      return it.name + " (" + it.qty + "x" + it.price + ")";
    }).join(", ");

    return [
      i.no || "",
      i.date || "",
      i.custName || "",
      i.custPhone || "",
      i.subtotal || 0,
      i.tax || 0,
      i.total || 0,
      i.received || 0,
      i.due || 0,
      i.status || "Pending",
      itemsSummary
    ];
  });

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  sheet.autoResizeColumns(1, 11);
}

function syncCustomers(ss, customers) {
  var sheet = getOrCreateSheet(ss, "Customers");
  formatHeader(sheet, ["Customer ID", "Customer Name", "Phone", "GSTIN", "Address", "Opening Balance (₹)", "Current Balance (₹)"]);
  if (!customers || !customers.length) return;

  var rows = customers.map(function(c) {
    return [
      c.id || "",
      c.name || "",
      c.phone || "",
      c.gstin || "",
      c.address || "",
      c.openingBalance || 0,
      c.balance || 0
    ];
  });

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  sheet.autoResizeColumns(1, 7);
}

function syncItems(ss, items) {
  var sheet = getOrCreateSheet(ss, "Inventory_Items");
  formatHeader(sheet, ["Item Name", "HSN/SAC", "Unit", "Sale Price (₹)", "Purchase Price (₹)", "Stock In Hand", "Min Alert"]);
  if (!items || !items.length) return;

  var rows = items.map(function(it) {
    return [
      it.name || "",
      it.hsn || "",
      it.unit || "Pcs",
      it.salePrice || 0,
      it.purchasePrice || 0,
      it.stock || 0,
      it.minStock || 5
    ];
  });

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  sheet.autoResizeColumns(1, 7);
}

function syncDaybook(ss, daybook) {
  var sheet = getOrCreateSheet(ss, "Daily_Cashbook");
  formatHeader(sheet, ["Date", "Type (In/Out)", "Flow (Cash/Online)", "Category", "Description", "Amount (₹)"]);
  if (!daybook || !daybook.length) return;

  var rows = daybook.map(function(d) {
    return [
      d.date || "",
      d.type === 'in' ? 'Money IN (+)' : 'Money OUT (-)',
      d.flow === 'cash' ? 'Physical Cash' : 'UPI / Bank / Online',
      d.category || "General",
      d.desc || "",
      d.amount || 0
    ];
  });

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  sheet.autoResizeColumns(1, 6);
}

function syncJobs(ss, jobs) {
  var sheet = getOrCreateSheet(ss, "Repair_Jobs");
  formatHeader(sheet, ["Job No", "Date", "Customer", "Phone", "Device / Model", "Reported Problem", "Estimate (₹)", "Advance (₹)", "Status"]);
  if (!jobs || !jobs.length) return;

  var rows = jobs.map(function(j) {
    return [
      j.jobNo || "",
      j.date || "",
      j.custName || "",
      j.phone || "",
      j.device || "",
      j.problem || "",
      j.estimate || 0,
      j.advance || 0,
      j.status || "Received"
    ];
  });

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  sheet.autoResizeColumns(1, 9);
}

function syncSalary(ss, employees) {
  var sheet = getOrCreateSheet(ss, "Staff_Salary");
  formatHeader(sheet, ["Staff Name", "Phone", "Role", "Monthly Salary (₹)", "Total Payments Recorded"]);
  if (!employees || !employees.length) return;

  var rows = employees.map(function(e) {
    var totalPaid = (e.payments || []).reduce(function(sum, p) { return sum + (p.amount || 0); }, 0);
    return [
      e.name || "",
      e.phone || "",
      e.role || "",
      e.monthlySalary || 0,
      totalPaid
    ];
  });

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  sheet.autoResizeColumns(1, 5);
}

function saveMasterBackup(ss, db) {
  var sheet = getOrCreateSheet(ss, "Master_JSON_Backup");
  sheet.clear();
  sheet.getRange(1, 1).setValue(JSON.stringify(db));
}

/* ====================================================================
 * EMAIL BACKUP HELPER TO workwoeking@gmail.com
 * ==================================================================== */

function sendBackupEmail(email, db, sheetUrl) {
  var totalSales = (db.invoices || []).reduce(function(s, i) { return s + (i.total || 0); }, 0);
  var totalReceived = (db.invoices || []).reduce(function(s, i) { return s + (i.received || 0); }, 0);
  var totalDue = (db.invoices || []).reduce(function(s, i) { return s + (i.due || 0); }, 0);
  var invoicesCount = (db.invoices || []).length;
  var customersCount = (db.customers || []).length;
  var jobsCount = (db.jobs || []).length;

  var subject = "📊 EVO BILL Cloud Backup Summary - " + new Date().toLocaleDateString();

  var htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fafafa;">
      <div style="background: linear-gradient(135deg, #ff7a00, #ea580c); padding: 18px 20px; border-radius: 8px; color: white;">
        <h2 style="margin: 0; font-size: 22px;">EVO BILL Next-Gen Cloud Backup</h2>
        <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Saved for: ${email}</p>
      </div>

      <div style="padding: 20px 0;">
        <h3 style="color: #1e293b; margin-top: 0;">Live Business Snapshot:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <tr>
            <td style="padding: 10px; border: 1px solid #cbd5e1; background: #fff; font-weight: bold;">Total Sales Generated:</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; background: #fff; text-align: right; color: #ea580c; font-weight: bold;">₹${totalSales.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #cbd5e1; background: #fff; font-weight: bold;">Total Cash & Online Received:</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; background: #fff; text-align: right; color: #16a34a; font-weight: bold;">₹${totalReceived.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #cbd5e1; background: #fff; font-weight: bold;">Pending Due Balance:</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; background: #fff; text-align: right; color: #dc2626; font-weight: bold;">₹${totalDue.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #cbd5e1; background: #fff;">Total Invoices:</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; background: #fff; text-align: right;">${invoicesCount} Bills</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #cbd5e1; background: #fff;">Total Customers:</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; background: #fff; text-align: right;">${customersCount} Accounts</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #cbd5e1; background: #fff;">Open Repair Jobs:</td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; background: #fff; text-align: right;">${jobsCount} Devices</td>
          </tr>
        </table>

        <div style="text-align: center; margin-top: 25px;">
          <a href="${sheetUrl}" style="background: #ff7a00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Open Live Google Sheet Database &rarr;
          </a>
        </div>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 11px; color: #64748b; text-align: center;">
        This automated backup was generated by EVO BILL Desktop Software and sent to ${email}.
      </div>
    </div>
  `;

  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody
  });
}
