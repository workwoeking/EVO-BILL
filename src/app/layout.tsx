import type { Metadata } from 'next';
import './globals.css';
import TitleBar from '@/components/TitleBar';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'EVO BILL Next-Gen - Modern Desktop Billing Software',
  description: 'Fast, Offline-first, Modern GST Billing and Invoicing Software built with Next.js and Electron',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 flex flex-col h-screen overflow-hidden">
        {/* Top desktop window bar */}
        <TitleBar />

        {/* Desktop app body with sidebar and page area */}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-zinc-900/30 p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
