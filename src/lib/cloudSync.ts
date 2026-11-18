import { AppDatabase, saveDatabase } from './storage';

export const DEFAULT_TARGET_EMAIL = 'workwoeking@gmail.com';

export interface SyncResult {
  success: boolean;
  message: string;
  sheetUrl?: string;
  error?: string;
}

/**
 * Pushes entire database to Google Apps Script / Google Sheets
 * and triggers automated email to workwoeking@gmail.com
 */
export async function syncToGoogleCloud(
  db: AppDatabase,
  options: { sendEmail?: boolean; scriptUrl?: string } = {}
): Promise<SyncResult> {
  const url = options.scriptUrl || db.settings.appsScriptUrl;

  if (!url || !url.trim().startsWith('http')) {
    return {
      success: false,
      message: 'Google Apps Script Web App URL is not configured.',
      error: 'Please paste your Google Apps Script Web App URL in Settings first.',
    };
  }

  try {
    const payload = {
      action: 'sync',
      targetEmail: DEFAULT_TARGET_EMAIL,
      sendEmail: options.sendEmail ?? true,
      data: db,
    };

    // Google Apps Script requires text/plain to avoid CORS preflight rejection
    const response = await fetch(url.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      try {
        const json = await response.json();
        // Update last synced timestamp in local storage
        const updatedDb = {
          ...db,
          settings: {
            ...db.settings,
            lastCloudSync: new Date().toISOString(),
          },
        };
        saveDatabase(updatedDb);

        return {
          success: true,
          message: json.message || `Successfully synced to Google Sheets and ${DEFAULT_TARGET_EMAIL}!`,
          sheetUrl: json.sheetUrl,
        };
      } catch {
        // If response is not JSON due to redirect, but HTTP 200 was received
        return {
          success: true,
          message: `Data saved to Google Sheets and email sent to ${DEFAULT_TARGET_EMAIL}!`,
        };
      }
    } else {
      return {
        success: false,
        message: `Google Server returned error: ${response.status}`,
        error: response.statusText,
      };
    }
  } catch (err: any) {
    console.error('Cloud Sync Error:', err);
    return {
      success: false,
      message: 'Failed to connect to Google Apps Script.',
      error: err.message || String(err),
    };
  }
}

/**
 * Pulls the latest backup from Google Apps Script / Google Sheets
 */
export async function pullFromGoogleCloud(scriptUrl: string): Promise<{ success: boolean; data?: AppDatabase; error?: string }> {
  if (!scriptUrl || !scriptUrl.trim().startsWith('http')) {
    return { success: false, error: 'Invalid Google Apps Script URL' };
  }

  try {
    const fetchUrl = scriptUrl.includes('?') ? `${scriptUrl}&action=pull` : `${scriptUrl}?action=pull`;
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      return { success: false, error: `Server error: ${response.status}` };
    }

    const data: AppDatabase = await response.json();
    if (data && data.settings) {
      return { success: true, data };
    } else {
      return { success: false, error: 'Invalid backup structure received from Google Sheets' };
    }
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Directly sends a business report email to workwoeking@gmail.com
 */
export async function sendEmailReport(db: AppDatabase): Promise<SyncResult> {
  return await syncToGoogleCloud(db, { sendEmail: true });
}
