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
    <header className="site-header">
      <nav className="site-nav">
        <Link href="/" className="brand">
          Bameo
        </Link>
        <div className="site-nav-links">
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
            <div className="auth-actions">
              <span>Welcome, {user.email}</span>
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
