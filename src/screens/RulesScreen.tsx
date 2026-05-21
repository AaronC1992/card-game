import { rulesText } from '../data/rules';
import styles from './RulesScreen.module.css';

interface RulesScreenProps {
  onBack: () => void;
}

export default function RulesScreen({ onBack }: RulesScreenProps) {
  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <h2 className={styles.title}>Rules</h2>
        <button className="btn-ghost" onClick={onBack}>← Back</button>
      </div>
      <div className={styles.content}>
        <pre className={styles.text}>{rulesText}</pre>
      </div>
    </div>
  );
}
