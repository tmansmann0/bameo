'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '../lib/authContext';
import { supabase } from '../lib/supabaseClient';

type Card = {
  id: string;
  title: string;
  image_url: string | null;
  card_type: 'character' | 'situation';
};

export default function HomePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusIsError, setStatusIsError] = useState(false);
  const [characterCards, setCharacterCards] = useState<Card[]>([]);
  const [situationCards, setSituationCards] = useState<Card[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [cardsError, setCardsError] = useState<string | null>(null);
  const [currentCharacter, setCurrentCharacter] = useState<Card | null>(null);
  const [currentSituation, setCurrentSituation] = useState<Card | null>(null);
  const [finalCharacter, setFinalCharacter] = useState<Card | null>(null);
  const [finalSituation, setFinalSituation] = useState<Card | null>(null);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const cardsSectionRef = useRef<HTMLDivElement | null>(null);
  const actionPanelRef = useRef<HTMLDivElement | null>(null);
  const shuffleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const shuffleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { session, user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const fetchCards = async () => {
      try {
        setIsLoadingCards(true);
        setCardsError(null);

        const { data, error } = await supabase
          .from('cards')
          .select('id, title, image_url, card_type')
          .order('title', { ascending: true });

        if (error) {
          throw error;
        }

        if (!isMounted) {
          return;
        }

        const normalizedCards = (data ?? []).filter(
          (
            card
          ): card is Card =>
            typeof card?.id === 'string' &&
            typeof card?.title === 'string' &&
            (card?.card_type === 'character' || card?.card_type === 'situation')
        );

        if (normalizedCards.length !== (data ?? []).length) {
          console.warn('Some cards were ignored because they are missing a card type.');
        }

        const characters = normalizedCards.filter((card) => card.card_type === 'character');
        const situations = normalizedCards.filter((card) => card.card_type === 'situation');

        setCharacterCards(characters);
        setSituationCards(situations);

        setCurrentCharacter((previous) => previous ?? characters[0] ?? null);
        setCurrentSituation((previous) => previous ?? situations[0] ?? null);
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

  const clearShuffleRefs = useCallback(() => {
    if (shuffleIntervalRef.current) {
      clearInterval(shuffleIntervalRef.current);
      shuffleIntervalRef.current = null;
    }
    if (shuffleTimeoutRef.current) {
      clearTimeout(shuffleTimeoutRef.current);
      shuffleTimeoutRef.current = null;
    }
  }, []);

  const startShuffleAnimation = useCallback(() => {
    if (isLoadingCards) {
      return;
    }

    if (characterCards.length === 0 || situationCards.length === 0) {
      setStatusIsError(true);
      setStatusMessage('Add at least one character and one situation card to begin.');
      return;
    }

    setStatusMessage(null);
    setStatusIsError(false);
    setIsRandomizing(true);
    setFinalCharacter(null);
    setFinalSituation(null);

    clearShuffleRefs();

    shuffleIntervalRef.current = setInterval(() => {
      setCurrentCharacter(characterCards[Math.floor(Math.random() * characterCards.length)] ?? null);
      setCurrentSituation(situationCards[Math.floor(Math.random() * situationCards.length)] ?? null);
    }, 120);

    shuffleTimeoutRef.current = setTimeout(() => {
      clearShuffleRefs();

      const nextCharacter = characterCards[Math.floor(Math.random() * characterCards.length)] ?? null;
      const nextSituation = situationCards[Math.floor(Math.random() * situationCards.length)] ?? null;

      setCurrentCharacter(nextCharacter);
      setCurrentSituation(nextSituation);
      setFinalCharacter(nextCharacter);
      setFinalSituation(nextSituation);
      setIsRandomizing(false);

      if (actionPanelRef.current) {
        actionPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 3200);
  }, [characterCards, clearShuffleRefs, isLoadingCards, situationCards]);

  const handlePlayClick = useCallback(() => {
    if (cardsSectionRef.current) {
      cardsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    startShuffleAnimation();
  }, [startShuffleAnimation]);

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

  useEffect(
    () => () => {
      clearShuffleRefs();
    },
    [clearShuffleRefs]
  );

  const handleGenerate = useCallback(async () => {
    if (!finalCharacter || !finalSituation) {
      setStatusIsError(true);
      setStatusMessage('Draw a character and situation to generate a video.');
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
          cards: [finalCharacter, finalSituation].map(({ id, title, image_url }) => ({ id, title, image_url }))
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
  }, [finalCharacter, finalSituation, session?.access_token, user]);

  const isDeckReady = characterCards.length > 0 && situationCards.length > 0;
  const hasScene = !!finalCharacter && !!finalSituation;

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
                {isRandomizing
                  ? 'Drawing your scene…'
                  : hasScene
                  ? 'Scene locked in!'
                  : 'Ready to draw?'}
              </strong>
              <span>
                {isRandomizing
                  ? 'The deck is shuffling. Watch the cards fly by.'
                  : hasScene && finalCharacter && finalSituation
                  ? `${finalCharacter.title} meets ${finalSituation.title}. Time to perform.`
                  : 'Hit play and let Bameo pull your character and situation.'}
              </span>
            </div>
          </div>
        </section>

        <section className="cards-panel neon-surface" ref={cardsSectionRef}>
          <div className="panel-heading">
            <h2>Loot Crate Shuffle</h2>
            <p>Press play to let Bameo spin up a character and a situation for your one-take performance.</p>
          </div>

          {isLoadingCards ? (
            <p className="panel-feedback">Loading cards…</p>
          ) : cardsError ? (
            <p className="panel-feedback error">{cardsError}</p>
          ) : !isDeckReady ? (
            <p className="panel-feedback">Add at least one character and one situation card to start the game.</p>
          ) : (
            <div className="randomizer">
              <div className="randomizer-grid">
                <div className={`randomizer-slot${isRandomizing ? ' is-animating' : ''}`}>
                  <span className="slot-label">Character</span>
                  <div className="slot-card">
                    {currentCharacter?.image_url ? (
                      <Image
                        className="slot-image"
                        src={currentCharacter.image_url}
                        alt={currentCharacter.title}
                        width={320}
                        height={240}
                        sizes="(max-width: 768px) 100vw, 320px"
                        unoptimized
                      />
                    ) : (
                      <div className="slot-image placeholder">No image</div>
                    )}
                    <strong>{currentCharacter ? currentCharacter.title : 'Press play to draw'}</strong>
                  </div>
                </div>
                <div className={`randomizer-slot${isRandomizing ? ' is-animating' : ''}`}>
                  <span className="slot-label">Situation</span>
                  <div className="slot-card">
                    {currentSituation?.image_url ? (
                      <Image
                        className="slot-image"
                        src={currentSituation.image_url}
                        alt={currentSituation.title}
                        width={320}
                        height={240}
                        sizes="(max-width: 768px) 100vw, 320px"
                        unoptimized
                      />
                    ) : (
                      <div className="slot-image placeholder">No image</div>
                    )}
                    <strong>{currentSituation ? currentSituation.title : 'Press play to draw'}</strong>
                  </div>
                </div>
              </div>
              <div className="randomizer-actions">
                <button
                  type="button"
                  className="btn-magenta randomize-button"
                  onClick={startShuffleAnimation}
                  disabled={isRandomizing || !isDeckReady}
                >
                  {isRandomizing ? 'Shuffling…' : hasScene ? 'Draw again' : 'Start game'}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="action-panel neon-surface" ref={actionPanelRef}>
          <div className="panel-heading">
            <h2>Recording Stage</h2>
            <p>Once your cards are revealed, generate a teleprompter-ready video and step into your scene.</p>
          </div>

          <div className="selected-summary">
            <strong>{hasScene ? 'Your scene is locked.' : 'Draw cards to build your scene.'}</strong>
            <p>
              {hasScene
                ? 'Review your draw and hit generate when you are ready to record.'
                : 'Hit play above to let Bameo pick a character and situation for you.'}
            </p>
            {hasScene && finalCharacter && finalSituation && (
              <div className="selected-chips" role="list">
                <span className="selected-chip" role="listitem">
                  {finalCharacter.title}
                </span>
                <span className="selected-chip" role="listitem">
                  {finalSituation.title}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn-magenta generate-button"
            onClick={handleGenerate}
            disabled={isGenerating || !hasScene || isRandomizing}
          >
            {isGenerating
              ? 'Generating…'
              : hasScene
              ? 'Generate teleprompter video'
              : 'Draw cards to generate a video'}
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
