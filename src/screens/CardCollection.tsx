import React, { useState } from 'react';
import type { AnyCard } from '../engine/types';
import { allCards } from '../data/cards';
import Card from '../components/Card';
import styles from './CardCollection.module.css';

interface CardCollectionProps {
  onBack: () => void;
}

export default function CardCollection({ onBack }: CardCollectionProps) {
  const [filterType, setFilterType] = useState<string>('All');
  const [filterRarity, setFilterRarity] = useState<string>('All');
  const [zoomedCard, setZoomedCard] = useState<AnyCard | null>(null);

  const typeOptions = ['All', 'Creature', 'Action', 'Item', 'Reaction', 'Field'];
  const rarityOptions = ['All', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

  const filtered = allCards.filter((c) => {
    const typeMatch = filterType === 'All' || c.cardType.toLowerCase() === filterType.toLowerCase();
    const rarityMatch = filterRarity === 'All' || c.rarity.toLowerCase() === filterRarity.toLowerCase();
    return typeMatch && rarityMatch;
  });

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <h2 className={styles.title}>Card Collection</h2>
        <button className="btn-ghost" onClick={onBack}>← Back</button>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.filterGroup}>
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
        <div className={styles.filterGroup}>
          {rarityOptions.map((r) => (
            <button
              key={r}
              className={filterRarity === r ? 'btn-secondary' : 'btn-ghost'}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              onClick={() => setFilterRarity(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.count}>{filtered.length} cards</div>

      <div className={styles.grid}>
        {filtered.map((card) => (
          <Card
            key={card.id}
            card={card}
            compact
            onZoom={() => setZoomedCard(card)}
          />
        ))}
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
