'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { useAuth } from '../../lib/authContext';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      if (mode === 'signIn') {
        // Authenticate the user with Supabase using the provided credentials.
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          throw error;
        }
        setStatusMessage('Logged in successfully. Redirecting…');
        router.push('/');
      } else {
        const siteUrl =
          process.env.NEXT_PUBLIC_SITE_URL ??
          (typeof window !== 'undefined' ? window.location.origin : undefined);

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: siteUrl ? new URL('/login', siteUrl).toString() : undefined
          }
        });
        if (error) {
          throw error;
        }
        setStatusMessage('Sign up successful! Check your inbox to confirm the email if required.');
      }
    } catch (error) {
      console.error('Authentication failed.', error);
      setErrorMessage((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      style={{
        margin: '0 auto',
        padding: '3rem 1rem',
        maxWidth: '480px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}
    >
      <header>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Log in</h1>
        <p>Use your Supabase credentials to access Bameo features.</p>
        {user && <p>You are already logged in as {user.email}.</p>}
      </header>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          backgroundColor: '#fff',
          padding: '2rem',
          borderRadius: '0.75rem',
          border: '1px solid #e5e7eb'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : mode === 'signIn' ? 'Log in' : 'Create account'}
          </button>
          <button
            type="button"
            onClick={() => setMode((previous) => (previous === 'signIn' ? 'signUp' : 'signIn'))}
            style={{ background: 'transparent', border: 'none', color: '#6366f1', cursor: 'pointer' }}
          >
            {mode === 'signIn' ? 'Need an account? Sign up' : 'Have an account? Log in'}
          </button>
        </div>

        {errorMessage && (
          <p role="alert" style={{ color: '#dc2626', margin: 0 }}>
            {errorMessage}
          </p>
        )}

        {statusMessage && (
          <p role="status" style={{ color: '#16a34a', margin: 0 }}>
            {statusMessage}
          </p>
        )}
      </form>

      <Link href="/">Return to home</Link>
    </section>
  );
}
