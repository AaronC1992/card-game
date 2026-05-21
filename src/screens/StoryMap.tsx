import React, { useState } from 'react';
import type { StorySave, StoryChapter } from '../data/storyMode';
import { storyChapters, storyStarterPacks } from '../data/storyMode';
import styles from './StoryMap.module.css';

interface StoryMapProps {
  storySave: StorySave | null;
  onStartChapter: (chapterIdx: number) => void;
  onChooseStarter: (starterId: string) => void;
  onBack: () => void;
  onReset: () => void;
}

const DIFF_COLORS: Record<string, string> = {
  Easy: styles.diffEasy,
  Normal: styles.diffNormal,
  Hard: styles.diffHard,
};

export default function StoryMap({
  storySave,
  onStartChapter,
  onChooseStarter,
  onBack,
  onReset,
}: StoryMapProps) {
  const [confirmReset, setConfirmReset] = useState(false);

  if (!storySave) {
    return (
      <div className={styles.screen}>
        <div className={styles.header}>
          <button className="btn-ghost" onClick={onBack}>← Back</button>
          <h2 className={styles.title}>Story Mode</h2>
          <div />
        </div>
        <div className={styles.starterSection}>
          <p className={styles.starterIntro}>
            Choose your starter pack. Your deck grows as you beat each opponent.
          </p>
          <div className={styles.starterGrid}>
            {storyStarterPacks.map((pack) => (
              <button
                key={pack.id}
                className={styles.starterCard}
                onClick={() => onChooseStarter(pack.id)}
              >
                <span className={styles.starterName}>{pack.name}</span>
                <span className={styles.starterMeta}>{pack.cardIds.length} cards to start</span>
                <span className={styles.starterCta}>Begin ⚔</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { completedChapters, unlockedThrough, deckIds } = storySave;

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button className="btn-ghost" onClick={onBack}>← Back</button>
        <h2 className={styles.title}>Story Mode</h2>
        <div className={styles.deckBadge}>{deckIds.length} cards</div>
      </div>

      <div className={styles.chapterList}>
        {storyChapters.map((ch: StoryChapter) => {
          const isCompleted = completedChapters.includes(ch.id);
          const isUnlocked = ch.id <= unlockedThrough;
          const isLocked = !isUnlocked;

          return (
            <div
              key={ch.id}
              className={[
                styles.chapterCard,
                isCompleted ? styles.completed : '',
                isLocked ? styles.locked : '',
              ].filter(Boolean).join(' ')}
            >
              <div className={styles.chapterNum}>
                {isCompleted ? '✓' : isLocked ? '🔒' : ch.id + 1}
              </div>
              <div className={styles.chapterInfo}>
                <div className={styles.chapterTitle}>{ch.title}</div>
                <div className={styles.chapterOpponent}>{ch.opponentName}</div>
                <div className={styles.chapterFlavor}>{ch.flavor}</div>
              </div>
              <div className={styles.chapterRight}>
                <span className={[styles.diffTag, DIFF_COLORS[ch.difficultyLabel] ?? ''].join(' ')}>
                  {ch.difficultyLabel}
                </span>
                {!isLocked && (
                  <button
                    className={isCompleted ? 'btn-ghost' : 'btn-primary'}
                    onClick={() => onStartChapter(ch.id)}
                  >
                    {isCompleted ? 'Replay' : 'Fight ⚔'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.footer}>
        {!confirmReset ? (
          <button className="btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => setConfirmReset(true)}>
            Reset Story
          </button>
        ) : (
          <div className={styles.resetConfirm}>
            <span>This will erase all story progress.</span>
            <button className="btn-ghost" onClick={() => { onReset(); setConfirmReset(false); }}>
              Yes, reset
            </button>
            <button className="btn-ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
