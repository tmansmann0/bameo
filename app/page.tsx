'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabaseClient';

type Card = {
  id: string;
  title: string;
  image_url: string | null;
};

export default function HomePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusIsError, setStatusIsError] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [cardsError, setCardsError] = useState<string | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

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

  useEffect(() => {
    // Remove any selections for cards that are no longer available.
    setSelectedCardIds((previous) =>
      previous.filter((id) => cards.some((card) => card.id === id))
    );
  }, [cards]);

  const toggleCardSelection = useCallback((cardId: string) => {
    setSelectedCardIds((previous) => {
      if (previous.includes(cardId)) {
        return previous.filter((id) => id !== cardId);
      }
      return [...previous, cardId];
    });
  }, []);

  const selectedCards = useMemo(
    () => cards.filter((card) => selectedCardIds.includes(card.id)),
    [cards, selectedCardIds]
  );

  const handleGenerate = useCallback(async () => {
    if (selectedCards.length === 0) {
      setStatusIsError(true);
      setStatusMessage('Select at least one card to build a video.');
      return;
    }

    try {
      setIsGenerating(true);
      setStatusMessage(null);
      setStatusIsError(false);

      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cards: selectedCards.map(({ id, title, image_url }) => ({ id, title, image_url }))
        })
      });

      if (!response.ok) {
        let errorMessage = 'Failed to generate the video.';
        try {
          const errorPayload = await response.json();
          if (typeof errorPayload?.error === 'string') {
            errorMessage = errorPayload.error;
          }
        } catch (parseError) {
          console.warn('Unable to parse error response from the video endpoint.', parseError);
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = `bameo-cards-${Date.now()}.mp4`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setStatusIsError(false);
      setStatusMessage('Video generated! Your download should begin automatically.');
    } catch (error) {
      console.error('Video generation failed.', error);
      setStatusIsError(true);
      setStatusMessage((error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedCards]);

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
            {cards.map((card) => {
              const isSelected = selectedCardIds.includes(card.id);
              return (
                <li
                  key={card.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '0.75rem',
                    border: `2px solid ${isSelected ? '#6366f1' : '#e5e7eb'}`,
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    boxShadow: isSelected ? '0 10px 25px rgba(99, 102, 241, 0.15)' : 'none'
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0 }}>{card.title}</h3>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCardSelection(card.id)}
                        aria-label={`Include ${card.title} in the generated video`}
                      />
                      Include in video
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '340px' }}>
        <button onClick={handleGenerate} disabled={isGenerating || selectedCards.length === 0}>
          {isGenerating
            ? 'Generating…'
            : selectedCards.length === 0
            ? 'Select cards to generate a video'
            : `Generate video (${selectedCards.length} card${selectedCards.length > 1 ? 's' : ''})`}
        </button>
        {statusMessage && (
          <span
            role="status"
            style={{ color: statusIsError ? '#dc2626' : '#16a34a', fontSize: '0.95rem' }}
          >
            {statusMessage}
          </span>
        )}
      </div>
    </section>
  );
}
