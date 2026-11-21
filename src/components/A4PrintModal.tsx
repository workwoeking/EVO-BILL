'use client';

import React, { useEffect, useRef } from 'react';
import { Printer, Share2, Download, X, CheckCircle, FileText } from 'lucide-react';
import { Invoice, Quote, ShopSettings } from '@/types/billing';
import { formatCurrency, formatDate } from '@/lib/utils';
import { numberToWordsIndian } from '@/lib/numberToWords';

interface A4PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Invoice | Quote | null;
  settings: ShopSettings;
  docType?: 'Invoice' | 'Quotation' | 'Estimate' | 'Proforma';
  autoPrint?: boolean;
}

export default function A4PrintModal({
  isOpen,
  onClose,
  document: doc,
  settings,
  docType = 'Invoice',
  autoPrint = false,
}: A4PrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && autoPrint && doc) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint, doc]);

  if (!isOpen || !doc) return null;

  const isInvoice = 'received' in doc && 'due' in doc;
  const received = isInvoice ? (doc as Invoice).received || 0 : 0;
  const due = isInvoice ? (doc as Invoice).due || 0 : 0;
  const items = doc.items || [];

  const subtotal = doc.subtotal || 0;
  const discount = doc.discount || 0;
  const taxable = Math.max(0, subtotal - discount);
  const tax = doc.tax || 0;
  const cgst = tax / 2;
  const sgst = tax / 2;
  const total = doc.total || 0;
  const totalInWords = numberToWordsIndian(total);

  const title =
    docType === 'Invoice'
      ? 'TAX INVOICE'
      : docType === 'Estimate'
      ? 'ESTIMATE / COST SHEET'
      : docType === 'Proforma'
      ? 'PROFORMA INVOICE'
      : 'COMMERCIAL QUOTATION';

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      if (window.electronAPI) {
        window.electronAPI.printInvoice({ pageSize: 'A4' });
      } else {
        window.print();
      }
    }
  };

  const handleWhatsApp = () => {
    const custPhone = (doc.custPhone || '').replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      `Hello ${doc.custName},\nHere is your ${title} #${doc.no} from ${settings.shopName}.\nTotal Amount: ${formatCurrency(
        total
      )}${isInvoice ? `\nBalance Due: ${formatCurrency(due)}` : ''}\nThank you for choosing us!`
    );
    const url = custPhone ? `https://wa.me/${custPhone}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(url, '_blank');
  };

  // Generate UPI QR link if UPI ID is present
  const upiPayUrl = settings.upiId
    ? `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(
        settings.shopName
      )}&am=${total}&cu=INR`
    : '';

  const qrImageUrl = upiPayUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(upiPayUrl)}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-start bg-black/85 backdrop-blur-md overflow-y-auto p-2 sm:p-4 print:p-0 print:bg-white print:static">
      {/* Top Action Toolbar (Hidden during print) */}
      <div className="w-full max-w-[210mm] bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 py-3 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-2xl print:hidden sticky top-2 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>{title} Preview</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono">
                A4 Standard
              </span>
            </h3>
            <p className="text-[10px] text-zinc-400">
              #{doc.no} &middot; {doc.custName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-black font-bold text-xs rounded-lg transition-all shadow-lg shadow-orange-500/20 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Now (A4)</span>
          </button>

          <button
            onClick={handleWhatsApp}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all active:scale-95"
            title="Send on WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors active:scale-95"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ====================================================================
       * PURE A4 PRINTABLE DOCUMENT
       * Width: 210mm (Standard A4 portrait), High DPI typography, crisp borders
       * ==================================================================== */}
      <div
        id="a4-invoice-sheet"
        ref={printRef}
        className="w-full max-w-[210mm] min-h-[297mm] bg-white text-zinc-900 shadow-2xl p-6 sm:p-10 font-sans print:shadow-none print:m-0 print:p-0 print:w-full print:max-w-none text-[12px] leading-tight flex flex-col justify-between"
        style={{
          boxSizing: 'border-box',
          color: '#111827',
        }}
      >
        <div>
          {/* Top Header: Business Details & Document Title */}
          <div className="border-b-2 border-zinc-900 pb-3 mb-3">
            <div className="flex justify-between items-start gap-4">
              {/* Left: Company Details */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded bg-orange-600 text-white flex items-center justify-center font-black text-sm">
                    E
                  </div>
                  <h1 className="text-xl font-black text-black tracking-tight uppercase">
                    {settings.shopName || 'EVO BILL ENTERPRISES'}
                  </h1>
                </div>
                {settings.tagline && (
                  <p className="text-[11px] font-semibold text-zinc-600 mb-1">{settings.tagline}</p>
                )}
                <p className="text-[11px] text-zinc-700 whitespace-pre-line max-w-sm">
                  {settings.address || 'Main Market Road, City Center'}
                </p>
                <div className="flex flex-wrap gap-x-3 text-[11px] text-zinc-700 mt-1 font-medium">
                  {settings.phone && <span><b>Phone:</b> {settings.phone}</span>}
                  {settings.email && <span><b>Email:</b> {settings.email}</span>}
                </div>
                {settings.gstin && (
                  <div className="mt-1 text-[11px] text-zinc-900 font-mono font-bold">
                    <span>GSTIN: </span>
                    <span className="bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-300">
                      {settings.gstin}
                    </span>
                  </div>
                )}
              </div>

              {/* Right: Invoice Type Header & Meta */}
              <div className="text-right flex flex-col items-end">
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-zinc-900 text-white px-2.5 py-0.5 rounded mb-1">
                  Original For Recipient
                </span>
                <h2 className="text-lg font-black text-orange-600 uppercase tracking-tight">
                  {title}
                </h2>

                <div className="mt-2 text-right text-[11px] space-y-0.5 font-medium text-zinc-800">
                  <div>
                    <span className="text-zinc-500 uppercase text-[10px]">
                      {docType === 'Invoice' ? 'Invoice No:' : 'Quote No:'}
                    </span>{' '}
                    <b className="font-mono text-xs text-black">{doc.no}</b>
                  </div>
                  <div>
                    <span className="text-zinc-500 uppercase text-[10px]">Date:</span>{' '}
                    <b>{formatDate(doc.date)}</b>
                  </div>
                  {'dueDate' in doc && (doc as Invoice).dueDate && (
                    <div>
                      <span className="text-zinc-500 uppercase text-[10px]">Due Date:</span>{' '}
                      <b>{formatDate((doc as Invoice).dueDate as string)}</b>
                    </div>
                  )}
                  {'validUntil' in doc && (doc as Quote).validUntil && (
                    <div>
                      <span className="text-zinc-500 uppercase text-[10px]">Valid Until:</span>{' '}
                      <b>{formatDate((doc as Quote).validUntil as string)}</b>
                    </div>
                  )}
                  <div>
                    <span className="text-zinc-500 uppercase text-[10px]">Place of Supply:</span>{' '}
                    <b>State Code: 07 (Delhi)</b>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer / Bill To Box */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-50 border border-zinc-300 rounded-lg mb-3">
            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-0.5">
                Bill To / Buyer Details:
              </span>
              <h4 className="font-bold text-sm text-black">{doc.custName}</h4>
              {doc.custPhone && (
                <p className="text-[11px] text-zinc-700 mt-0.5">
                  <b>Contact:</b> {doc.custPhone}
                </p>
              )}
              {doc.custAddress && (
                <p className="text-[11px] text-zinc-600 mt-0.5">{doc.custAddress}</p>
              )}
            </div>

            <div className="text-right flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-0.5">
                  Tax & Status Info:
                </span>
                {doc.custGstin ? (
                  <p className="text-[11px] font-mono font-bold text-zinc-900">
                    GSTIN / UIN: {doc.custGstin}
                  </p>
                ) : (
                  <p className="text-[11px] text-zinc-500 italic">Unregistered Consumer (B2C)</p>
                )}
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase">Reverse Charge: </span>
                <b className="text-[11px]">No</b>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-zinc-300 rounded-lg overflow-hidden mb-3">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead className="bg-zinc-100 text-zinc-800 border-b border-zinc-300 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2 px-2.5 w-8 text-center border-r border-zinc-300">#</th>
                  <th className="py-2 px-2.5 border-r border-zinc-300">Item Description</th>
                  <th className="py-2 px-2 border-r border-zinc-300 text-center w-16">HSN/SAC</th>
                  <th className="py-2 px-2 border-r border-zinc-300 text-right w-12">Qty</th>
                  <th className="py-2 px-2 border-r border-zinc-300 text-right w-20">Rate (₹)</th>
                  <th className="py-2 px-2.5 text-right w-24">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-800">
                {items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-zinc-50/50">
                    <td className="py-2 px-2.5 text-center text-zinc-500 border-r border-zinc-200">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-2.5 font-medium text-black border-r border-zinc-200">
                      {item.name}
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-zinc-600 border-r border-zinc-200">
                      {item.hsn || '-'}
                    </td>
                    <td className="py-2 px-2 text-right font-semibold border-r border-zinc-200">
                      {item.qty} {item.unit || 'Pcs'}
                    </td>
                    <td className="py-2 px-2 text-right text-zinc-700 border-r border-zinc-200">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="py-2 px-2.5 text-right font-bold text-black">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
                {/* Fill empty rows if items are few to maintain standard A4 look */}
                {items.length < 4 &&
                  Array.from({ length: 4 - items.length }).map((_, i) => (
                    <tr key={`empty-${i}`} className="opacity-0">
                      <td className="py-1.5 border-r border-zinc-200">&nbsp;</td>
                      <td className="py-1.5 border-r border-zinc-200">&nbsp;</td>
                      <td className="py-1.5 border-r border-zinc-200">&nbsp;</td>
                      <td className="py-1.5 border-r border-zinc-200">&nbsp;</td>
                      <td className="py-1.5 border-r border-zinc-200">&nbsp;</td>
                      <td className="py-1.5">&nbsp;</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Calculation & Summary Section */}
          <div className="grid grid-cols-12 gap-3 mb-3">
            {/* Left: Amount in Words, Bank Details, QR Code */}
            <div className="col-span-7 flex flex-col justify-between p-3 bg-zinc-50 border border-zinc-300 rounded-lg">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Amount In Words:
                </span>
                <p className="font-bold text-xs text-zinc-900 mt-0.5 italic">
                  {totalInWords}
                </p>
              </div>

              {/* Bank & UPI QR details */}
              <div className="flex items-center gap-3 pt-2 mt-2 border-t border-zinc-200">
                {qrImageUrl && (
                  <div className="p-1 bg-white border border-zinc-300 rounded flex flex-col items-center shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrImageUrl}
                      alt="UPI QR Code"
                      className="w-16 h-16 object-contain"
                    />
                    <span className="text-[8px] font-bold text-zinc-700 mt-0.5">Scan to Pay</span>
                  </div>
                )}
                <div className="text-[10px] text-zinc-700 space-y-0.5 flex-1">
                  <span className="font-bold text-zinc-900 block text-[11px]">Bank Payment Info:</span>
                  {settings.bankName && <div><b>Bank:</b> {settings.bankName}</div>}
                  {settings.accountNo && <div><b>A/C No:</b> {settings.accountNo}</div>}
                  {settings.ifsc && <div><b>IFSC:</b> {settings.ifsc}</div>}
                  {settings.upiId && <div><b>UPI ID:</b> <span className="font-mono font-bold text-black">{settings.upiId}</span></div>}
                </div>
              </div>
            </div>

            {/* Right: Subtotal, Taxes & Grand Total Table */}
            <div className="col-span-5 border border-zinc-300 rounded-lg p-3 bg-zinc-50 flex flex-col justify-between">
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between text-zinc-700">
                  <span>Subtotal Amount:</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span className="font-semibold">-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-700">
                  <span>Taxable Value:</span>
                  <span className="font-semibold">{formatCurrency(taxable)}</span>
                </div>
                {tax > 0 && (
                  <>
                    <div className="flex justify-between text-zinc-600 text-[10.5px]">
                      <span>CGST (Central Tax 9%):</span>
                      <span>{formatCurrency(cgst)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600 text-[10.5px]">
                      <span>SGST (State Tax 9%):</span>
                      <span>{formatCurrency(sgst)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-2 mt-2 border-t-2 border-zinc-900 space-y-1">
                <div className="flex justify-between items-center text-sm font-black text-black">
                  <span>GRAND TOTAL:</span>
                  <span className="text-base text-orange-600 font-mono font-black">
                    {formatCurrency(total)}
                  </span>
                </div>

                {isInvoice && (
                  <div className="pt-1 border-t border-zinc-200 text-[10.5px] space-y-0.5">
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Amount Received:</span>
                      <span>{formatCurrency(received)}</span>
                    </div>
                    <div className="flex justify-between text-rose-700 font-bold">
                      <span>Balance Due:</span>
                      <span>{formatCurrency(due)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Terms & Signatures */}
        <div className="pt-3 border-t border-zinc-300 mt-2">
          <div className="flex justify-between items-end gap-6 text-[10px]">
            {/* Terms and conditions */}
            <div className="flex-1 text-zinc-600 max-w-sm">
              <span className="font-bold text-zinc-800 uppercase block mb-0.5">
                Terms &amp; Conditions:
              </span>
              <p>1. Goods once sold will not be taken back or exchanged.</p>
              <p>2. Payment due strictly within terms. Interest @18% p.a. charged on overdue bills.</p>
              <p>3. Subject to local jurisdiction only.</p>
            </div>

            {/* Signature Box */}
            <div className="text-center w-48">
              <p className="text-[10px] text-zinc-700 font-bold mb-10">
                For {settings.shopName || 'EVO BILL'}
              </p>
              <div className="border-t border-zinc-800 pt-1 font-bold text-zinc-900 uppercase tracking-wider text-[9px]">
                Authorized Signatory
              </div>
            </div>
          </div>

          <div className="text-center text-[9px] text-zinc-400 mt-3 border-t border-zinc-200 pt-1">
            Thank you for your business! This is a computer generated invoice powered by EVO BILL Next-Gen.
          </div>
        </div>
      </div>
    </div>
  );
}
