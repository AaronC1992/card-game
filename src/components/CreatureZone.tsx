import type { ActiveCreature } from '../engine/types';
import { useState, useEffect } from 'react';
import styles from './CreatureZone.module.css';

interface CreatureZoneProps {
  creature: ActiveCreature | null;
  isOpponent?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  hitKey?: number;
  damageNum?: number | null;
}

const statusColors: Record<string, string> = {
  Stressed: '#ff5722',
  Confused: '#9c27b0',
  Burnout: '#ff9800',
  Muted: '#607d8b',
  Petty: '#ffe600',
  Stunned: '#3949ab',
};

function HPBar({ current, max }: { current: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const cls = pct > 60 ? 'hp-fill-high' : pct > 25 ? 'hp-fill-mid' : 'hp-fill-low';
  return (
    <div className="hp-bar-wrap">
      <div className={`hp-bar-fill ${cls}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function CreatureZone({
  creature,
  isOpponent,
  isActive,
  onClick,
  hitKey,
  damageNum,
}: CreatureZoneProps) {
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    if (!hitKey) return;
    setShaking(true);
    const t = setTimeout(() => setShaking(false), 480);
    return () => clearTimeout(t);
  }, [hitKey]);

  if (!creature) {
    return (
      <div className={`${styles.zone} ${styles.empty}`}>
        <span className={styles.emptyLabel}>No Active Creature</span>
      </div>
    );
  }

  const { card, currentHp, maxHp, statusEffects, attachedItems, isMuted } = creature;

  return (
    <div
      className={[
        styles.zone,
        isActive ? styles.active : '',
        isOpponent ? styles.opponent : '',
        shaking ? 'animate-shake' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
    >
      {/* Floating damage number */}
      {damageNum !== null && damageNum !== undefined && (
        <div className={`damage-number ${styles.dmgFloat}`}>
          -{damageNum}
        </div>
      )}
      {/* Muted overlay */}
      {isMuted && <div className={styles.mutedBadge}>MUTED</div>}

      {/* Icon + name */}
      <div className={styles.header}>
        <span className={`${styles.icon} ${isActive ? styles.iconActive : ''}`}>
          {card.cardType === 'creature' ? '🦇' : '?'}
        </span>
        <div className={styles.nameArea}>
          <div className={styles.creatureName}>{card.name}</div>
          <div className={styles.typeRow}>
            <span className={`elType type-${card.elementType.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
              {card.elementType}
            </span>
          </div>
        </div>
        <div className={styles.hpDisplay}>
          <span className={styles.hpNum}>{currentHp}</span>
          <span className={styles.hpSep}>/</span>
          <span className={styles.hpMax}>{maxHp}</span>
        </div>
      </div>

      {/* HP bar */}
      <HPBar current={currentHp} max={maxHp} />

      {/* Status effects */}
      {statusEffects.length > 0 && (
        <div className={styles.statusRow}>
          {statusEffects.map((s) => (
            <span
              key={s}
              className="status-badge"
              style={{
                background: statusColors[s] ?? '#555',
                color: s === 'Petty' ? '#000' : '#fff',
              }}
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Attached items */}
      {attachedItems.length > 0 && (
        <div className={styles.itemsRow}>
          {attachedItems.map((item, i) => (
            <span key={i} className={styles.itemTag} title={item.name}>
              🧪 {item.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
