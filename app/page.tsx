'use client';

import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabaseClient';

type Card = {
  id: string;
  title: string;
  image_url: string | null;
};

export default function HomePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [cardsError, setCardsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCards = async () => {
      try {
        setIsLoadingCards(true);
        setCardsError(null);

        // Fetch all cards from Supabase. This uses the shared browser client instance.
        const { data, error } = await supabase
          .from('cards')
          .select('id, title, image_url')
          .order('title', { ascending: true });

        if (error) {
          throw error;
        }

        if (!isMounted) {
          return;
        }

        setCards(data ?? []);
      } catch (error) {
        console.error('Failed to fetch cards from Supabase.', error);
        if (!isMounted) {
          return;
        }
        setCardsError('Unable to load cards right now.');
      } finally {
        if (isMounted) {
          setIsLoadingCards(false);
        }
      }
    };

    fetchCards();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleGenerate = useCallback(async () => {
    try {
      setIsGenerating(true);
      setStatusMessage(null);

      const response = await fetch('/api/generate-video', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to start video generation.');
      }

      const payload = await response.json();
      setStatusMessage(payload?.message ?? 'Video generation started.');
    } catch (error) {
      setStatusMessage((error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Bameo Home</h1>
        <p style={{ maxWidth: '640px' }}>
          Build captivating video stories from a deck of playing cards. Select cards, define a
          narrative, and let Bameo turn them into a shareable clip.
        </p>
      </header>

      <div>
        <h2 style={{ marginBottom: '1rem' }}>Featured cards</h2>
        {isLoadingCards ? (
          <p>Loading cards…</p>
        ) : cardsError ? (
          <p style={{ color: '#dc2626' }}>{cardsError}</p>
        ) : cards.length === 0 ? (
          <p>No cards have been added yet.</p>
        ) : (
          <ul
            style={{
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              listStyle: 'none',
              padding: 0
            }}
          >
            {cards.map((card) => (
              <li
                key={card.id}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '0.75rem',
                  border: '1px solid #e5e7eb',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                {card.image_url ? (
                  <img
                    src={card.image_url}
                    alt={card.title}
                    style={{
                      width: '100%',
                      height: '160px',
                      objectFit: 'cover',
                      borderRadius: '0.5rem'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '160px',
                      borderRadius: '0.5rem',
                      backgroundColor: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#6b7280',
                      fontSize: '0.9rem'
                    }}
                  >
                    No image
                  </div>
                )}
                <h3 style={{ margin: 0 }}>{card.title}</h3>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '320px' }}>
        <button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? 'Generating…' : 'Generate Video'}
        </button>
        {statusMessage && (
          <span role="status" style={{ color: '#16a34a' }}>
            {statusMessage}
          </span>
        )}
      </div>
    </section>
  );
}
