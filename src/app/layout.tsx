import type { Metadata } from 'next';
import { PT_Sans } from 'next/font/google'; // Corrected font import approach
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

// Standard Next.js font optimization
const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans', // Optional: if you want to use it as a CSS variable
});

export const metadata: Metadata = {
  title: 'Pass Prevue',
  description: 'Upload and preview .pkpass files',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={ptSans.className}>
      <head>
        {/* Removed direct Google Font links as per Next.js best practices when using next/font */}
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
