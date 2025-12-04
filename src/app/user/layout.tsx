import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChatBox from '@/components/ChatBox';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-inter',
});

export const metadata = {
  title: 'Người dùng | Sài Gòn Đi',
};

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={inter.variable}>
      <div className="relative">   
        <div className="sticky top-0 z-50 shadow">
          <Header />
        </div>
        <main className="flex-grow w-full">
          {children}
        </main>
        <Footer />
        <ChatBox />
      </div>
    </div>
  );
}
