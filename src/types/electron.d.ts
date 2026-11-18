export interface ElectronAPI {
  isElectron: boolean;
  minimize: () => Promise<void>;
  maximize: () => Promise<boolean>;
  close: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  getPrinters: () => Promise<Array<{ name: string; isDefault: boolean; status: number }>>;
  printInvoice: (options?: {
    silent?: boolean;
    printerName?: string;
    pageSize?: 'A4' | 'A5' | { width: number; height: number };
  }) => Promise<{ success: boolean; error?: string }>;
  saveBackupDialog: (defaultName?: string) => Promise<{ canceled: boolean; filePath?: string } | null>;
  openBackupDialog: () => Promise<{ canceled: boolean; filePaths: string[] } | null>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
