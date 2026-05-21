// ============================================================
// FILTHY MINDED BATTLE DECK — Type Definitions
// ============================================================

export type CardType = 'creature' | 'action' | 'item' | 'reaction' | 'field';

export type AIDifficulty = 'easy' | 'normal' | 'hard';

export type ElementType = 'Chaos' | 'Office' | 'Digital' | 'Consumer' | 'Mind' | 'Neutral';

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Legendary';

export type StatusEffect = 'Stressed' | 'Confused' | 'Burnout' | 'Muted' | 'Petty' | 'Stunned';

export interface Attack {
  name: string;
  cost: number; // action points
  damage: number;
  effect?: string; // description of side effect
  effectFn?: string; // key referencing battle engine handler
}

export interface CardBase {
  id: string;
  name: string;
  cardType: CardType;
  elementType: ElementType;
  rarity: Rarity;
  artPath: string; // e.g. assets/cards/passive-aggressaurus.png
  flavorText: string;
  cardNumber: number;
}

export interface CreatureCard extends CardBase {
  cardType: 'creature';
  hp: number;
  attacks: [Attack, Attack];
  passive: {
    name: string;
    description: string;
    triggerKey: string; // key referencing battle engine passive handler
  };
}

export interface ActionCard extends CardBase {
  cardType: 'action';
  cost: number;
  effectDescription: string;
  effectKey: string;
}

export interface ItemCard extends CardBase {
  cardType: 'item';
  cost: number;
  effectDescription: string;
  effectKey: string;
  armor?: number;
}

export interface ReactionCard extends CardBase {
  cardType: 'reaction';
  cost: number;
  triggerCondition: string;
  effectDescription: string;
  effectKey: string;
}

export interface FieldCard extends CardBase {
  cardType: 'field';
  cost: number;
  effectDescription: string;
  effectKey: string;
  duration: number; // turns
}

export type AnyCard = CreatureCard | ActionCard | ItemCard | ReactionCard | FieldCard;

// ============================================================
// Battle State
// ============================================================

export interface ActiveCreature {
  card: CreatureCard;
  currentHp: number;
  maxHp: number;
  statusEffects: StatusEffect[];
  attachedItems: ItemCard[];
  damageCounters: number;
  isMuted: boolean;
}

export type GameScreen =
  | 'main-menu'
  | 'quick-play'
  | 'deck-selection'
  | 'battle'
  | 'deck-builder'
  | 'card-collection'
  | 'rules'
  | 'settings'
  | 'victory'
  | 'story-map'
  | 'story-reward';

export interface PlayerState {
  id: 'player1' | 'player2';
  name: string;
  deck: AnyCard[];
  hand: AnyCard[];
  discardPile: AnyCard[];
  activeCreature: ActiveCreature | null;
  bench: ActiveCreature[]; // max 3
  actionPoints: number;
  maxActionPoints: number;
  knockedOutCount: number; // how many of their creatures were knocked out
  knockoutsScored: number; // how many enemy creatures this player knocked out
}

export interface FieldEffect {
  card: FieldCard;
  turnsRemaining: number;
  playedBy: 'player1' | 'player2';
}

export interface BattleState {
  player1: PlayerState;
  player2: PlayerState;
  currentTurn: 'player1' | 'player2';
  turnNumber: number;
  fieldEffects: FieldEffect[];
  log: LogEntry[];
  phase: 'draw' | 'main' | 'attack' | 'end' | 'game-over';
  winner: 'player1' | 'player2' | null;
  zoomedCard: AnyCard | null;
  pendingBurnout: { playerId: 'player1' | 'player2'; damage: number }[];
  reactionsAvailable: boolean;
  lastAttackInfo: { attackerId: 'player1' | 'player2'; damage: number } | null;
}

export interface LogEntry {
  id: number;
  turn: number;
  message: string;
  type: 'attack' | 'card' | 'status' | 'system' | 'ko';
}

export interface DeckSave {
  id: string;
  name: string;
  cardIds: string[];
}

export interface GameSettings {
  sfxEnabled: boolean;
  animationsEnabled: boolean;
  player1Name: string;
  player2Name: string;
  botMode: boolean;
}
