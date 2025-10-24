import './globals.css';
import type { Metadata } from 'next';
import React from 'react';
import { Lobster, Montserrat } from 'next/font/google';

import { HeaderNav } from '@/components/HeaderNav';
import { AuthProvider } from '@/lib/authContext';

const headingFont = Lobster({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-heading'
});

const bodyFont = Montserrat({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-body'
});

export const metadata: Metadata = {
  title: 'Bameo',
  description: 'Create videos from playing cards with Bameo.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${headingFont.variable} ${bodyFont.variable}`}>
        <AuthProvider>
          <HeaderNav />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
