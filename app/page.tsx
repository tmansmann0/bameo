'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '../lib/authContext';
import { supabase } from '../lib/supabaseClient';

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
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const cardsSectionRef = useRef<HTMLDivElement | null>(null);
  const { session, user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const fetchCards = async () => {
      try {
        setIsLoadingCards(true);
        setCardsError(null);

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

  const handlePlayClick = useCallback(() => {
    if (cardsSectionRef.current) {
      cardsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const openRules = useCallback(() => setIsRulesOpen(true), []);
  const closeRules = useCallback(() => setIsRulesOpen(false), []);

  useEffect(() => {
    if (!isRulesOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsRulesOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRulesOpen]);

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
          'Content-Type': 'application/json',
          ...(session?.access_token
            ? {
                Authorization: `Bearer ${session.access_token}`
              }
            : {})
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
      setStatusMessage(
        user
          ? 'Video generated and saved to your library! Your download should begin automatically.'
          : 'Video generated! Your download should begin automatically.'
      );
    } catch (error) {
      console.error('Video generation failed.', error);
      setStatusIsError(true);
      setStatusMessage((error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedCards, session?.access_token, user]);

  return (
    <div className="page-shell">
      <div className="centered-container">
        <section className="hero-panel neon-surface">
          <div className="hero-content">
            <span className="hero-kicker">The One Take Game</span>
            <h1>Bameo</h1>
            <p className="hero-description">
              Step into a neon spotlight, pull a card, and let the persona guide your one-take performance.
              Bameo pairs your imagination with a teleprompter-ready script.
            </p>
            <div className="hero-actions">
              <button type="button" className="btn-magenta" onClick={handlePlayClick} disabled={isLoadingCards}>
                Play
              </button>
              <button type="button" className="btn-ghost" onClick={openRules}>
                Rules
              </button>
            </div>
          </div>
          <div className="hero-highlight">
            <span className="highlight-pill">No retakes</span>
            <h2>Shuffle. Perform. Share.</h2>
            <p>
              Curate the perfect persona deck, hit record, and bring your story to life in a single take. Neon energy
              included.
            </p>
            <div className="hero-status">
              <strong>
                {selectedCards.length === 0
                  ? 'Ready to draw?'
                  : `${selectedCards.length} card${selectedCards.length > 1 ? 's' : ''} locked in`}
              </strong>
              <span>
                {selectedCards.length === 0
                  ? 'Pick a few prompts to build your teleprompter.'
                  : 'Remix the deck until your character clicks.'}
              </span>
            </div>
          </div>
        </section>

        <section className="cards-panel neon-surface" ref={cardsSectionRef}>
          <div className="panel-heading">
            <h2>Flip Your Deck</h2>
            <p>Choose the energies, quirks, and story beats that will shape your performance.</p>
          </div>

          {isLoadingCards ? (
            <p className="panel-feedback">Loading cards…</p>
          ) : cardsError ? (
            <p className="panel-feedback error">{cardsError}</p>
          ) : cards.length === 0 ? (
            <p className="panel-feedback">No cards have been added yet.</p>
          ) : (
            <ul className="card-grid" role="list">
              {cards.map((card) => {
                const isSelected = selectedCardIds.includes(card.id);
                return (
                  <li key={card.id} className={`card-tile${isSelected ? ' is-selected' : ''}`}>
                    {card.image_url ? (
                      <Image
                        className="card-image"
                        src={card.image_url}
                        alt={card.title}
                        width={400}
                        height={300}
                        sizes="(max-width: 768px) 100vw, 240px"
                        unoptimized
                      />
                    ) : (
                      <div className="card-placeholder">No image</div>
                    )}
                    <div className="card-body">
                      <h3>{card.title}</h3>
                      <button
                        type="button"
                        className={`card-toggle btn-magenta${isSelected ? ' is-active' : ''}`}
                        onClick={() => toggleCardSelection(card.id)}
                        aria-pressed={isSelected}
                      >
                        {isSelected ? 'Remove from deck' : 'Add to deck'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="action-panel neon-surface">
          <div className="panel-heading">
            <h2>Lock the take</h2>
            <p>
              When the deck feels right, generate a Bameo teleprompter video complete with your selected characters and
              prompts.
            </p>
          </div>

          <div className="selected-summary">
            <strong>
              {selectedCards.length === 0
                ? 'No cards selected yet'
                : `Deck ready: ${selectedCards.length} card${selectedCards.length > 1 ? 's' : ''}`}
            </strong>
            <p>
              {selectedCards.length === 0
                ? 'Choose a few cards to start crafting your scene.'
                : 'You can still add or remove cards before generating the video.'}
            </p>
            {selectedCards.length > 0 && (
              <div className="selected-chips" role="list">
                {selectedCards.slice(0, 4).map((card) => (
                  <span className="selected-chip" role="listitem" key={card.id}>
                    {card.title}
                  </span>
                ))}
                {selectedCards.length > 4 && (
                  <span className="selected-chip" role="listitem">
                    +{selectedCards.length - 4} more
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn-magenta generate-button"
            onClick={handleGenerate}
            disabled={isGenerating || selectedCards.length === 0 || isLoadingCards}
          >
            {isGenerating
              ? 'Generating…'
              : selectedCards.length === 0
              ? 'Select cards to generate a video'
              : `Generate video (${selectedCards.length} card${selectedCards.length > 1 ? 's' : ''})`}
          </button>

          {statusMessage && (
            <span className={`status-message${statusIsError ? ' error' : ''}`} role="status">
              {statusMessage}
            </span>
          )}
        </section>
      </div>

      {isRulesOpen && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rules-title"
          onClick={closeRules}
        >
          <div className="rules-card neon-surface" onClick={(event) => event.stopPropagation()}>
            <h2 id="rules-title">Bameo Rules</h2>
            <ul>
              <li>One take only—pause if you must, but there are no retakes or redos.</li>
              <li>Props, outfits, and backgrounds are highly encouraged. Commit to the bit.</li>
              <li>Keep planning light. Let the cards guide the performance.</li>
              <li>Most importantly: have fun and share the chaos.</li>
            </ul>
            <button type="button" className="btn-magenta" onClick={closeRules}>
              Let&apos;s play
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
