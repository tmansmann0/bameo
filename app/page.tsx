'use client';

import { useCallback, useState } from 'react';

const placeholderCards = [
  { id: 'ace-spades', title: 'Ace of Spades', description: 'A legendary card.' },
  { id: 'queen-hearts', title: 'Queen of Hearts', description: 'Royal and radiant.' },
  { id: 'joker', title: 'Joker', description: 'Wild card energy.' }
];

export default function HomePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
        <ul style={{ display: 'grid', gap: '1rem', listStyle: 'none', padding: 0 }}>
          {placeholderCards.map((card) => (
            <li
              key={card.id}
              style={{
                backgroundColor: '#fff',
                borderRadius: '0.75rem',
                border: '1px solid #e5e7eb',
                padding: '1.5rem'
              }}
            >
              <h3 style={{ margin: '0 0 0.5rem' }}>{card.title}</h3>
              <p style={{ margin: 0 }}>{card.description}</p>
            </li>
          ))}
        </ul>
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
