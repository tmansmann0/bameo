'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export function HeaderNav() {
  const { user, isLoading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isAdmin = !!user && (!!ADMIN_EMAIL ? user.email === ADMIN_EMAIL : false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await supabase.auth.signOut();
      router.push('/');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" aria-current={pathname === '/' ? 'page' : undefined}>
            Home
          </Link>
          {isAdmin && (
            <Link href="/admin" aria-current={pathname === '/admin' ? 'page' : undefined}>
              Admin
            </Link>
          )}
          {user && (
            <Link href="/account" aria-current={pathname === '/account' ? 'page' : undefined}>
              My Videos
            </Link>
          )}
          {!isLoading && !user && (
            <Link href="/login" aria-current={pathname === '/login' ? 'page' : undefined}>
              Log in / Sign up
            </Link>
          )}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#374151' }}>Welcome, {user.email}</span>
              <button type="button" onClick={handleSignOut} disabled={isSigningOut}>
                {isSigningOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
