import './globals.css';
import type { Metadata } from 'next';
import React from 'react';

import { HeaderNav } from '@/components/HeaderNav';
import { AuthProvider } from '@/lib/authContext';

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
      <body>
        <AuthProvider>
          <HeaderNav />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
