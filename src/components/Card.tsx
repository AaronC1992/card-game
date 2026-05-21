import type { AnyCard, CreatureCard } from '../engine/types';
import styles from './Card.module.css';

interface CardProps {
  card: AnyCard;
  onClick?: () => void;
  onZoom?: () => void;
  dimmed?: boolean;
  selected?: boolean;
  compact?: boolean;
  showCount?: number;
  isNew?: boolean;
}

const elementColors: Record<string, string> = {
  Chaos: '#ff2d78',
  Office: '#90caf9',
  Digital: '#00f0ff',
  Consumer: '#a5d6a7',
  Mind: '#b44aff',
  Neutral: '#8880aa',
};

const cardTypeLabel: Record<string, string> = {
  creature: 'Creature',
  action: 'Action',
  item: 'Item',
  reaction: 'Reaction',
  field: 'Field',
};

export default function Card({
  card,
  onClick,
  onZoom,
  dimmed,
  selected,
  compact,
  showCount,
  isNew,
}: CardProps) {
  const elColor = elementColors[card.elementType] ?? '#aaa';
  const isCreature = card.cardType === 'creature';
  const creature = isCreature ? (card as CreatureCard) : null;

  const hpDisplay = creature ? `${creature.hp} HP` : null;

  return (
    <div
      className={[
        styles.card,
        dimmed ? styles.dimmed : '',
        selected ? styles.selected : '',
        compact ? styles.compact : '',
        isNew ? 'animate-cardDealIn' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      style={{ borderColor: selected ? elColor : undefined }}
    >
      {/* Art area */}
      <div className={styles.artArea} style={{ borderColor: elColor }}>
        <span className={styles.cardIcon}>
          {card.cardType === 'creature' ? '🦇' :
           card.cardType === 'action' ? '⚡' :
           card.cardType === 'item' ? '🧪' :
           card.cardType === 'reaction' ? '🛡️' : '🌀'}
        </span>
        <img
          key={card.artPath}
          src={`/${card.artPath}`}
          alt={card.name}
          className={styles.artImg}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        {hpDisplay && <div className={styles.hpBadge}>{hpDisplay}</div>}
      </div>

      {/* Card body */}
      <div className={styles.cardBody}>
        <div className={styles.cardHeader}>
          <span className={styles.cardName}>{card.name}</span>
          <span className={styles.cardRarity} data-rarity={card.rarity.toLowerCase()}>
            {card.rarity[0]}
          </span>
        </div>

        <div className={styles.cardMeta}>
          <span className={styles.elType} style={{ color: elColor }}>
            {card.elementType}
          </span>
          <span className={styles.cardTypeLabel}>{cardTypeLabel[card.cardType]}</span>
          {'cost' in card && (
            <span className={styles.costBadge}>{(card as { cost: number }).cost} AP</span>
          )}
        </div>

        {!compact && (
          <>
            {isCreature && creature && (
              <div className={styles.attacks}>
                {creature.attacks.map((atk, i) => (
                  <div key={i} className={styles.attack}>
                    <span className={styles.atkName}>{atk.name}</span>
                    <span className={styles.atkCost}>{atk.cost}AP</span>
                    <span className={styles.atkDmg}>{atk.damage}</span>
                  </div>
                ))}
              </div>
            )}

            {!isCreature && (
              <p className={styles.effectText}>
                {'effectDescription' in card
                  ? (card as { effectDescription: string }).effectDescription
                  : 'triggerCondition' in card
                  ? (card as { triggerCondition: string; effectDescription: string }).triggerCondition +
                    ' — ' +
                    (card as { effectDescription: string }).effectDescription
                  : ''}
              </p>
            )}

            <p className={styles.flavorText}>{card.flavorText}</p>
          </>
        )}
      </div>

      {showCount !== undefined && showCount > 1 && (
        <div className={styles.countBadge}>x{showCount}</div>
      )}

      {onZoom && (
        <button
          className={styles.zoomBtn}
          onClick={(e) => {
            e.stopPropagation();
            onZoom();
          }}
          title="Zoom card"
        >
          🔍
        </button>
      )}
    </div>
  );
}
