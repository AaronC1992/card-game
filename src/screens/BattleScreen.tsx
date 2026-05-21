import React, { useState, useEffect, useRef } from 'react';
import type { BattleState, AnyCard, GameSettings, AIDifficulty } from '../engine/types';
import {
  performAttack,
  playCard,
  endTurn,
  swapActive,
  promoteBenchToActive,
} from '../engine/battleEngine';
import { runBotTurn } from '../engine/botLogic';
import CreatureZone from '../components/CreatureZone';
import PlayerHand from '../components/PlayerHand';
import TurnLog from '../components/TurnLog';
import Card from '../components/Card';
import styles from './BattleScreen.module.css';

interface BattleScreenProps {
  initialState: BattleState;
  settings: GameSettings;
  difficulty?: AIDifficulty;
  onGameOver: (state: BattleState) => void;
  onForfeit: () => void;
}

const BG_PARTICLES = [
  { id: 0, left: '4%',  color: '#ff2d78', size: 3, dur: '12s', delay: '-2s'   },
  { id: 1, left: '11%', color: '#b44aff', size: 2, dur: '9s',  delay: '-5s'   },
  { id: 2, left: '21%', color: '#00f0ff', size: 2, dur: '14s', delay: '-1s'   },
  { id: 3, left: '30%', color: '#ffe600', size: 3, dur: '11s', delay: '-7s'   },
  { id: 4, left: '41%', color: '#ff2d78', size: 2, dur: '8s',  delay: '-3.5s' },
  { id: 5, left: '52%', color: '#b44aff', size: 3, dur: '13s', delay: '-9s'   },
  { id: 6, left: '62%', color: '#00f0ff', size: 2, dur: '10s', delay: '-4s'   },
  { id: 7, left: '73%', color: '#ffe600', size: 3, dur: '15s', delay: '-6.5s' },
  { id: 8, left: '81%', color: '#ff2d78', size: 2, dur: '9s',  delay: '-8s'   },
  { id: 9, left: '90%', color: '#b44aff', size: 3, dur: '11s', delay: '-0.5s' },
  { id: 10, left: '16%', color: '#00f0ff', size: 2, dur: '16s', delay: '-10s'  },
  { id: 11, left: '46%', color: '#ff2d78', size: 3, dur: '7s',  delay: '-2.5s' },
  { id: 12, left: '67%', color: '#ffe600', size: 2, dur: '18s', delay: '-12s'  },
  { id: 13, left: '88%', color: '#00f0ff', size: 2, dur: '10s', delay: '-5.5s' },
];

