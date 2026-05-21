import type { BattleState } from '../engine/types';
import styles from './VictoryScreen.module.css';

interface VictoryScreenProps {
  state: BattleState;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

const winnerQuotes = [
  'Absolute carnage. Totally unnecessary. 10/10.',
  'They never stood a chance. Not even close.',
  'Somewhere, a therapist is getting a new client.',
  'The audacity. The gall. The victory.',
  'That was filthy. We love it.',
];

export default function VictoryScreen({ state, onPlayAgain, onMainMenu }: VictoryScreenProps) {
  const winnerId = state.winner;
  const winner = winnerId ? state[winnerId] : null;
  const loser = winnerId ? state[winnerId === 'player1' ? 'player2' : 'player1'] : null;
  const quote = winnerQuotes[Math.floor(Math.random() * winnerQuotes.length)];

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.winLabel}>WINNER</div>
        <h1 className={styles.winnerName}>{winner?.name ?? 'Unknown'}</h1>
        <p className={styles.quote}>{quote}</p>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>KOs Scored</span>
            <span className={styles.statVal}>{winner?.knockoutsScored ?? 0}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Turns Played</span>
            <span className={styles.statVal}>{state.turnNumber}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Loser</span>
            <span className={styles.statVal}>{loser?.name ?? 'N/A'}</span>
          </div>
        </div>

        <div className={styles.buttons}>
          <button className="btn-primary" onClick={onPlayAgain}>
            ⚔️ Play Again
          </button>
          <button className="btn-ghost" onClick={onMainMenu}>
            🏠 Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
