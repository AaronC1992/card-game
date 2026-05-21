import React, { useState } from 'react';
import type { DeckSave, GameSettings } from '../engine/types';
import { starterDecks } from '../data/starterDecks';
import styles from './DeckSelection.module.css';

interface DeckSelectionProps {
  savedDecks: DeckSave[];
  settings: GameSettings;
  onSelectDecks: (p1DeckId: string, p2DeckId: string) => void;
  onBack: () => void;
}

export default function DeckSelection({
  savedDecks,
  settings,
  onSelectDecks,
  onBack,
}: DeckSelectionProps) {
  const allDecks = [...starterDecks, ...savedDecks];
  const [step2, setStep2] = useState(false);
  const [p1Deck, setP1Deck] = useState<string | null>(null);

  const handleSelect = (deckId: string) => {
    if (settings.botMode) {
      const botDeck = allDecks[Math.floor(Math.random() * allDecks.length)];
      onSelectDecks(deckId, botDeck.id);
    } else {
      setStep2(true);
      setP1Deck(deckId);
    }
  };

  if (step2 && p1Deck && !settings.botMode) {
    return (
      <div className={styles.wrap}>
        <h2 className={styles.heading}>Player 2 — Choose Your Deck</h2>
        <div className={styles.grid}>
          {allDecks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onClick={() => onSelectDecks(p1Deck, deck.id)}
            />
          ))}
        </div>
        <button className="btn-ghost" onClick={() => setStep2(false)}>
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <h2 className={styles.heading}>
        {settings.botMode ? 'Choose Your Deck' : 'Player 1 — Choose Your Deck'}
      </h2>
      <div className={styles.grid}>
        {allDecks.map((deck) => (
          <DeckCard key={deck.id} deck={deck} onClick={() => handleSelect(deck.id)} />
        ))}
      </div>
      <button className="btn-ghost" onClick={onBack}>
        ← Back
      </button>
    </div>
  );
}

function DeckCard({ deck, onClick }: { deck: DeckSave; onClick: () => void }) {
  return (
    <div className={styles.deckCard} onClick={onClick}>
      <div className={styles.deckName}>{deck.name}</div>
      <div className={styles.deckMeta}>{deck.cardIds.length} cards</div>
    </div>
  );
}

