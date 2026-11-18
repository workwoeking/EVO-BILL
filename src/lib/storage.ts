import {
  Invoice,
  Quote,
  Customer,
  InventoryItem,
  RepairJob,
  DaybookEntry,
  Employee,
  ShopSettings,
} from '@/types/billing';

export interface AppDatabase {
  settings: ShopSettings;
  invoices: Invoice[];
  quotes: Quote[];
  customers: Customer[];
  items: InventoryItem[];
  jobs: RepairJob[];
  daybook: DaybookEntry[];
  employees: Employee[];
}

export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'EVO BILL',
  tagline: 'Modern Billing & Inventory Solution',
  phone: '',
  email: '',
  address: '',
  gstin: '',
  pan: '',
  bankName: '',
  accountNo: '',
  ifsc: '',
  upiId: '',
  invoicePrefix: 'INV-',  
  nextInvoiceNumber: 1001,
  quotePrefix: 'QT-',
  nextQuoteNumber: 101,
  jobPrefix: 'JOB-',
  nextJobNumber: 201,
  currencySymbol: '₹',
  theme: 'business',
  appsScriptUrl: '',
  autoCloudSync: false,
  lastCloudSync: '',
};

const DB_KEY = 'evo_bill_desktop_db_live';

export function getDatabase(): AppDatabase {
  if (typeof window === 'undefined') {
    return {
      settings: DEFAULT_SETTINGS,
      invoices: [],
      quotes: [],
      customers: [],
      items: [],
      jobs: [],
      daybook: [],
      employees: [],
    };
  }

  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const freshDb: AppDatabase = {
        settings: DEFAULT_SETTINGS,
        invoices: [],
        quotes: [],
        customers: [],
        items: [],
        jobs: [],
        daybook: [],
        employees: [],
      };
      saveDatabase(freshDb);
      return freshDb;
    }
    const parsed = JSON.parse(raw);
    return {
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      invoices: parsed.invoices || [],
      quotes: parsed.quotes || [],
      customers: parsed.customers || [],
      items: parsed.items || [],
      jobs: parsed.jobs || [],
      daybook: parsed.daybook || [],
      employees: parsed.employees || [],
    };
  } catch (e) {
    console.error('Failed to parse database from localStorage', e);
    return {
      settings: DEFAULT_SETTINGS,
      invoices: [],
      quotes: [],
      customers: [],
      items: [],
      jobs: [],
      daybook: [],
      employees: [],
    };
  }
}

export function saveDatabase(data: AppDatabase) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

export function clearDatabase() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DB_KEY);
}
