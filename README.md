# EVO BILL Next-Gen (Electron + Next.js Desktop Billing Software)

A modern, fast, offline-first Desktop Billing, Invoicing & GST Software built with **Electron**, **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**.

---

## 🚀 Features

- 🖥️ **Desktop-First Architecture**: Powered by Electron with custom frameless window titlebar, window controls (minimize, maximize, close), and native system dialogs.
- ⚡ **Next.js App Router & TypeScript**: Fast UI rendering, type-safe data models, and component modularity.
- 🧾 **GST & Invoicing**: Automatic tax calculation (GST 5%, 12%, 18%, 28%), discounts, subtotal, and balance due tracking.
- 🖨️ **Thermal & Laser Printing**: Native printing support for thermal roll printers (58mm / 80mm) and standard A4 laser printers.
- 💾 **100% Offline Data**: Local storage and JSON database export/import with backup protection.
- 🎨 **Modern Dark UI**: Designed for POS and shop counters with keyboard shortcuts and quick action buttons.

---

## 📁 Project Structure

```
EVO BILL/
├── electron/
│   ├── main.js             # Electron main process (Window controls, IPC, Printers)
│   └── preload.js          # Secure ContextBridge API (window.electronAPI)
├── src/
│   ├── app/
│   │   ├── globals.css     # Tailwind CSS & custom scrollbar / print styles
│   │   ├── layout.tsx      # Desktop window layout (TitleBar + Sidebar + Body)
│   │   ├── page.tsx        # Dashboard (KPIs, Sales analytics, Recent Invoices)
│   │   ├── invoices/       # Invoices list and new invoice creation form
│   │   └── settings/       # Business profile, GSTIN, thermal printer setup
│   ├── components/
│   │   ├── TitleBar.tsx    # Native-like desktop draggable titlebar
│   │   └── Sidebar.tsx     # Modern POS navigation menu
│   ├── lib/
│   │   ├── storage.ts      # Offline database manager
│   │   └── utils.ts        # Currency (₹ INR), date and class utilities
│   └── types/
│       ├── billing.ts      # Invoice, Customer, Item, Shop type definitions
│       └── electron.d.ts   # Electron IPC window bindings
├── package.json            # Scripts and dependencies
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── next.config.mjs         # Next.js configuration
```

---

## 🛠️ How to Run

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Desktop Development (Next.js + Electron)
```bash
npm run dev
```
> This starts the Next.js dev server on `http://localhost:3000` and automatically launches the Electron desktop window once ready.

### 3. Run Web Mode Only (Next.js)
```bash
npm run dev:next
```

### 4. Build Windows Desktop App (.exe)
```bash
npm run dist
```
> Packages the application into a standalone Windows installer inside the `dist-electron/` folder.
