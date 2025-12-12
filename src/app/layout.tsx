// import DisableInspect from '@/components/DisableInspect';
// import DisableCopyPaste from '@/components/DisableCopyPaste';
import '@/styles/globals.css';
import { Inter } from 'next/font/google';

import {Providers} from '../lib/providers';


const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-inter',
});

export const metadata = {
  title: 'Sài Gòn Đi',
  description: 'Khám phá – Check-in – Viết blog tại TP.HCM',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className="font-sans bg-[var(--background)] text-[var(--foreground)]">
        <Providers>{children}</Providers>
        {/* <DisableInspect /> */}
        {/* <DisableCopyPaste/> */}
      </body>
    </html>
  );
}
