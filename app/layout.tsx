import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';

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
        <header style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
          <nav
            style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              justifyContent: 'space-between',
              margin: '0 auto',
              padding: '1rem 2rem',
              maxWidth: '960px'
            }}
          >
            <Link href="/" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
              Bameo
            </Link>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link href="/">Home</Link>
              <Link href="/admin">Admin</Link>
            </div>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
