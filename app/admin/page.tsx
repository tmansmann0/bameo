'use client';

import { FormEvent, useState } from 'react';

import { supabase } from '@/lib/supabaseClient';

type CardFormState = {
  title: string;
  imageUrl: string;
};

const initialFormState: CardFormState = {
  title: '',
  imageUrl: ''
};

export default function AdminPage() {
  const [formState, setFormState] = useState<CardFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      const { error } = await supabase.from('cards').insert([
        {
          title: formState.title,
          image_url: formState.imageUrl
        }
      ]);

      if (error) {
        throw error;
      }

      // Reset the form and show feedback when the insert succeeds.
      setFormState(initialFormState);
      setSuccessMessage('Card saved successfully.');
    } catch (error) {
      console.error('Failed to insert card into Supabase.', error);
      setSubmitError('Unable to save the card. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Admin</h1>
        <p>Manage the deck of cards available for storytelling videos.</p>
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
          border: '1px solid #e5e7eb',
          maxWidth: '480px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="title">Card title</label>
          <input
            id="title"
            name="title"
            required
            value={formState.title}
            onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
            style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="imageUrl">Image URL</label>
          <input
            id="imageUrl"
            name="imageUrl"
            type="url"
            placeholder="https://..."
            required
            value={formState.imageUrl}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, imageUrl: event.target.value }))
            }
            style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
          />
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save card'}
        </button>

        {submitError && (
          <p role="alert" style={{ color: '#dc2626', margin: 0 }}>
            {submitError}
          </p>
        )}

        {successMessage && (
          <p role="status" style={{ color: '#16a34a', margin: 0 }}>
            {successMessage}
          </p>
        )}
      </form>
    </section>
  );
}