export default function BattleScreen({
  initialState,
  settings,
  difficulty = 'normal',
  onGameOver,
  onForfeit,
}: BattleScreenProps) {
  const [state, setState] = useState<BattleState>(initialState);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [zoomedCard, setZoomedCard] = useState<AnyCard | null>(null);
  const [botRunning, setBotRunning] = useState(false);

  // ── Animation state ──
  const [p1HitKey, setP1HitKey] = useState(0);
  const [p2HitKey, setP2HitKey] = useState(0);
  const [p1DmgNum, setP1DmgNum] = useState<number | null>(null);
  const [p2DmgNum, setP2DmgNum] = useState<number | null>(null);
  const [koBanner, setKoBanner] = useState<string | null>(null);
  const [turnBanner, setTurnBanner] = useState<string | null>(null);
  const prevP1Hp = useRef<number | null>(null);
  const prevP2Hp = useRef<number | null>(null);
  const prevTurn = useRef<string>(initialState.currentTurn);
  const prevLogLen = useRef(0);
  const koBannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isP1Turn = state.currentTurn === 'player1';
  const isBotTurn = settings.botMode && state.currentTurn === 'player2';

  // Bot automation
  useEffect(() => {
    if (!isBotTurn || state.phase === 'game-over' || botRunning) return;
    setBotRunning(true);
    runBotTurn(state, (updated) => setState(updated), difficulty).then((finalState) => {
      setState(finalState);
      setBotRunning(false);
      if (finalState.phase === 'game-over') onGameOver(finalState);
    });
  }, [state.currentTurn, isBotTurn, state.phase]);

  // ── Detect HP drops → shake + floating damage number ──
  useEffect(() => {
    const p1Hp = state.player1.activeCreature?.currentHp ?? null;
    const p2Hp = state.player2.activeCreature?.currentHp ?? null;
    if (prevP1Hp.current !== null && p1Hp !== null && p1Hp < prevP1Hp.current) {
      setP1HitKey(k => k + 1);
      const dmg = prevP1Hp.current - p1Hp;
      setP1DmgNum(dmg);
      setTimeout(() => setP1DmgNum(null), 1100);
    }
    if (prevP2Hp.current !== null && p2Hp !== null && p2Hp < prevP2Hp.current) {
      setP2HitKey(k => k + 1);
      const dmg = prevP2Hp.current - p2Hp;
      setP2DmgNum(dmg);
      setTimeout(() => setP2DmgNum(null), 1100);
    }
    prevP1Hp.current = p1Hp;
    prevP2Hp.current = p2Hp;
  }, [state.player1.activeCreature?.currentHp, state.player2.activeCreature?.currentHp]);

  // ── Detect KO events ──
  useEffect(() => {
    if (state.log.length > prevLogLen.current) {
      const newEntries = state.log.slice(prevLogLen.current);
      const koEntry = newEntries.find(e => e.type === 'ko');
      prevLogLen.current = state.log.length;
      if (koEntry) {
        if (koBannerTimer.current) clearTimeout(koBannerTimer.current);
        setKoBanner(koEntry.message);
        koBannerTimer.current = setTimeout(() => setKoBanner(null), 2600);
      }
    }
  }, [state.log.length]);

  // ── Detect turn changes → banner ──
  useEffect(() => {
    if (prevTurn.current !== state.currentTurn && state.phase !== 'game-over') {
      prevTurn.current = state.currentTurn;
      const msg = state.currentTurn === 'player1'
        ? `${state.player1.name}'s Turn!`
        : settings.botMode ? 'Bot Thinking...' : `${state.player2.name}'s Turn!`;
      setTurnBanner(msg);
      const t = setTimeout(() => setTurnBanner(null), 1800);
      return () => clearTimeout(t);
    }
  }, [state.currentTurn]);

  const update = (next: BattleState) => {
    setState(next);
    if (next.phase === 'game-over') onGameOver(next);
  };

  const handleAttack = (idx: 0 | 1) => {
    if (isBotTurn || botRunning) return;
    update(performAttack(state, idx));
    setSelectedCard(null);
  };

  const handlePlayCard = (cardId: string) => {
    if (isBotTurn || botRunning) return;
    update(playCard(state, cardId));
    setSelectedCard(null);
  };

  const handleEndTurn = () => {
    if (isBotTurn || botRunning) return;
    update(endTurn(state));
    setSelectedCard(null);
  };

  const handleSwap = (idx: number) => {
    if (isBotTurn || botRunning) return;
    update(swapActive(state, idx));
  };

  const handlePromote = (playerId: 'player1' | 'player2', idx: number) => {
    update(promoteBenchToActive(state, playerId, idx));
  };

  const currentP = state[state.currentTurn];
  const p1 = state.player1;
  const p2 = state.player2;

  const attacks = p1.activeCreature?.card.attacks ?? [];

  return (
    <div className={[styles.screen, isP1Turn && state.phase !== 'game-over' ? styles.playerTurn : ''].filter(Boolean).join(' ')}>

      {/* Background particles */}
      <div className={styles.particles} aria-hidden="true">
        {BG_PARTICLES.map(p => (
          <span
            key={p.id}
            className={styles.particle}
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              background: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              '--dur': p.dur,
              '--delay': p.delay,
            } as React.CSSProperties}
          />
        ))}
      </div>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.playerScore}>
          <span className={styles.pName}>{p1.name}</span>
          <span className={styles.koScore}>KOs: {p1.knockoutsScored} / 3</span>
        </div>
        <div className={styles.turnInfo}>
          {isBotTurn ? '🤖 Bot thinking...' : isP1Turn ? `${p1.name}'s Turn` : `${p2.name}'s Turn`}
          <span className={styles.turnNum}>Turn {state.turnNumber}</span>
        </div>
        <div className={styles.playerScore} style={{ textAlign: 'right' }}>
          <span className={styles.pName}>{p2.name}</span>
          <span className={styles.koScore}>KOs: {p2.knockoutsScored} / 3</span>
        </div>
      </div>

      {/* Field effects */}
      {state.fieldEffects.length > 0 && (
        <div className={styles.fieldRow}>
          {state.fieldEffects.map((f, i) => (
            <span key={i} className={styles.fieldTag}>
              🌀 {f.card.name} ({f.turnsRemaining}t)
            </span>
          ))}
        </div>
      )}

      {/* Main battle area */}
      <div className={styles.battlefield}>
        {/* Opponent zone */}
        <div className={styles.playerZone}>
          <div className={styles.benchRow}>
            {p2.bench.map((bc, i) => (
              <div key={i} className={styles.benchSlot}>
                <div className={styles.benchIcon}>🦇</div>
                <div className={styles.benchName}>{bc.card.name}</div>
                <div className={styles.benchHp}>{bc.currentHp}/{bc.maxHp}</div>
                {!p2.activeCreature && (
                  <button
                    className="btn-ghost"
                    style={{ fontSize: '0.65rem', padding: '2px 6px' }}
                    onClick={() => handlePromote('player2', i)}
                  >
                    Send Out
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className={styles.activeArea}>
            <CreatureZone creature={p2.activeCreature} isOpponent hitKey={p2HitKey} damageNum={p2DmgNum} />
          </div>
        </div>

        {/* VS divider */}
        <div className={styles.vsDivider}>
          <span className={styles.vsText}>⚔</span>
        </div>

        {/* Player zone */}
        <div className={styles.playerZone}>
          <div className={styles.activeArea}>
            <CreatureZone
              creature={p1.activeCreature}
              isActive={isP1Turn}
              hitKey={p1HitKey}
              damageNum={p1DmgNum}
            />
          </div>

          {/* Attack buttons */}
          {isP1Turn && p1.activeCreature && p2.activeCreature && (
            <div className={styles.attackButtons}>
              {(() => {
                const stressedExtra = p1.activeCreature &&
                  p1.activeCreature.statusEffects.includes('Stressed') &&
                  !p1.activeCreature.attachedItems.some(it => it.effectKey === 'immuneToStressedCost')
                  ? 1 : 0;
                return attacks.map((atk, i) => {
                  const totalCost = atk.cost + stressedExtra;
                  return (
                    <button
                      key={i}
                      className={`btn-primary ${styles.attackBtn}`}
                      onClick={() => handleAttack(i as 0 | 1)}
                      disabled={p1.actionPoints < totalCost || botRunning}
                      title={atk.effect ?? ''}
                    >
                      <span className={styles.atkBtnName}>{atk.name}</span>
                      <span className={styles.atkBtnMeta}>{totalCost}AP · {atk.damage}dmg</span>
                    </button>
                  );
                });
              })()}
            </div>
          )}

          {/* Bench */}
          <div className={styles.benchRow}>
            {p1.bench.map((bc, i) => (
              <div key={i} className={styles.benchSlot}>
                <div className={styles.benchIcon}>🦇</div>
                <div className={styles.benchName}>{bc.card.name}</div>
                <div className={styles.benchHp}>{bc.currentHp}/{bc.maxHp}</div>
                {isP1Turn && p1.activeCreature && (
                  <button
                    className="btn-ghost"
                    style={{ fontSize: '0.65rem', padding: '2px 6px' }}
                    onClick={() => handleSwap(i)}
                    disabled={botRunning}
                  >
                    Swap
                  </button>
                )}
                {isP1Turn && !p1.activeCreature && (
                  <button
                    className="btn-ghost"
                    style={{ fontSize: '0.65rem', padding: '2px 6px' }}
                    onClick={() => handlePromote('player1', i)}
                  >
                    Send Out
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Player hand */}
      <div className={styles.handSection}>
        <PlayerHand
          battleState={state}
          playerId={isP1Turn ? 'player1' : 'player2'}
          isCurrentTurn={!isBotTurn && !botRunning}
          selectedCard={selectedCard}
          onSelectCard={setSelectedCard}
          onPlayCard={handlePlayCard}
          onZoom={setZoomedCard}
        />
      </div>

      {/* Action bar */}
      <div className={styles.actionBar}>
        <button
          className="btn-yellow"
          onClick={handleEndTurn}
          disabled={isBotTurn || botRunning}
        >
          End Turn
        </button>
        <button className="btn-ghost" onClick={onForfeit} disabled={botRunning}>
          Forfeit
        </button>
      </div>

      {/* Turn log */}
      <div className={styles.logSection}>
        <TurnLog entries={state.log.slice(-40)} />
      </div>

      {/* Zoomed card modal */}
      {zoomedCard && (
        <div className="modal-overlay" onClick={() => setZoomedCard(null)}>
          <div style={{ transform: 'scale(1.8)', transformOrigin: 'center' }}>
            <Card card={zoomedCard} />
          </div>
        </div>
      )}

      {/* KO banner */}
      {koBanner && (
        <div className={styles.koBannerOverlay} aria-live="assertive">
          <div className={styles.koBannerText}>KO!</div>
          <div className={styles.koBannerSub}>{koBanner}</div>
        </div>
      )}

      {/* Turn change banner */}
      {turnBanner && (
        <div className={styles.turnBannerOverlay} aria-live="polite">
          <div className={styles.turnBannerText}>{turnBanner}</div>
        </div>
      )}
    </div>
  );
}
