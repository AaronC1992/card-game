// ============================================================
// FILTHY MINDED BATTLE DECK — Bot Logic
// Simple random AI for single player mode
// ============================================================

import type { AIDifficulty, BattleState } from './types';
import {
  performAttack,
  playCard,
  endTurn,
  swapActive,
  promoteBenchToActive,
  checkKO,
} from './battleEngine';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The bot always plays as player2
export async function runBotTurn(
  state: BattleState,
  onStateUpdate: (s: BattleState) => void,
  difficulty: AIDifficulty = 'normal'
): Promise<BattleState> {
  let s = state;

  if (s.currentTurn !== 'player2' || s.phase === 'game-over') return s;

  // If no active creature, try to play a creature from hand first, then promote bench
  if (!s.player2.activeCreature) {
    const creatureInHand = s.player2.hand.find((c) => c.cardType === 'creature');
    if (creatureInHand) {
      s = playCard(s, creatureInHand.id);
      onStateUpdate(s);
      await delay(600);
    }
    if (s.player2.bench.length > 0) {
      s = promoteBenchToActive(s, 'player2', 0);
      onStateUpdate(s);
      await delay(600);
    }
  }

  if (!s.player2.activeCreature) return endTurn(s);

  // Easy: 50% chance to skip card playing entirely
  const skipCards = difficulty === 'easy' && Math.random() < 0.5;
  const actionDelay = difficulty === 'easy' ? 1100 : difficulty === 'hard' ? 600 : 700;

  // Play cards from hand — greedy: play any affordable non-creature card first
  const maxIterations = 10;
  let iterations = 0;
  while (!skipCards && iterations < maxIterations) {
    iterations++;
    const hand = s.player2.hand;
    const ap = s.player2.actionPoints;

    // Find playable non-reaction cards
    const playable = hand.filter((c) => {
      if (c.cardType === 'reaction') return false;
      if (c.cardType === 'creature') return s.player2.bench.length < 3;
      const cost = (c as { cost?: number }).cost ?? 0;
      return cost <= ap;
    });

    if (playable.length === 0) break;

    // Pick a random playable card
    const card = playable[Math.floor(Math.random() * playable.length)];
    s = playCard(s, card.id);
    onStateUpdate(s);
    await delay(actionDelay);

    if (s.phase === 'game-over') return s;
  }

  // Attack — pick attack we can afford
  if (s.player2.activeCreature && s.player1.activeCreature) {
    const attacks = s.player2.activeCreature.card.attacks;
    const ap = s.player2.actionPoints;
    const opponentHp = s.player1.activeCreature.currentHp;

    const affordable = attacks
      .map((atk, i) => ({ atk, i }))
      .filter(({ atk }) => atk.cost <= ap);

    // Easy: 25% chance to skip attack entirely; pick random attack
    // Normal: pick highest damage
    // Hard: prefer lethal attack first, then highest damage
    if (affordable.length > 0) {
      const skipAttack = difficulty === 'easy' && Math.random() < 0.25;
      if (!skipAttack) {
        let chosen: { atk: { damage: number; cost: number }; i: number };
        if (difficulty === 'easy') {
          chosen = affordable[Math.floor(Math.random() * affordable.length)];
        } else if (difficulty === 'hard') {
          const lethal = affordable.find(({ atk }) => atk.damage >= opponentHp);
          chosen = lethal ?? affordable.sort((a, b) => b.atk.damage - a.atk.damage)[0];
        } else {
          chosen = affordable.sort((a, b) => b.atk.damage - a.atk.damage)[0];
        }
        s = performAttack(s, chosen.i as 0 | 1);
        onStateUpdate(s);
        await delay(difficulty === 'easy' ? 1000 : 800);
      }
    }
  }

  if (s.phase === 'game-over') return s;

  // End turn
  s = endTurn(s);
  onStateUpdate(s);
  return s;
}
