import type { LogEntry } from '../engine/types';
import { useEffect, useRef } from 'react';
import styles from './TurnLog.module.css';

interface TurnLogProps {
  entries: LogEntry[];
}

const typeClass: Record<string, string> = {
  attack: styles.attack,
  status: styles.status,
  card: styles.card,
  ko: styles.ko,
  system: styles.system,
};

export default function TurnLog({ entries }: TurnLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  return (
    <div className={styles.log}>
      <div className={styles.header}>Battle Log</div>
      <div className={styles.entries}>
        {entries.map((e) => (
          <div key={e.id} className={`${styles.entry} ${typeClass[e.type] ?? ''}`}>
            <span className={styles.turn}>T{e.turn}</span>
            <span className={styles.msg}>{e.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
