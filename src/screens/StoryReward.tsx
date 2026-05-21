import React, { useState } from 'react';
import type { AnyCard } from '../engine/types';
import Card from '../components/Card';
import styles from './StoryReward.module.css';

interface StoryRewardProps {
  chapterTitle: string;
  rewards: AnyCard[];
  onConfirm: (chosen: AnyCard[]) => void;
}

const PICK_COUNT = 2;

export default function StoryReward({ chapterTitle, rewards, onConfirm }: StoryRewardProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else if (next.size < PICK_COUNT) {
        next.add(idx);
      }
      return next;
    });
  };

  const canConfirm = selected.size === PICK_COUNT;

  return (
    <div className={styles.screen}>
      <div className={styles.inner}>
        <div className={styles.topLabel}>Chapter Complete</div>
        <h2 className={styles.title}>{chapterTitle}</h2>
        <p className={styles.subtitle}>Pick {PICK_COUNT} cards to add to your deck.</p>

        <div className={styles.cardRow}>
          {rewards.map((card, i) => (
            <div
              key={card.id + i}
              className={[
                styles.cardSlot,
                selected.has(i) ? styles.cardSlotSelected : '',
              ].filter(Boolean).join(' ')}
              onClick={() => toggle(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && toggle(i)}
              aria-pressed={selected.has(i)}
            >
              {selected.has(i) && <div className={styles.selectedBadge}>✓</div>}
              <Card card={card} />
            </div>
          ))}
        </div>

        <div className={styles.hint}>
          {selected.size} / {PICK_COUNT} selected
        </div>

        <button
          className="btn-primary"
          disabled={!canConfirm}
          onClick={() => onConfirm(rewards.filter((_, i) => selected.has(i)))}
        >
          Add to Deck →
        </button>
      </div>
    </div>
  );
}
