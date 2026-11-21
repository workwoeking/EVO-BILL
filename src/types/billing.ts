export interface InvoiceItem {
  id: string;
  name: string;
  hsn?: string;
  qty: number;
  unit?: string;
  price: number;
  discount?: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
}

export type InvoiceStatus = 'Paid' | 'Pending' | 'Partial' | 'Draft' | 'Cancelled';

export interface Invoice {
  id: string;
  no: string;
  date: string;
  dueDate?: string;
  custId: string;
  custName: string;
  custPhone?: string;
  custGstin?: string;
  custAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  received: number;
  due: number;
  status: InvoiceStatus;
  paymentMode?: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
  notes?: string;
}

export type QuoteType = 'Estimate' | 'Quotation' | 'Proforma';

export interface Quote {
  id: string;
  no: string;
  type: QuoteType;
  date: string;
  validUntil?: string;
  custId: string;
  custName: string;
  custPhone?: string;
  custGstin?: string;
  custAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string;
  status: 'Draft' | 'Sent' | 'Approved' | 'Converted';
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  gstin?: string;
  address?: string;
  openingBalance: number;
  balance: number; // Positive = Due from customer, Negative = Advance from customer
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  hsn?: string;
  unit: string;
  salePrice: number;
  purchasePrice?: number;
  stock: number;
  minStock?: number;
}

export type JobStatus = 'Received' | 'In Progress' | 'Ready' | 'Delivered';

export interface RepairJob {
  id: string;
  jobNo: string;
  date: string;
  custName: string;
  phone: string;
  device: string;
  serialNo?: string;
  problem: string;
  estimate: number;
  advance: number;
  status: JobStatus;
  deliveryDate?: string;
  technicianNotes?: string;
}

export interface DaybookEntry {
  id: string;
  date: string;
  type: 'in' | 'out';
  flow: 'cash' | 'online';
  category: string;
  desc: string;
  amount: number;
}

export interface SalaryPayment {
  id: string;
  date: string;
  month: string;
  amount: number;
  paymentMode: 'Cash' | 'Online';
  note?: string;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  role: string;
  monthlySalary: number;
  joiningDate: string;
  payments: SalaryPayment[];
}

export interface ShopSettings {
  shopName: string;
  tagline?: string;
  phone: string;
  email?: string;
  address: string;
  gstin?: string;
  pan?: string;
  bankName?: string;
  accountNo?: string;
  ifsc?: string;
  upiId?: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  quotePrefix: string;
  nextQuoteNumber: number;
  jobPrefix: string;
  nextJobNumber: number;
  currencySymbol: string;
  theme: 'business' | 'midnight' | 'dark' | 'light';
  appsScriptUrl?: string;
  autoCloudSync?: boolean;
  lastCloudSync?: string;
}
