import React, { useState } from 'react';
import type { AnyCard, DeckSave } from '../engine/types';
import { allCards } from '../data/cards';
import Card from '../components/Card';
import styles from './DeckBuilder.module.css';

const DECKS_KEY = 'fmbd_decks';
const MAX_DECK_SIZE = 30;
const MAX_COPIES = 2;

interface DeckBuilderProps {
  savedDecks: DeckSave[];
  onSave: (decks: DeckSave[]) => void;
  onBack: () => void;
}

export default function DeckBuilder({ savedDecks, onSave, onBack }: DeckBuilderProps) {
  const [deckName, setDeckName] = useState('My Deck');
  const [deckCardIds, setDeckCardIds] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string>('All');
  const [zoomedCard, setZoomedCard] = useState<AnyCard | null>(null);

  const typeOptions = ['All', 'Creature', 'Action', 'Item', 'Reaction', 'Field'];

  const filtered = allCards.filter((c) => {
    if (filterType === 'All') return true;
    return c.cardType.toLowerCase() === filterType.toLowerCase();
  });

  const countInDeck = (id: string) => deckCardIds.filter((x) => x === id).length;

  const addCard = (card: AnyCard) => {
    if (deckCardIds.length >= MAX_DECK_SIZE) return;
    if (countInDeck(card.id) >= MAX_COPIES) return;
    setDeckCardIds((prev) => [...prev, card.id]);
  };

  const removeCard = (id: string) => {
    const idx = deckCardIds.lastIndexOf(id);
    if (idx === -1) return;
    setDeckCardIds((prev) => [...prev.slice(0, idx), ...prev.slice(idx + 1)]);
  };

  const handleSave = () => {
    const newDeck: DeckSave = {
      id: `deck_${Date.now()}`,
      name: deckName.trim() || 'Unnamed Deck',
      cardIds: deckCardIds,
    };
    const updated = [...savedDecks, newDeck];
    localStorage.setItem(DECKS_KEY, JSON.stringify(updated));
    onSave(updated);
    onBack();
  };

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <h2 className={styles.title}>Deck Builder</h2>
        <button className="btn-ghost" onClick={onBack}>← Back</button>
      </div>

      <div className={styles.layout}>
        {/* Left: card browser */}
        <div className={styles.browserPanel}>
          <div className={styles.filters}>
            {typeOptions.map((t) => (
              <button
                key={t}
                className={filterType === t ? 'btn-primary' : 'btn-ghost'}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                onClick={() => setFilterType(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className={styles.cardGrid}>
            {filtered.map((card) => {
              const count = countInDeck(card.id);
              return (
                <div key={card.id} className={styles.cardWrap}>
                  <Card
                    card={card}
                    compact
                    onClick={() => addCard(card)}
                    onZoom={() => setZoomedCard(card)}
                    dimmed={count >= MAX_COPIES || deckCardIds.length >= MAX_DECK_SIZE}
                    showCount={count > 0 ? count : undefined}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: current deck */}
        <div className={styles.deckPanel}>
          <div className={styles.deckHeader}>
            <input
              className={styles.deckNameInput}
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              maxLength={30}
            />
            <span className={styles.deckCount}>{deckCardIds.length} / {MAX_DECK_SIZE}</span>
          </div>

          <div className={styles.deckList}>
            {deckCardIds.length === 0 && (
              <p className={styles.emptyHint}>Click cards to add them to your deck.</p>
            )}
            {(() => {
              const seen = new Map<string, number>();
              deckCardIds.forEach((id) => seen.set(id, (seen.get(id) ?? 0) + 1));
              return Array.from(seen.entries()).map(([id, count]) => {
                const card = allCards.find((c) => c.id === id);
                if (!card) return null;
                return (
                  <div key={id} className={styles.deckRow}>
                    <span className={styles.deckRowName}>{card.name}</span>
                    <span className={styles.deckRowCount}>x{count}</span>
                    <button
                      className="btn-ghost"
                      style={{ fontSize: '0.65rem', padding: '2px 7px' }}
                      onClick={() => removeCard(id)}
                    >
                      -
                    </button>
                  </div>
                );
              });
            })()}
          </div>

          <button
            className="btn-yellow"
            onClick={handleSave}
            disabled={deckCardIds.length < 10}
          >
            Save Deck
          </button>
        </div>
      </div>

      {zoomedCard && (
        <div className="modal-overlay" onClick={() => setZoomedCard(null)}>
          <div style={{ transform: 'scale(1.8)', transformOrigin: 'center' }}>
            <Card card={zoomedCard} />
          </div>
        </div>
      )}
    </div>
  );
}
