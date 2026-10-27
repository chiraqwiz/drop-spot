import type { Metadata, Viewport } from 'next';
import './globals.css';
import SwRegister from '@/components/SwRegister';

export const metadata: Metadata = {
  title: 'DROP SPOT',
  description: 'A Facebook-inspired social app experience',
  icons: {
    apple: 'https://traeyw0jxcp61nuu.public.blob.vercel-storage.com/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'DROP SPOT',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: '#1877f2',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SwRegister />
        {children}
      </body>
    </html>
  );
}
