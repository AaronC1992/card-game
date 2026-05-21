// ============================================================
// FILTHY MINDED BATTLE DECK — Battle Engine
// ============================================================

import type {
  BattleState,
  PlayerState,
  ActiveCreature,
  AnyCard,
  CreatureCard,
  ActionCard,
  ItemCard,
  ReactionCard,
  StatusEffect,
  LogEntry,
  FieldEffect,
} from './types';
import { allCards, getCardById } from '../data/cards';

let logIdCounter = 0;

function makeLog(
  turn: number,
  message: string,
  type: LogEntry['type'] = 'system'
): LogEntry {
  return { id: logIdCounter++, turn, message, type };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function coinFlip(): 'heads' | 'tails' {
  return Math.random() < 0.5 ? 'heads' : 'tails';
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ============================================================
// Build player state from deck card IDs
// ============================================================
export function buildPlayerState(
  id: 'player1' | 'player2',
  name: string,
  cardIds: string[]
): PlayerState {
  const cards: AnyCard[] = cardIds
    .map((cid) => getCardById(cid))
    .filter(Boolean) as AnyCard[];
  const shuffled = shuffle(cards);
  const hand = shuffled.slice(0, 5);
  const rest = shuffled.slice(5);

  // Ensure at least 2 creature cards in the opening hand so that after
  // auto-placement of the active creature, at least 1 attacker remains.
  const MIN_CREATURES = 2;
  let creatureCountInHand = hand.filter((c) => c.cardType === 'creature').length;
  if (creatureCountInHand < MIN_CREATURES) {
    for (let i = 0; i < rest.length && creatureCountInHand < MIN_CREATURES; i++) {
      if (rest[i].cardType === 'creature') {
        // Find the first non-creature in hand to swap out
        const swapIdx = hand.findIndex((c) => c.cardType !== 'creature');
        if (swapIdx === -1) break; // hand is already all creatures
        rest.push(hand[swapIdx]);  // send the non-creature back to deck
        hand[swapIdx] = rest[i];
        rest.splice(i, 1);
        i--; // adjust index after splice
        creatureCountInHand++;
      }
    }
  }

  const deck = shuffle(rest); // re-shuffle the remainder so swapped cards aren't predictable
  return {
    id,
    name,
    deck,
    hand,
    discardPile: [],
    activeCreature: null,
    bench: [],
    actionPoints: 3,
    maxActionPoints: 3,
    knockedOutCount: 0,
    knockoutsScored: 0,
  };
}

export function makeInitialBattleState(p1: PlayerState, p2: PlayerState): BattleState {
  // Auto place first creature in hand as active for each player
  const autoPlace = (p: PlayerState): PlayerState => {
    const firstCreatureIdx = p.hand.findIndex((c) => c.cardType === 'creature');
    if (firstCreatureIdx === -1) return p;
    const card = p.hand[firstCreatureIdx] as CreatureCard;
    const newHand = p.hand.filter((_, i) => i !== firstCreatureIdx);
    return {
      ...p,
      hand: newHand,
      activeCreature: makeActiveCreature(card),
    };
  };
  return {
    player1: autoPlace(p1),
    player2: autoPlace(p2),
    currentTurn: 'player1',
    turnNumber: 1,
    fieldEffects: [],
    log: [makeLog(0, 'Battle started! Filthy Minded Battle Deck — for adults 18+', 'system')],
    phase: 'main',
    winner: null,
    zoomedCard: null,
    pendingBurnout: [],
    reactionsAvailable: true,
    lastAttackInfo: null,
  };
}

export function makeActiveCreature(card: CreatureCard): ActiveCreature {
  return {
    card,
    currentHp: card.hp,
    maxHp: card.hp,
    statusEffects: [],
    attachedItems: [],
    damageCounters: 0,
    isMuted: false,
  };
}

// ============================================================
// Getters
// ============================================================
export function currentPlayer(state: BattleState): PlayerState {
  return state[state.currentTurn];
}
export function opposingPlayer(state: BattleState): PlayerState {
  return state[state.currentTurn === 'player1' ? 'player2' : 'player1'];
}
export function opposingId(id: 'player1' | 'player2'): 'player1' | 'player2' {
  return id === 'player1' ? 'player2' : 'player1';
}

// ============================================================
// Status helpers
// ============================================================
function hasStatus(creature: ActiveCreature, status: StatusEffect): boolean {
  return creature.statusEffects.includes(status);
}

function addStatus(creature: ActiveCreature, status: StatusEffect): ActiveCreature {
  if (creature.statusEffects.includes(status)) return creature;
  return { ...creature, statusEffects: [...creature.statusEffects, status] };
}

function removeStatus(creature: ActiveCreature, status: StatusEffect): ActiveCreature {
  return {
    ...creature,
    statusEffects: creature.statusEffects.filter((s) => s !== status),
  };
}

function clearAllStatuses(creature: ActiveCreature): ActiveCreature {
  return { ...creature, statusEffects: [], isMuted: false };
}

// ============================================================
// Apply damage to active creature (returns updated creature + damage dealt)
// ============================================================
function applyDamageToCreature(
  creature: ActiveCreature,
  rawDamage: number,
  fieldEffects: FieldEffect[]
): { creature: ActiveCreature; actual: number } {
  // Armor from items
  const armor = creature.attachedItems.reduce((sum, item) => sum + (item.armor ?? 0), 0);
  // Damage reduction from Brand Deal Shield
  const reduction = creature.attachedItems.some((i) => i.effectKey === 'damageReduction10') ? 10 : 0;
  const actual = Math.max(0, rawDamage - armor - reduction);
  const newHp = Math.max(0, creature.currentHp - actual);
  return {
    creature: {
      ...creature,
      currentHp: newHp,
      damageCounters: creature.damageCounters + Math.floor(actual / 10),
    },
    actual,
  };
}

// ============================================================
// Draw cards
// ============================================================
export function drawCards(
  state: BattleState,
  playerId: 'player1' | 'player2',
  count: number
): BattleState {
  let p = state[playerId];
  const logs: LogEntry[] = [];
  for (let i = 0; i < count; i++) {
    if (p.deck.length === 0) {
      logs.push(makeLog(state.turnNumber, `${p.name} deck is empty and cannot draw.`, 'system'));
      break;
    }
    const [card, ...rest] = p.deck;
    p = { ...p, deck: rest, hand: [...p.hand, card] };
    logs.push(makeLog(state.turnNumber, `${p.name} drew a card.`, 'system'));
  }
  return { ...state, [playerId]: p, log: [...state.log, ...logs] };
}

// ============================================================
// Start turn
// ============================================================
export function startTurn(state: BattleState): BattleState {
  const pid = state.currentTurn;
  let s = state;

  // Field effect: lessAPBoth
  const lessBoth = s.fieldEffects.some((f) => f.card.effectKey === 'lessAPBoth');
  // Field effect: extraDrawBoth
  const extraDrawBoth = s.fieldEffects.some((f) => f.card.effectKey === 'extraDrawBoth');
  // Item: extraAPPerTurn1
  const activeHasAPItem =
    s[pid].activeCreature?.attachedItems.some((i) => i.effectKey === 'extraAPPerTurn1') ?? false;
  // Night mode goggles: extra draw
  const activeHasNightMode =
    s[pid].activeCreature?.attachedItems.some((i) => i.effectKey === 'extraDrawPerTurn') ?? false;

  const baseAP = s[pid].maxActionPoints - (lessBoth ? 1 : 0) + (activeHasAPItem ? 1 : 0);

  s = {
    ...s,
    [pid]: {
      ...s[pid],
      actionPoints: Math.max(1, baseAP),
    },
  };

  // Draw 1 card
  s = drawCards(s, pid, 1 + (extraDrawBoth ? 1 : 0) + (activeHasNightMode ? 1 : 0));

  // Apply burnout damage
  if (s[pid].activeCreature && hasStatus(s[pid].activeCreature!, 'Burnout')) {
    const { creature, actual } = applyDamageToCreature(s[pid].activeCreature!, 10, s.fieldEffects);
    s = {
      ...s,
      [pid]: { ...s[pid], activeCreature: creature },
      log: [
        ...s.log,
        makeLog(s.turnNumber, `${s[pid].name}'s ${creature.card.name} takes 10 Burnout damage!`, 'status'),
      ],
    };
    s = checkKO(s, pid);
  }

  // Passive regen items (Stress Ball of Power)
  if (s[pid].activeCreature?.attachedItems.some((i) => i.effectKey === 'regenHP10')) {
    const c = s[pid].activeCreature!;
    const newHp = Math.min(c.maxHp, c.currentHp + 10);
    s = {
      ...s,
      [pid]: {
        ...s[pid],
        activeCreature: { ...c, currentHp: newHp },
      },
      log: [...s.log, makeLog(s.turnNumber, `${c.card.name} regenerates 10 HP.`, 'status')],
    };
  }

  // doTEnemy10 — Unread Messages Curse attached to the active creature
  if (s[pid].activeCreature?.attachedItems.some((i) => i.effectKey === 'doTEnemy10')) {
    const c = s[pid].activeCreature!;
    const { creature, actual } = applyDamageToCreature(c, 10, s.fieldEffects);
    s = {
      ...s,
      [pid]: { ...s[pid], activeCreature: creature },
      log: [...s.log, makeLog(s.turnNumber, `Unread Messages Curse deals ${actual} damage to ${c.card.name}!`, 'status')],
    };
    s = checkKO(s, pid);
  }

  // Passive: Regret Wraith drainEnemyAP1
  const oppId = opposingId(pid);
  if (s[oppId].activeCreature?.card.passive.triggerKey === 'drainEnemyAP1') {
    s = {
      ...s,
      [pid]: {
        ...s[pid],
        actionPoints: Math.max(0, s[pid].actionPoints - 1),
      },
      log: [...s.log, makeLog(s.turnNumber, `Regret Wraith drains 1 AP from ${s[pid].name}!`, 'status')],
    };
  }

  // Muted: clear after 1 turn
  if (s[pid].activeCreature && s[pid].activeCreature!.isMuted) {
    s = {
      ...s,
      [pid]: {
        ...s[pid],
        activeCreature: { ...s[pid].activeCreature!, isMuted: false },
      },
    };
  }

  s = {
    ...s,
    log: [...s.log, makeLog(s.turnNumber, `--- ${s[pid].name}'s turn ---`, 'system')],
  };

  return s;
}

// ============================================================
// Check for knockouts
// ============================================================
export function checkKO(state: BattleState, pid: 'player1' | 'player2'): BattleState {
  let s = state;
  const p = s[pid];
  if (!p.activeCreature || p.activeCreature.currentHp > 0) return s;

  const oppId = opposingId(pid);
  const knocked = p.activeCreature;

  s = {
    ...s,
    log: [
      ...s.log,
      makeLog(s.turnNumber, `${knocked.card.name} was knocked out!`, 'ko'),
    ],
    [pid]: {
      ...s[pid],
      activeCreature: null,
      discardPile: [...s[pid].discardPile, knocked.card, ...knocked.attachedItems],
      knockedOutCount: s[pid].knockedOutCount + 1,
    },
    [oppId]: {
      ...s[oppId],
      knockoutsScored: s[oppId].knockoutsScored + 1,
    },
  };

  // Check win condition
  if (s[oppId].knockoutsScored >= 3) {
    s = { ...s, winner: oppId, phase: 'game-over' };
    s = {
      ...s,
      log: [...s.log, makeLog(s.turnNumber, `${s[oppId].name} wins the battle!`, 'system')],
    };
    return s;
  }

  // Auto promote from bench
  if (s[pid].bench.length > 0) {
    const [next, ...rest] = s[pid].bench;
    s = {
      ...s,
      [pid]: {
        ...s[pid],
        activeCreature: next,
        bench: rest,
      },
      log: [
        ...s.log,
        makeLog(s.turnNumber, `${s[pid].name} sends out ${next.card.name}!`, 'system'),
      ],
    };
  } else {
    // Check if this player has any creatures left in hand or deck
    const hasCreatureInHand = s[pid].hand.some((c) => c.cardType === 'creature');
    const hasCreatureInDeck = s[pid].deck.some((c) => c.cardType === 'creature');
    if (!hasCreatureInHand && !hasCreatureInDeck) {
      // Truly no creatures left anywhere — game over
      s = {
        ...s,
        winner: oppId,
        phase: 'game-over',
        log: [
          ...s.log,
          makeLog(s.turnNumber, `${s[pid].name} has no creatures left!`, 'system'),
          makeLog(s.turnNumber, `${s[oppId].name} wins the battle!`, 'system'),
        ],
      };
    } else {
      s = {
        ...s,
        log: [
          ...s.log,
          makeLog(s.turnNumber, `${s[pid].name} has no benched creatures!`, 'system'),
        ],
      };
    }
  }

  return s;
}

// ============================================================
// Perform Attack
// ============================================================
export function performAttack(
  state: BattleState,
  attackIndex: 0 | 1
): BattleState {
  let s = state;
  const pid = s.currentTurn;
  const oppId = opposingId(pid);
  const attacker = s[pid].activeCreature;
  const defender = s[oppId].activeCreature;

  if (!attacker || !defender) return s;
  if (s.phase === 'game-over') return s;

  const attack = attacker.card.attacks[attackIndex];

  // Stressed: attack costs 1 more AP
  const stressedCost = hasStatus(attacker, 'Stressed') &&
    !attacker.attachedItems.some((i) => i.effectKey === 'immuneToStressedCost')
    ? 1
    : 0;
  const totalCost = attack.cost + stressedCost;

  if (s[pid].actionPoints < totalCost) {
    return {
      ...s,
      log: [...s.log, makeLog(s.turnNumber, 'Not enough action points!', 'system')],
    };
  }

  // Confused: coin flip
  if (hasStatus(attacker, 'Confused') && !attacker.attachedItems.some((i) => i.effectKey === 'neverMiss')) {
    const flip = coinFlip();
    s = {
      ...s,
      log: [
        ...s.log,
        makeLog(s.turnNumber, `${attacker.card.name} is Confused! Coin flip: ${flip}`, 'status'),
      ],
    };
    if (flip === 'tails') {
      s = {
        ...s,
        [pid]: { ...s[pid], actionPoints: s[pid].actionPoints - totalCost },
        log: [...s.log, makeLog(s.turnNumber, 'Attack failed due to confusion!', 'status')],
      };
      return s;
    }
  }

  let damage = attack.damage;

  // Field: lessDamagePettyAll
  if (s.fieldEffects.some((f) => f.card.effectKey === 'lessDamagePettyAll')) {
    damage = Math.max(0, damage - 10);
  }

  // Petty bonus (attacker)
  if (hasStatus(attacker, 'Petty')) {
    damage += 10;
    s = {
      ...s,
      [pid]: {
        ...s[pid],
        activeCreature: removeStatus(attacker, 'Petty'),
      },
    };
    // Update attacker ref
    attacker.statusEffects = attacker.statusEffects.filter((st) => st !== 'Petty');
  }

  // Item: situational sunglasses (low HP bonus 10)
  if (attacker.attachedItems.some((i) => i.effectKey === 'lowHpDamageBonus10')) {
    if (attacker.currentHp <= attacker.maxHp / 2) damage += 10;
  }

  // Item: flat damage bonus 5 (Cursed Lanyard)
  if (attacker.attachedItems.some((i) => i.effectKey === 'flatDamageBonus5')) {
    damage += 5;
  }

  // Item: first attack bonus 15 (Caffeine Dependency Crown)
  // We track via a simple flag – handled as the first attack of the turn (AP was full at max)
  if (attacker.attachedItems.some((i) => i.effectKey === 'firstAttackBonus15')) {
    if (s[pid].actionPoints === s[pid].maxActionPoints || s[pid].actionPoints + totalCost >= s[pid].maxActionPoints) {
      damage += 15;
    }
  }

  // Grudge counter bonus (Wrath Raccoon passive + Grudge Journal item)
  const grudgeJournalItem = attacker.attachedItems.find((i) => i.effectKey === 'stackingGrudge5');
  if (grudgeJournalItem) {
    damage += (attacker.damageCounters > 0 ? attacker.damageCounters * 5 : 0);
  }

  // Passive: lowHpBonus10 (Anxiety Apparition)
  if (!attacker.isMuted && attacker.card.passive.triggerKey === 'lowHpBonus10') {
    if (attacker.currentHp <= 40) damage += 10;
  }

  // hyperfixation doubleNextAttack
  if (s[pid].activeCreature?.statusEffects.includes('Petty' as StatusEffect)) {
    // handled above
  }

  const { creature: newDefender, actual } = applyDamageToCreature(defender, damage, s.fieldEffects);

  s = {
    ...s,
    [pid]: { ...s[pid], actionPoints: s[pid].actionPoints - totalCost },
    [oppId]: { ...s[oppId], activeCreature: newDefender },
    log: [
      ...s.log,
      makeLog(
        s.turnNumber,
        `${attacker.card.name} used ${attack.name} and dealt ${actual} damage to ${defender.card.name}!`,
        'attack'
      ),
    ],
    lastAttackInfo: { attackerId: pid, damage: actual },
    phase: 'attack',
  };

  // Passive: Corporate Survival (onDamageTaken_draw1)
  if (!newDefender.isMuted && newDefender.card.passive.triggerKey === 'onDamageTaken_draw1' && actual > 0) {
    s = drawCards(s, oppId, 1);
    s = { ...s, log: [...s.log, makeLog(s.turnNumber, `Corporate Survival triggers: ${s[oppId].name} draws 1 card.`, 'status')] };
  }

  // Passive: thorns5 (Subscription Specter)
  if (!newDefender.isMuted && newDefender.card.passive.triggerKey === 'thorns5' && actual > 0) {
    const attackerCreature = s[pid].activeCreature!;
    const { creature: thornedAttacker } = applyDamageToCreature(attackerCreature, 5, s.fieldEffects);
    s = {
      ...s,
      [pid]: { ...s[pid], activeCreature: thornedAttacker },
      log: [...s.log, makeLog(s.turnNumber, `Subscription Specter's Hidden Fee deals 5 damage back!`, 'status')],
    };
    s = checkKO(s, pid);
  }

  // Passive: grudgeCounter5 (Wrath Raccoon)
  if (!newDefender.isMuted && newDefender.card.passive.triggerKey === 'grudgeCounter5' && actual > 0) {
    s = {
      ...s,
      [oppId]: {
        ...s[oppId],
        activeCreature: s[oppId].activeCreature
          ? { ...s[oppId].activeCreature!, damageCounters: (s[oppId].activeCreature!.damageCounters ?? 0) + 1 }
          : s[oppId].activeCreature,
      },
    };
  }

  // Apply attack side effects
  s = applyAttackEffect(s, pid, oppId, attack.effectFn ?? '', actual);

  // Check KO
  s = checkKO(s, oppId);
  if (s.phase !== 'game-over') s = checkKO(s, pid);

  return s;
}

// ============================================================
// Attack side effect dispatcher
// ============================================================
function applyAttackEffect(
  state: BattleState,
  pid: 'player1' | 'player2',
  oppId: 'player1' | 'player2',
  effectKey: string,
  damage: number
): BattleState {
  let s = state;

  const updateOpponentActive = (fn: (c: ActiveCreature) => ActiveCreature): BattleState => {
    if (!s[oppId].activeCreature) return s;
    return { ...s, [oppId]: { ...s[oppId], activeCreature: fn(s[oppId].activeCreature!) } };
  };

  switch (effectKey) {
    case 'lowerNextAttack10':
      s = { ...s, log: [...s.log, makeLog(s.turnNumber, 'Enemy next attack lowered by 10!', 'status')] };
      break;
    case 'skipEnemyDraw':
      s = updateOpponentActive((c) => addStatus(c, 'Stressed'));
      s = { ...s, log: [...s.log, makeLog(s.turnNumber, 'Enemy will skip their next draw!', 'status')] };
      break;
    case 'applyConfused':
      s = updateOpponentActive((c) => addStatus(c, 'Confused'));
      s = { ...s, log: [...s.log, makeLog(s.turnNumber, 'Enemy is now Confused!', 'status')] };
      break;
    case 'applyStressed':
      s = updateOpponentActive((c) => addStatus(c, 'Stressed'));
      s = { ...s, log: [...s.log, makeLog(s.turnNumber, 'Enemy is now Stressed!', 'status')] };
      break;
    case 'applyStressedDraw1':
      s = updateOpponentActive((c) => addStatus(c, 'Stressed'));
      s = drawCards(s, pid, 1);
      s = { ...s, log: [...s.log, makeLog(s.turnNumber, 'Enemy is Stressed! You draw 1 card.', 'status')] };
      break;
    case 'applyMuted':
      s = updateOpponentActive((c) => ({ ...c, isMuted: true }));
      s = { ...s, log: [...s.log, makeLog(s.turnNumber, 'Enemy passive is Muted!', 'status')] };
      break;
    case 'applyBurnout':
      s = updateOpponentActive((c) => addStatus(c, 'Burnout'));
      s = { ...s, log: [...s.log, makeLog(s.turnNumber, 'Enemy is now in Burnout!', 'status')] };
      break;
    case 'applyStressedConfused':
      s = updateOpponentActive((c) => addStatus(addStatus(c, 'Stressed'), 'Confused'));
      s = { ...s, log: [...s.log, makeLog(s.turnNumber, 'Enemy is Stressed and Confused!', 'status')] };
      break;
    case 'tripleStatus':
      s = updateOpponentActive((c) => addStatus(addStatus(addStatus(c, 'Stressed'), 'Confused'), 'Muted'));
      s = { ...s, log: [...s.log, makeLog(s.turnNumber, 'Enemy is Stressed, Confused, and Muted!', 'status')] };
      break;
    case 'tripleNegStatus':
      s = updateOpponentActive((c) => addStatus(addStatus(addStatus(c, 'Stressed'), 'Burnout'), 'Confused'));
      s = { ...s, log: [...s.log, makeLog(s.turnNumber, 'Enemy is Stressed, Burnout, and Confused!', 'status')] };
      break;
    case 'opponentDiscardRandom':
      if (s[oppId].hand.length > 0) {
        const idx = Math.floor(Math.random() * s[oppId].hand.length);
        const discarded = s[oppId].hand[idx];
        s = {
          ...s,
          [oppId]: {
            ...s[oppId],
            hand: s[oppId].hand.filter((_, i) => i !== idx),
            discardPile: [...s[oppId].discardPile, discarded],
          },
          log: [...s.log, makeLog(s.turnNumber, `${s[oppId].name} discards ${discarded.name}!`, 'card')],
        };
      }
      break;
    case 'selfHeal20':
      if (s[pid].activeCreature) {
        const c = s[pid].activeCreature!;
        const healed = Math.min(c.maxHp, c.currentHp + 20);
        s = {
          ...s,
          [pid]: { ...s[pid], activeCreature: { ...c, currentHp: healed } },
          log: [...s.log, makeLog(s.turnNumber, `${c.card.name} heals 20 HP!`, 'status')],
        };
      }
      break;
    case 'selfHeal15':
      if (s[pid].activeCreature) {
        const c = s[pid].activeCreature!;
        s = { ...s, [pid]: { ...s[pid], activeCreature: { ...c, currentHp: Math.min(c.maxHp, c.currentHp + 15) } } };
      }
      break;
    case 'coinFlipSelfDamage20': {
      const flip = coinFlip();
      s = { ...s, log: [...s.log, makeLog(s.turnNumber, `Impulse Purchase coin flip: ${flip}`, 'status')] };
      if (flip === 'tails' && s[pid].activeCreature) {
        const c = s[pid].activeCreature!;
        const { creature } = applyDamageToCreature(c, 20, s.fieldEffects);
        s = {
          ...s,
          [pid]: { ...s[pid], activeCreature: creature },
          log: [...s.log, makeLog(s.turnNumber, `${c.card.name} takes 20 self damage from Impulse Purchase!`, 'status')],
        };
        s = checkKO(s, pid);
      }
      break;
    }
    case 'drawDigitalBonus':
      s = drawCards(s, pid, 1);
      // Bonus draw if card is Digital (simplified: 50% chance)
      if (Math.random() < 0.5) s = drawCards(s, pid, 1);
      break;
    case 'skipEnemyTurn':
      s = updateOpponentActive((c) => addStatus(c, 'Stunned'));
      s = { ...s, log: [...s.log, makeLog(s.turnNumber, 'Enemy is Stunned and loses next turn!', 'status')] };
      break;
    case 'blockEnemyDraw1Turn':
      s = updateOpponentActive((c) => addStatus(c, 'Muted'));
      s = { ...s, log: [...s.log, makeLog(s.turnNumber, 'Enemy cannot draw next turn!', 'status')] };
      break;
    case 'drain15':
      if (s[pid].activeCreature) {
        const c = s[pid].activeCreature!;
        s = { ...s, [pid]: { ...s[pid], activeCreature: { ...c, currentHp: Math.min(c.maxHp, c.currentHp + 15) } } };
      }
      break;
    case 'onHit_draw2':
      s = drawCards(s, pid, 2);
      break;
    case 'gainAP1':
      s = { ...s, [pid]: { ...s[pid], actionPoints: s[pid].actionPoints + 1 } };
      break;
    case 'benchBonus10':
      // already applied in damage calc or just note it
      break;
    case 'damagePerCounter10': {
      const counters = s[pid].activeCreature?.damageCounters ?? 0;
      const bonus = counters * 10;
      if (bonus > 0 && s[oppId].activeCreature) {
        const { creature: d2 } = applyDamageToCreature(s[oppId].activeCreature!, bonus, s.fieldEffects);
        s = {
          ...s,
          [oppId]: { ...s[oppId], activeCreature: d2 },
          log: [...s.log, makeLog(s.turnNumber, `One More Glass deals ${bonus} bonus damage from counters!`, 'attack')],
        };
        s = checkKO(s, oppId);
      }
      break;
    }
    case 'bonusDamage3Counters': {
      const self = s[pid].activeCreature;
      if (self && self.damageCounters >= 3 && s[oppId].activeCreature) {
        const { creature: d2 } = applyDamageToCreature(s[oppId].activeCreature!, 20, s.fieldEffects);
        s = {
          ...s,
          [oppId]: { ...s[oppId], activeCreature: d2 },
          log: [...s.log, makeLog(s.turnNumber, 'Dumpster Strategy deals 20 extra damage!', 'attack')],
        };
        s = checkKO(s, oppId);
      }
      break;
    }
    case 'applySelfPetty':
      if (s[pid].activeCreature) {
        s = { ...s, [pid]: { ...s[pid], activeCreature: addStatus(s[pid].activeCreature!, 'Petty') } };
      }
      break;
    case 'applyMutedPetty':
      s = updateOpponentActive((c) => addStatus({ ...c, isMuted: true }, 'Petty'));
      break;
    default:
      break;
  }

  return s;
}

// ============================================================
// Play Action Card
// ============================================================
export function playActionCard(
  state: BattleState,
  cardId: string
): BattleState {
  let s = state;
  const pid = s.currentTurn;
  const oppId = opposingId(pid);
  const cardIdx = s[pid].hand.findIndex((c) => c.id === cardId);
  if (cardIdx === -1) return s;
  const card = s[pid].hand[cardIdx] as ActionCard;

  if (s[pid].actionPoints < card.cost) {
    return { ...s, log: [...s.log, makeLog(s.turnNumber, 'Not enough action points!', 'system')] };
  }

  // Remove from hand, pay cost
  const newHand = s[pid].hand.filter((_, i) => i !== cardIdx);
  s = {
    ...s,
    [pid]: {
      ...s[pid],
      hand: newHand,
      actionPoints: s[pid].actionPoints - card.cost,
      discardPile: [...s[pid].discardPile, card],
    },
    log: [...s.log, makeLog(s.turnNumber, `${s[pid].name} played ${card.name}.`, 'card')],
  };

  s = applyActionEffect(s, pid, oppId, card);

  // Passive: Bad Idea Magnet (Wine Goblin) — heal 10 on Chaos card
  if (card.elementType === 'Chaos' && s[pid].activeCreature?.card.passive.triggerKey === 'onChaosCardPlayed_heal10') {
    const c = s[pid].activeCreature!;
    s = {
      ...s,
      [pid]: { ...s[pid], activeCreature: { ...c, currentHp: Math.min(c.maxHp, c.currentHp + 10) } },
      log: [...s.log, makeLog(s.turnNumber, 'Bad Idea Magnet heals 10 HP!', 'status')],
    };
  }

  // Passive: Sale Shame (Coupon Demon) — on item card played deal 10 to enemy
  if ((card as { cardType: string }).cardType === 'item' && s[pid].activeCreature?.card.passive.triggerKey === 'onItemPlayed_deal10') {
    if (s[oppId].activeCreature) {
      const { creature } = applyDamageToCreature(s[oppId].activeCreature!, 10, s.fieldEffects);
      s = {
        ...s,
        [oppId]: { ...s[oppId], activeCreature: creature },
        log: [...s.log, makeLog(s.turnNumber, 'Sale Shame deals 10 damage to enemy!', 'status')],
      };
      s = checkKO(s, oppId);
    }
  }

  return s;
}

function applyActionEffect(
  state: BattleState,
  pid: 'player1' | 'player2',
  oppId: 'player1' | 'player2',
  card: ActionCard
): BattleState {
  let s = state;

  const healActive = (playerId: 'player1' | 'player2', amount: number): BattleState => {
    if (!s[playerId].activeCreature) return s;
    const c = s[playerId].activeCreature!;
    const mult = s.fieldEffects.some((f) => f.card.effectKey === 'doubleHealAll') ? 2 : 1;
    // Budget Warlock doubleHeal item
    const itemMult = c.attachedItems.some((i) => i.effectKey === 'doubleHeal') ? 2 : 1;
    const healed = Math.min(c.maxHp, c.currentHp + amount * mult * itemMult);
    return {
      ...s,
      [playerId]: {
        ...s[playerId],
        activeCreature: { ...c, currentHp: healed },
      },
      log: [...s.log, makeLog(s.turnNumber, `${c.card.name} heals ${amount * mult * itemMult} HP!`, 'status')],
    };
  };

  const dealToEnemy = (amount: number): BattleState => {
    if (!s[oppId].activeCreature) return s;
    const { creature, actual } = applyDamageToCreature(s[oppId].activeCreature!, amount, s.fieldEffects);
    return {
      ...s,
      [oppId]: { ...s[oppId], activeCreature: creature },
      log: [...s.log, makeLog(s.turnNumber, `${card.name} deals ${actual} damage!`, 'attack')],
    };
  };

  switch (card.effectKey) {
    case 'bounceToTopDeck':
      if (s[oppId].activeCreature) {
        const bounced = s[oppId].activeCreature!;
        s = {
          ...s,
          [oppId]: {
            ...s[oppId],
            activeCreature: null,
            deck: [bounced.card, ...s[oppId].deck],
          },
          log: [...s.log, makeLog(s.turnNumber, `${bounced.card.name} was sent back to the top of ${s[oppId].name}'s deck!`, 'card')],
        };
        // auto promote bench
        if (s[oppId].bench.length > 0) {
          const [next, ...rest] = s[oppId].bench;
          s = { ...s, [oppId]: { ...s[oppId], activeCreature: next, bench: rest } };
        }
      }
      break;
    case 'pettyDamage': {
      const base = 20 + (s[oppId].activeCreature ? 10 : 0);
      s = dealToEnemy(base);
      s = checkKO(s, oppId);
      break;
    }
    case 'emergencyRecovery':
      if (s[pid].discardPile.length >= 2) {
        const two = s[pid].discardPile.slice(0, 2);
        s = {
          ...s,
          [pid]: {
            ...s[pid],
            hand: [...s[pid].hand, ...two],
            discardPile: s[pid].discardPile.slice(2),
          },
          log: [...s.log, makeLog(s.turnNumber, `${s[pid].name} recovered 2 cards from discard.`, 'card')],
        };
      } else if (s[pid].discardPile.length === 1) {
        const one = s[pid].discardPile[0];
        s = {
          ...s,
          [pid]: { ...s[pid], hand: [...s[pid].hand, one], discardPile: [] },
        };
      }
      s = drawCards(s, pid, 1);
      s = drawCards(s, oppId, 1);
      break;
    case 'retailHeal': {
      const consumerCount = s[pid].hand.filter((c) => c.elementType === 'Consumer').length;
      s = healActive(pid, 25);
      for (let i = 0; i < consumerCount; i++) s = drawCards(s, pid, 1);
      break;
    }
    case 'energyDrink':
      s = { ...s, [pid]: { ...s[pid], actionPoints: s[pid].actionPoints + 2 } };
      s = drawCards(s, pid, 1);
      s = {
        ...s,
        pendingBurnout: [...s.pendingBurnout, { playerId: pid, damage: 10 }],
        log: [...s.log, makeLog(s.turnNumber, 'Side Hustle Energy Drink: +2 AP, draw 1. 10 Burnout next turn!', 'card')],
      };
      break;
    case 'shield20':
      // Track as a pending shield — simplified: heal 20 for now
      s = healActive(pid, 20);
      break;
    case 'clearAllStatus':
      if (s[pid].activeCreature) {
        s = { ...s, [pid]: { ...s[pid], activeCreature: clearAllStatuses(s[pid].activeCreature!) } };
        s = { ...s, log: [...s.log, makeLog(s.turnNumber, 'All status effects cleared!', 'status')] };
      }
      break;
    case 'millEnemy3': {
      const milled = s[oppId].deck.slice(0, 3);
      s = {
        ...s,
        [oppId]: {
          ...s[oppId],
          deck: s[oppId].deck.slice(3),
          discardPile: [...s[oppId].discardPile, ...milled],
        },
        log: [...s.log, makeLog(s.turnNumber, `${s[oppId].name} discards top 3 cards!`, 'card')],
      };
      break;
    }
    case 'applyConfused':
      if (s[oppId].activeCreature) {
        s = { ...s, [oppId]: { ...s[oppId], activeCreature: addStatus(s[oppId].activeCreature!, 'Confused') } };
      }
      break;
    case 'lookAndDiscard':
      if (s[oppId].hand.length > 0) {
        // In bot mode / single screen — auto discard random card
        const idx = Math.floor(Math.random() * s[oppId].hand.length);
        const discarded = s[oppId].hand[idx];
        s = {
          ...s,
          [oppId]: {
            ...s[oppId],
            hand: s[oppId].hand.filter((_, i) => i !== idx),
            discardPile: [...s[oppId].discardPile, discarded],
          },
          log: [...s.log, makeLog(s.turnNumber, `Performance Review forces ${s[oppId].name} to discard ${discarded.name}!`, 'card')],
        };
      }
      break;
    case 'applyMutedPetty':
      if (s[oppId].activeCreature) {
        s = {
          ...s,
          [oppId]: {
            ...s[oppId],
            activeCreature: addStatus({ ...s[oppId].activeCreature!, isMuted: true }, 'Petty'),
          },
        };
      }
      break;
    case 'draw2':
      s = drawCards(s, pid, 2);
      break;
    case 'heal30':
      s = healActive(pid, 30);
      break;
    case 'applyStressedConfused':
      if (s[oppId].activeCreature) {
        s = {
          ...s,
          [oppId]: {
            ...s[oppId],
            activeCreature: addStatus(addStatus(s[oppId].activeCreature!, 'Stressed'), 'Confused'),
          },
        };
      }
      break;
    case 'deal15Petty':
      s = dealToEnemy(15);
      if (s[oppId].activeCreature) {
        s = { ...s, [oppId]: { ...s[oppId], activeCreature: addStatus(s[oppId].activeCreature!, 'Petty') } };
      }
      s = checkKO(s, oppId);
      break;
    case 'draw3ClearStatus':
      s = drawCards(s, pid, 3);
      if (s[pid].activeCreature) {
        s = { ...s, [pid]: { ...s[pid], activeCreature: clearAllStatuses(s[pid].activeCreature!) } };
      }
      break;
    case 'deal30AllBench':
      s = { ...s, [oppId]: { ...s[oppId], bench: s[oppId].bench.map((bc) => {
        const { creature } = applyDamageToCreature(bc, 30, s.fieldEffects);
        return creature;
      }) } };
      s = { ...s, log: [...s.log, makeLog(s.turnNumber, 'Screaming Into The Void hits all enemy bench for 30!', 'attack')] };
      break;
    case 'draw4Discard2': {
      s = drawCards(s, pid, 4);
      // Discard 2 random from hand
      let hand = [...s[pid].hand];
      const disc2: AnyCard[] = [];
      for (let i = 0; i < 2 && hand.length > 0; i++) {
        const ri = Math.floor(Math.random() * hand.length);
        disc2.push(hand[ri]);
        hand = hand.filter((_, idx2) => idx2 !== ri);
      }
      s = {
        ...s,
        [pid]: { ...s[pid], hand, discardPile: [...s[pid].discardPile, ...disc2] },
        log: [...s.log, makeLog(s.turnNumber, `${s[pid].name} discards 2 cards.`, 'card')],
      };
      break;
    }
    case 'heal20Shield10':
      s = healActive(pid, 20);
      break;
    case 'gainMaxHP20':
      if (s[pid].activeCreature) {
        const c = s[pid].activeCreature!;
        s = {
          ...s,
          [pid]: {
            ...s[pid],
            activeCreature: { ...c, maxHp: c.maxHp + 20, currentHp: Math.min(c.maxHp + 20, c.currentHp + 20) },
          },
        };
      }
      break;
    case 'coinBoldStrike': {
      const flip = coinFlip();
      s = { ...s, log: [...s.log, makeLog(s.turnNumber, `Bold Strategy coin flip: ${flip}`, 'status')] };
      if (flip === 'heads') {
        s = dealToEnemy(60);
        s = checkKO(s, oppId);
      } else {
        s = healActive(pid, -30); // take 30 damage — treat as negative heal
        if (s[pid].activeCreature) {
          const c = s[pid].activeCreature!;
          const { creature } = applyDamageToCreature(c, 30, s.fieldEffects);
          s = { ...s, [pid]: { ...s[pid], activeCreature: creature } };
          s = checkKO(s, pid);
        }
      }
      break;
    }
    case 'applyMuted2Turns':
      if (s[oppId].activeCreature) {
        s = { ...s, [oppId]: { ...s[oppId], activeCreature: { ...s[oppId].activeCreature!, isMuted: true } } };
      }
      break;
    case 'selfPettyDraw1':
      if (s[pid].activeCreature) {
        s = { ...s, [pid]: { ...s[pid], activeCreature: addStatus(s[pid].activeCreature!, 'Petty') } };
      }
      s = drawCards(s, pid, 1);
      break;
    case 'skipEnemyTurn':
      if (s[oppId].activeCreature) {
        s = { ...s, [oppId]: { ...s[oppId], activeCreature: addStatus(s[oppId].activeCreature!, 'Stunned') } };
        s = { ...s, log: [...s.log, makeLog(s.turnNumber, `${s[oppId].name} is Stunned!`, 'status')] };
      }
      break;
    case 'viralStrike': {
      let dmg = 40;
      if (s[oppId].activeCreature && s[oppId].activeCreature!.statusEffects.includes('Stressed')) dmg += 20;
      s = dealToEnemy(dmg);
      s = drawCards(s, pid, 2);
      s = checkKO(s, oppId);
      break;
    }
    case 'discardGainAP':
      if (s[oppId].hand.length > 0) {
        const ri = Math.floor(Math.random() * s[oppId].hand.length);
        const d = s[oppId].hand[ri];
        s = {
          ...s,
          [oppId]: { ...s[oppId], hand: s[oppId].hand.filter((_, i) => i !== ri), discardPile: [...s[oppId].discardPile, d] },
        };
      }
      s = { ...s, [pid]: { ...s[pid], actionPoints: s[pid].actionPoints + 1 } };
      break;
    case 'applyBurnout':
      if (s[oppId].activeCreature) {
        s = { ...s, [oppId]: { ...s[oppId], activeCreature: addStatus(s[oppId].activeCreature!, 'Burnout') } };
      }
      break;
    case 'deal50Stressed':
      s = dealToEnemy(50);
      if (s[oppId].activeCreature) {
        s = { ...s, [oppId]: { ...s[oppId], activeCreature: addStatus(s[oppId].activeCreature!, 'Stressed') } };
      }
      s = checkKO(s, oppId);
      break;
    case 'fullHeal':
      if (s[pid].activeCreature) {
        const c = s[pid].activeCreature!;
        s = { ...s, [pid]: { ...s[pid], activeCreature: { ...c, currentHp: c.maxHp } } };
        s = { ...s, log: [...s.log, makeLog(s.turnNumber, `${c.card.name} fully healed!`, 'status')] };
      }
      break;
    case 'randomDamage20to50': {
      const dmg = Math.floor(Math.random() * 31) + 20;
      s = dealToEnemy(dmg);
      s = checkKO(s, oppId);
      break;
    }
    case 'freeBench': {
      const firstCreatureIdx = s[pid].hand.findIndex((c) => c.cardType === 'creature');
      if (firstCreatureIdx !== -1 && s[pid].bench.length < 3) {
        const cc = s[pid].hand[firstCreatureIdx] as CreatureCard;
        const newHand = s[pid].hand.filter((_, i) => i !== firstCreatureIdx);
        s = {
          ...s,
          [pid]: {
            ...s[pid],
            hand: newHand,
            bench: [...s[pid].bench, makeActiveCreature(cc)],
          },
          log: [...s.log, makeLog(s.turnNumber, `${cc.name} placed on bench for free!`, 'card')],
        };
      }
      break;
    }
    case 'draw3SelfStressed':
      s = drawCards(s, pid, 3);
      if (s[pid].activeCreature) {
        s = { ...s, [pid]: { ...s[pid], activeCreature: addStatus(s[pid].activeCreature!, 'Stressed') } };
      }
      break;
    case 'eliminateBenchCreature':
      if (s[oppId].bench.length > 0) {
        const [eliminated, ...rest] = s[oppId].bench;
        s = {
          ...s,
          [oppId]: {
            ...s[oppId],
            bench: rest,
            discardPile: [...s[oppId].discardPile, eliminated.card],
          },
          log: [...s.log, makeLog(s.turnNumber, `${eliminated.card.name} was cancelled off the bench!`, 'ko')],
        };
      }
      break;
    case 'freeSwap':
      if (s[pid].bench.length > 0 && s[pid].activeCreature) {
        const [next, ...rest] = s[pid].bench;
        const prev = s[pid].activeCreature!;
        s = {
          ...s,
          [pid]: { ...s[pid], activeCreature: next, bench: [...rest, prev] },
          log: [...s.log, makeLog(s.turnNumber, `Swapped to ${next.card.name}!`, 'card')],
        };
      }
      break;
    case 'freeItemPlay': {
      const itemIdx = s[pid].hand.findIndex((c) => c.cardType === 'item');
      if (itemIdx !== -1 && s[pid].activeCreature) {
        const item = s[pid].hand[itemIdx] as ItemCard;
        const newHand = s[pid].hand.filter((_, i) => i !== itemIdx);
        s = {
          ...s,
          [pid]: {
            ...s[pid],
            hand: newHand,
            activeCreature: {
              ...s[pid].activeCreature!,
              attachedItems: [...s[pid].activeCreature!.attachedItems, item],
            },
          },
          log: [...s.log, makeLog(s.turnNumber, `${item.name} attached for free!`, 'card')],
        };
      }
      break;
    }
    case 'doubleNextAttack':
      // Tracked via Petty status as a proxy for double damage bonus
      if (s[pid].activeCreature) {
        s = { ...s, [pid]: { ...s[pid], activeCreature: addStatus(s[pid].activeCreature!, 'Petty') } };
        s = { ...s, log: [...s.log, makeLog(s.turnNumber, 'Hyperfixation Mode: next attack bonus!', 'status')] };
      }
      break;
    case 'clearStatusHeal10':
      if (s[pid].activeCreature) {
        const c = clearAllStatuses(s[pid].activeCreature!);
        s = { ...s, [pid]: { ...s[pid], activeCreature: { ...c, currentHp: Math.min(c.maxHp, c.currentHp + 10) } } };
      }
      break;
    case 'deal35Muted':
      s = dealToEnemy(35);
      if (s[oppId].activeCreature) {
        s = { ...s, [oppId]: { ...s[oppId], activeCreature: { ...s[oppId].activeCreature!, isMuted: true } } };
      }
      s = checkKO(s, oppId);
      break;
    case 'applyBurnoutStressed':
      if (s[oppId].activeCreature) {
        s = {
          ...s,
          [oppId]: { ...s[oppId], activeCreature: addStatus(addStatus(s[oppId].activeCreature!, 'Burnout'), 'Stressed') },
        };
      }
      break;
    case 'peekAndDamageHand': {
      const handSize = s[oppId].hand.length;
      s = dealToEnemy(handSize * 10);
      s = { ...s, log: [...s.log, makeLog(s.turnNumber, `No Context Screenshot deals ${handSize * 10} damage!`, 'attack')] };
      s = checkKO(s, oppId);
      break;
    }
    case 'stressAll':
      if (s[pid].activeCreature) s = { ...s, [pid]: { ...s[pid], activeCreature: addStatus(s[pid].activeCreature!, 'Stressed') } };
      if (s[oppId].activeCreature) s = { ...s, [oppId]: { ...s[oppId], activeCreature: addStatus(s[oppId].activeCreature!, 'Stressed') } };
      break;
    case 'deal10x3':
      for (let i = 0; i < 3; i++) {
        s = dealToEnemy(10);
        s = checkKO(s, oppId);
        if (!s[oppId].activeCreature) break;
      }
      break;
    case 'draw2SelfDamage15':
      s = drawCards(s, pid, 2);
      if (s[pid].activeCreature) {
        const c = s[pid].activeCreature!;
        const { creature } = applyDamageToCreature(c, 15, s.fieldEffects);
        s = { ...s, [pid]: { ...s[pid], activeCreature: creature } };
        s = checkKO(s, pid);
      }
      break;
    case 'randomStatusAttack': {
      const statuses: StatusEffect[] = ['Stressed', 'Confused', 'Burnout', 'Muted', 'Petty'];
      const picked = statuses[Math.floor(Math.random() * statuses.length)];
      s = dealToEnemy(20);
      if (s[oppId].activeCreature) {
        s = { ...s, [oppId]: { ...s[oppId], activeCreature: addStatus(s[oppId].activeCreature!, picked) } };
      }
      s = checkKO(s, oppId);
      break;
    }
    case 'stealItem': {
      const enemyItems = s[oppId].activeCreature?.attachedItems ?? [];
      if (enemyItems.length > 0 && s[pid].activeCreature) {
        const stolen = enemyItems[0];
        s = {
          ...s,
          [oppId]: {
            ...s[oppId],
            activeCreature: { ...s[oppId].activeCreature!, attachedItems: enemyItems.slice(1) },
          },
          [pid]: {
            ...s[pid],
            activeCreature: {
              ...s[pid].activeCreature!,
              attachedItems: [...s[pid].activeCreature!.attachedItems, stolen],
            },
          },
          log: [...s.log, makeLog(s.turnNumber, `Clout Transfer steals ${stolen.name}!`, 'card')],
        };
      }
      break;
    }
    default:
      break;
  }

  return s;
}

// ============================================================
// Play Item Card (attach to active creature)
// ============================================================
export function playItemCard(
  state: BattleState,
  cardId: string
): BattleState {
  let s = state;
  const pid = s.currentTurn;
  const cardIdx = s[pid].hand.findIndex((c) => c.id === cardId);
  if (cardIdx === -1) return s;
  const card = s[pid].hand[cardIdx] as ItemCard;

  if (s[pid].actionPoints < card.cost) {
    return { ...s, log: [...s.log, makeLog(s.turnNumber, 'Not enough action points!', 'system')] };
  }
  if (!s[pid].activeCreature) {
    return { ...s, log: [...s.log, makeLog(s.turnNumber, 'No active creature to attach item to!', 'system')] };
  }

  const newHand = s[pid].hand.filter((_, i) => i !== cardIdx);
  const activeCreature = {
    ...s[pid].activeCreature!,
    attachedItems: [...s[pid].activeCreature!.attachedItems, card],
  };

  // Special: Validation Sticker Sheet +20 HP
  let updatedCreature = activeCreature;
  if (card.effectKey === 'bonusHP20_drawOnKO') {
    updatedCreature = { ...updatedCreature, maxHp: updatedCreature.maxHp + 20, currentHp: updatedCreature.currentHp + 20 };
  }

  s = {
    ...s,
    [pid]: {
      ...s[pid],
      hand: newHand,
      actionPoints: s[pid].actionPoints - card.cost,
      activeCreature: updatedCreature,
    },
    log: [...s.log, makeLog(s.turnNumber, `${card.name} attached to ${updatedCreature.card.name}.`, 'card')],
  };

  // Passive: Sale Shame (Coupon Demon)
  const oppId = opposingId(pid);
  if (s[pid].activeCreature?.card.passive.triggerKey === 'onItemPlayed_deal10') {
    if (s[oppId].activeCreature) {
      const { creature } = applyDamageToCreature(s[oppId].activeCreature!, 10, s.fieldEffects);
      s = {
        ...s,
        [oppId]: { ...s[oppId], activeCreature: creature },
        log: [...s.log, makeLog(s.turnNumber, 'Sale Shame deals 10 damage to enemy!', 'status')],
      };
      s = checkKO(s, oppId);
    }
  }

  return s;
}

// ============================================================
// Play Creature to Bench
// ============================================================
export function playCreatureToBench(
  state: BattleState,
  cardId: string
): BattleState {
  let s = state;
  const pid = s.currentTurn;
  const cardIdx = s[pid].hand.findIndex((c) => c.id === cardId);
  if (cardIdx === -1) return s;
  if (s[pid].bench.length >= 3) {
    return { ...s, log: [...s.log, makeLog(s.turnNumber, 'Bench is full!', 'system')] };
  }
  const card = s[pid].hand[cardIdx] as CreatureCard;
  const newHand = s[pid].hand.filter((_, i) => i !== cardIdx);

  s = {
    ...s,
    [pid]: {
      ...s[pid],
      hand: newHand,
      bench: [...s[pid].bench, makeActiveCreature(card)],
    },
    log: [...s.log, makeLog(s.turnNumber, `${card.name} placed on bench.`, 'card')],
  };

  // Passive: Too Much Information (Overshare Oracle) — peek on play
  if (!s[pid].activeCreature?.isMuted && card.passive.triggerKey === 'onPlay_peekEnemyHand') {
    s = { ...s, log: [...s.log, makeLog(s.turnNumber, 'Too Much Information: you peeked at the enemy hand!', 'status')] };
  }

  return s;
}

// ============================================================
// Swap active with bench creature
// ============================================================
export function swapActive(
  state: BattleState,
  benchIndex: number
): BattleState {
  let s = state;
  const pid = s.currentTurn;
  if (!s[pid].activeCreature || s[pid].bench.length <= benchIndex) return s;

  const prev = s[pid].activeCreature!;
  const next = s[pid].bench[benchIndex];
  const newBench = s[pid].bench.filter((_, i) => i !== benchIndex);

  s = {
    ...s,
    [pid]: {
      ...s[pid],
      activeCreature: next,
      bench: [...newBench, prev],
    },
    log: [...s.log, makeLog(s.turnNumber, `${s[pid].name} swapped to ${next.card.name}.`, 'card')],
  };
  return s;
}

// ============================================================
// Promote bench to active (when active is null)
// ============================================================
export function promoteBenchToActive(
  state: BattleState,
  playerId: 'player1' | 'player2',
  benchIndex: number
): BattleState {
  let s = state;
  if (s[playerId].activeCreature) return s;
  if (s[playerId].bench.length <= benchIndex) return s;

  const next = s[playerId].bench[benchIndex];
  const newBench = s[playerId].bench.filter((_, i) => i !== benchIndex);

  return {
    ...s,
    [playerId]: {
      ...s[playerId],
      activeCreature: next,
      bench: newBench,
    },
    log: [...s.log, makeLog(s.turnNumber, `${s[playerId].name} sends out ${next.card.name}!`, 'system')],
  };
}

// ============================================================
// End Turn
// ============================================================
export function endTurn(state: BattleState): BattleState {
  if (state.phase === 'game-over') return state;
  let s = state;
  const pid = s.currentTurn;
  const nextPid = opposingId(pid);

  // Apply pending burnout
  s = {
    ...s,
    pendingBurnout: s.pendingBurnout.filter((pb) => pb.playerId !== pid),
  };

  // Tick field effects
  const updatedFields = s.fieldEffects
    .map((f) => ({ ...f, turnsRemaining: f.turnsRemaining - 1 }))
    .filter((f) => f.turnsRemaining > 0);

  s = {
    ...s,
    currentTurn: nextPid,
    turnNumber: s.turnNumber + 1,
    fieldEffects: updatedFields,
    phase: 'main',
  };

  s = startTurn(s);
  return s;
}

// ============================================================
// Play a card (dispatcher)
// ============================================================
export function playCard(state: BattleState, cardId: string): BattleState {
  const pid = state.currentTurn;
  const card = state[pid].hand.find((c) => c.id === cardId);
  if (!card) return state;
  switch (card.cardType) {
    case 'action':
      return playActionCard(state, cardId);
    case 'item':
      return playItemCard(state, cardId);
    case 'creature':
      return playCreatureToBench(state, cardId);
    case 'field':
      return playFieldCard(state, cardId);
    default:
      return state;
  }
}

// ============================================================
// Play Field Card
// ============================================================
export function playFieldCard(state: BattleState, cardId: string): BattleState {
  let s = state;
  const pid = s.currentTurn;
  const cardIdx = s[pid].hand.findIndex((c) => c.id === cardId);
  if (cardIdx === -1) return s;
  const card = s[pid].hand[cardIdx];
  if (card.cardType !== 'field') return s;

  if (s[pid].actionPoints < card.cost) {
    return { ...s, log: [...s.log, makeLog(s.turnNumber, 'Not enough action points!', 'system')] };
  }

  const newHand = s[pid].hand.filter((_, i) => i !== cardIdx);
  const fieldEffect: FieldEffect = { card, turnsRemaining: card.duration, playedBy: pid };

  return {
    ...s,
    [pid]: {
      ...s[pid],
      hand: newHand,
      actionPoints: s[pid].actionPoints - card.cost,
      discardPile: [...s[pid].discardPile, card],
    },
    fieldEffects: [...s.fieldEffects, fieldEffect],
    log: [...s.log, makeLog(s.turnNumber, `${card.name} field effect activated!`, 'card')],
  };
}
