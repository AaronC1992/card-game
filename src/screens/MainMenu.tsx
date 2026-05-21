import type { GameSettings, DeckSave } from '../engine/types';
import { starterDecks } from '../data/starterDecks';
import styles from './MainMenu.module.css';

interface MainMenuProps {
  settings: GameSettings;
  savedDecks: DeckSave[];
  onQuickPlay: () => void;
  onStartBattle: () => void;
  onOpenDeckBuilder: () => void;
  onOpenCollection: () => void;
  onOpenRules: () => void;
  onOpenSettings: () => void;
  onStoryMode: () => void;
}

export default function MainMenu({
  settings,
  savedDecks,
  onQuickPlay,
  onStartBattle,
  onOpenDeckBuilder,
  onOpenCollection,
  onOpenRules,
  onOpenSettings,
  onStoryMode,
}: MainMenuProps) {
  return (
    <div className={styles.menu}>
      <div className={styles.titleBlock}>
        <div className={styles.ageWarning}>18+ Only. Crude humor ahead.</div>
        <h1 className={styles.title}>Filthy Minded<br />Battle Deck</h1>
        <p className={styles.subtitle}>
          A chaotic card battle game for adults who have given up on adulting.
        </p>
      </div>

      <div className={styles.buttons}>
        <button className="btn-primary" onClick={onStoryMode}>
          📖 Story Mode
        </button>
        <button className="btn-secondary" onClick={onQuickPlay}>
          ⚡ Quick Play
        </button>
        <button className="btn-secondary" onClick={onStartBattle}>
          ⚔️ Custom Battle
        </button>
        <button className="btn-secondary" onClick={onOpenDeckBuilder}>
          🃏 Deck Builder
        </button>
        <button className="btn-yellow" onClick={onOpenCollection}>
          📖 Card Collection
        </button>
        <button className="btn-ghost" onClick={onOpenRules}>
          📜 Rules
        </button>
        <button className="btn-ghost" onClick={onOpenSettings}>
          ⚙️ Settings
        </button>
      </div>

      <div className={styles.statRow}>
        <span>Saved Decks: {savedDecks.length}</span>
        <span>Starter Decks: {starterDecks.length}</span>
        <span>Mode: {settings.botMode ? 'Bot' : 'Local 2P'}</span>
      </div>
    </div>
  );
}
