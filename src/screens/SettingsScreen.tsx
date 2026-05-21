import React, { useState } from 'react';
import type { GameSettings } from '../engine/types';
import styles from './SettingsScreen.module.css';

const SETTINGS_KEY = 'fmbd_settings';

interface SettingsScreenProps {
  settings: GameSettings;
  onSave: (settings: GameSettings) => void;
  onBack: () => void;
}

export default function SettingsScreen({ settings, onSave, onBack }: SettingsScreenProps) {
  const [local, setLocal] = useState<GameSettings>({ ...settings });

  const handleSave = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(local));
    onSave(local);
    onBack();
  };

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <h2 className={styles.title}>Settings</h2>
        <button className="btn-ghost" onClick={onBack}>← Back</button>
      </div>

      <div className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Player 1 Name</label>
          <input
            className={styles.input}
            value={local.player1Name}
            onChange={(e) => setLocal((p) => ({ ...p, player1Name: e.target.value }))}
            maxLength={20}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Player 2 Name</label>
          <input
            className={styles.input}
            value={local.player2Name}
            onChange={(e) => setLocal((p) => ({ ...p, player2Name: e.target.value }))}
            maxLength={20}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            <span>Bot Mode</span>
            <input
              type="checkbox"
              checked={local.botMode}
              onChange={(e) => setLocal((p) => ({ ...p, botMode: e.target.checked }))}
            />
          </label>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            <span>Animations Enabled</span>
            <input
              type="checkbox"
              checked={local.animationsEnabled}
              onChange={(e) => setLocal((p) => ({ ...p, animationsEnabled: e.target.checked }))}
            />
          </label>
        </div>

        <button className="btn-primary" onClick={handleSave}>
          Save Settings
        </button>
      </div>
    </div>
  );
}
