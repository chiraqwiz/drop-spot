import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DROP SPOT',
  description: 'A Facebook-inspired social app experience'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
