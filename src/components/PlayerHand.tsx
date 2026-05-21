import type { AnyCard, BattleState } from '../engine/types';
import { useState, useEffect, useRef } from 'react';
import Card from './Card';
import styles from './PlayerHand.module.css';

interface PlayerHandProps {
  battleState: BattleState;
  playerId: 'player1' | 'player2';
  isCurrentTurn: boolean;
  selectedCard: string | null;
  onSelectCard: (id: string | null) => void;
  onPlayCard: (id: string) => void;
  onZoom: (card: AnyCard) => void;
}

export default function PlayerHand({
  battleState,
  playerId,
  isCurrentTurn,
  selectedCard,
  onSelectCard,
  onPlayCard,
  onZoom,
}: PlayerHandProps) {
  const player = battleState[playerId];
  const ap = player.actionPoints;

  // Track new cards for draw animation
  const prevHandRef = useRef<string[]>([]);
  const [newCardIds, setNewCardIds] = useState<Set<string>>(new Set());
  const handKey = player.hand.map(c => c.id).join(',');

  useEffect(() => {
    const prevSet = new Set(prevHandRef.current);
    const currentIds = player.hand.map(c => c.id);
    const added = currentIds.filter(id => !prevSet.has(id));
    prevHandRef.current = currentIds;
    if (added.length > 0) {
      const addedSet = new Set(added);
      setNewCardIds(addedSet);
      const t = setTimeout(() => setNewCardIds(new Set()), 600);
      return () => clearTimeout(t);
    }
  }, [handKey]);

  const canPlay = (card: AnyCard): boolean => {
    const cost = (card as { cost?: number }).cost ?? 0;
    if (ap < cost) return false;
    if (card.cardType === 'creature') return player.bench.length < 3;
    if (card.cardType === 'reaction') return false;
    return true;
  };

  const handleClick = (card: AnyCard) => {
    if (!isCurrentTurn) return;
    if (!canPlay(card)) return;
    if (selectedCard === card.id) {
      onPlayCard(card.id);
      onSelectCard(null);
    } else {
      onSelectCard(card.id);
    }
  };

  return (
    <div className={styles.handWrap}>
      <div className={styles.handLabel}>
        {isCurrentTurn ? '▶ Your Hand' : `${player.name}'s Hand`}
        <span className={styles.apDisplay}>{ap} AP</span>
        <span className={styles.deckCount}>Deck: {player.deck.length}</span>
      </div>
      <div className={styles.hand}>
        {player.hand.length === 0 && (
          <div className={styles.emptyHand}>No cards in hand</div>
        )}
        {player.hand.map((card) => (
          <Card
            key={card.id}
            card={card}
            onClick={() => handleClick(card)}
            onZoom={() => onZoom(card)}
            dimmed={isCurrentTurn && !canPlay(card)}
            selected={selectedCard === card.id}
            isNew={newCardIds.has(card.id)}
          />
        ))}
      </div>
      {selectedCard && isCurrentTurn && (
        <div className={styles.hint}>Click the highlighted card again to play it</div>
      )}
    </div>
  );
}
