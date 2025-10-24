'use client';

import { FormEvent, useState } from 'react';

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
  const [submittedCards, setSubmittedCards] = useState<CardFormState[]>([]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Placeholder for future Supabase mutation.
    setSubmittedCards((prev) => [...prev, formState]);
    setFormState(initialFormState);
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

        <button type="submit">Save card</button>
      </form>

      {submittedCards.length > 0 && (
        <div>
          <h2>Recently added (local state)</h2>
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.75rem' }}>
            {submittedCards.map((card, index) => (
              <li
                key={`${card.title}-${index}`}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '0.75rem',
                  border: '1px solid #e5e7eb',
                  padding: '1.5rem'
                }}
              >
                <strong>{card.title}</strong>
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>{card.imageUrl}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
