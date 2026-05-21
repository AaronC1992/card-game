import React, { useState } from 'react';
import type { AIDifficulty, DeckSave } from '../engine/types';
import { starterDecks } from '../data/starterDecks';
import styles from './QuickPlay.module.css';

interface QuickPlayProps {
  savedDecks: DeckSave[];
  onStart: (p1DeckId: string, difficulty: AIDifficulty) => void;
  onBack: () => void;
}

const DIFFICULTY_OPTIONS: {
  value: AIDifficulty;
  label: string;
  desc: string;
  colorClass: string;
}[] = [
  {
    value: 'easy',
    label: 'Easy',
    desc: 'The bot plays dumb. Great for learning the ropes.',
    colorClass: styles.diffCyan,
  },
  {
    value: 'normal',
    label: 'Normal',
    desc: 'Plays smart but makes mistakes. A fair fight.',
    colorClass: styles.diffYellow,
  },
  {
    value: 'hard',
    label: 'Hard',
    desc: 'Goes for the kill every time. No mercy.',
    colorClass: styles.diffPink,
  },
];

export default function QuickPlay({ savedDecks, onStart, onBack }: QuickPlayProps) {
  const [difficulty, setDifficulty] = useState<AIDifficulty>('normal');
  const allDecks = [...starterDecks, ...savedDecks];

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className="btn-ghost" onClick={onBack}>
          ← Back
        </button>
        <h2 className={styles.title}>Quick Play</h2>
      </div>

      <section className={styles.section}>
        <h3 className={styles.sectionLabel}>Difficulty</h3>
        <div className={styles.difficultyRow}>
          {DIFFICULTY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={[
                styles.diffBtn,
                opt.colorClass,
                difficulty === opt.value ? styles.diffBtnActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => setDifficulty(opt.value)}
            >
              <span className={styles.diffLabel}>{opt.label}</span>
              <span className={styles.diffDesc}>{opt.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionLabel}>Your Deck</h3>
        <p className={styles.sectionHint}>Pick a deck to battle with. The bot gets a random one.</p>
        <div className={styles.deckGrid}>
          {allDecks.map((deck) => (
            <button
              key={deck.id}
              className={styles.deckCard}
              onClick={() => onStart(deck.id, difficulty)}
            >
              <span className={styles.deckName}>{deck.name}</span>
              <span className={styles.deckMeta}>{deck.cardIds.length} cards</span>
              <span className={styles.deckFight}>Fight ⚔</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
