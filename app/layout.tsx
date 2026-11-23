import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/inter';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './globals.css';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/topbar';

export const metadata: Metadata = {
  title: { default: 'NVIDIA (NVDA) — Fundamental Research Terminal', template: '%s · NVDA Research Terminal' },
  description: 'Institutional-grade fundamental analysis of NVIDIA Corporation: financial statements, valuation, DCF, risk and governance — every figure sourced.',
};
export const viewport: Viewport = { themeColor: '#090c11', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Sidebar />
        <div className="lg:pl-60">
          <TopBar />
          <main className="mx-auto max-w-[1440px] px-4 pb-24 pt-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
