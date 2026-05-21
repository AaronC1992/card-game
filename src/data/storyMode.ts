// ============================================================
// FILTHY MINDED BATTLE DECK — Story Mode Data
// ============================================================

import type { AIDifficulty, DeckSave } from '../engine/types';

// ── Starter Packs (20 cards each, player picks one to begin) ──────────────

export const storyStarterPacks: DeckSave[] = [
  {
    id: 'story-starter-office',
    name: 'Office Chaos',
    cardIds: [
      // Creatures x8
      'c001', 'c001', 'c004', 'c004', 'c007', 'c007', 'c022', 'c022',
      // Actions x8
      'a001', 'a002', 'a012', 'a015', 'a024', 'a026', 'a038', 'a039',
      // Items x2
      'i003', 'i004',
      // Reactions x2
      'r001', 'r009',
    ],
  },
  {
    id: 'story-starter-digital',
    name: 'Digital Mind',
    cardIds: [
      // Creatures x8
      'c003', 'c003', 'c005', 'c005', 'c010', 'c010', 'c015', 'c015',
      // Actions x8
      'a003', 'a005', 'a008', 'a014', 'a018', 'a025', 'a032', 'a040',
      // Items x2
      'i006', 'i013',
      // Reactions x2
      'r003', 'r010',
    ],
  },
];

// ── Chapter Definitions ───────────────────────────────────────────────────

export interface StoryChapter {
  id: number;
  title: string;
  opponentName: string;
  flavor: string;
  difficulty: AIDifficulty;
  difficultyLabel: string;
  botDeckIds: string[];
  rewardPool: string[]; // card IDs that can appear as rewards
}

export const storyChapters: StoryChapter[] = [
  {
    id: 0,
    title: 'Chapter 1: The Intern',
    opponentName: 'The Intern',
    flavor: 'Fresh out of college. Talks constantly about their gap year. Thinks hustle culture is a personality.',
    difficulty: 'easy',
    difficultyLabel: 'Easy',
    botDeckIds: [
      'c001', 'c001', 'c004', 'c004', 'c007', 'c007', 'c022', 'c022',
      'a001', 'a001', 'a002', 'a002', 'a012', 'a012', 'a015', 'a015',
      'a024', 'a026', 'a026', 'a038', 'a039', 'a039',
      'i003', 'i003', 'i004', 'i004', 'i016',
      'r001', 'r006', 'r009',
    ],
    rewardPool: [
      'c001', 'c004', 'c007', 'c022',
      'a001', 'a002', 'a012', 'a015', 'a024', 'a026',
      'i003', 'i004',
      'r001', 'r009',
    ],
  },
  {
    id: 1,
    title: 'Chapter 2: The Wellness Girlboss',
    opponentName: 'The Wellness Girlboss',
    flavor: 'Has a podcast. An essential oil for every problem. Manifesting her way through your entire deck.',
    difficulty: 'easy',
    difficultyLabel: 'Easy',
    botDeckIds: [
      'c002', 'c002', 'c006', 'c006', 'c009', 'c009', 'c013', 'c013',
      'a007', 'a007', 'a011', 'a011', 'a013', 'a013', 'a017', 'a017',
      'a021', 'a021', 'a023', 'a023', 'a027', 'a027',
      'i001', 'i001', 'i005', 'i005', 'i009',
      'r006', 'r006', 'r010',
    ],
    rewardPool: [
      'c002', 'c006', 'c009', 'c013',
      'a007', 'a011', 'a013', 'a017', 'a021', 'a023',
      'i001', 'i005', 'i009',
      'r006', 'r010',
    ],
  },
  {
    id: 2,
    title: 'Chapter 3: The Chronically Online',
    opponentName: 'The Chronically Online',
    flavor: 'Main character syndrome. Online 18 hours a day. Will ratio you into oblivion and call it self care.',
    difficulty: 'normal',
    difficultyLabel: 'Normal',
    botDeckIds: [
      'c003', 'c003', 'c005', 'c005', 'c008', 'c008', 'c010', 'c010',
      'a003', 'a003', 'a008', 'a008', 'a014', 'a014', 'a018', 'a018',
      'a025', 'a025', 'a032', 'a032', 'a040', 'a046',
      'i006', 'i006', 'i013', 'i013', 'i017',
      'r003', 'r007', 'r010',
    ],
    rewardPool: [
      'c003', 'c005', 'c008', 'c010',
      'a003', 'a008', 'a014', 'a018', 'a025', 'a032',
      'i006', 'i013', 'i017',
      'r003', 'r007',
    ],
  },
  {
    id: 3,
    title: 'Chapter 4: The HR Demon',
    opponentName: 'The HR Demon',
    flavor: 'Files a complaint about your complaint about their complaint. Has read every policy doc and weaponizes all of them.',
    difficulty: 'normal',
    difficultyLabel: 'Normal',
    botDeckIds: [
      'c012', 'c012', 'c014', 'c014', 'c019', 'c019', 'c021', 'c021',
      'a009', 'a009', 'a010', 'a010', 'a016', 'a016', 'a020', 'a020',
      'a022', 'a022', 'a028', 'a028', 'a030', 'a030',
      'i008', 'i008', 'i010', 'i010', 'i011',
      'r002', 'r004', 'r009',
    ],
    rewardPool: [
      'c012', 'c014', 'c019', 'c021',
      'a009', 'a010', 'a016', 'a022', 'a028', 'a030',
      'i008', 'i010', 'i011',
      'r002', 'r004',
    ],
  },
  {
    id: 4,
    title: 'Chapter 5: The Algorithm',
    opponentName: 'The Algorithm',
    flavor: 'Optimized. Soulless. Has 14 streams of passive income. Does not sleep. Does not feel.',
    difficulty: 'hard',
    difficultyLabel: 'Hard',
    botDeckIds: [
      'c010', 'c010', 'c015', 'c015', 'c020', 'c020', 'c023', 'c023',
      'a003', 'a003', 'a005', 'a005', 'a014', 'a014', 'a018', 'a018',
      'a025', 'a025', 'a032', 'a032', 'a046', 'a046',
      'i007', 'i007', 'i013', 'i013', 'i017',
      'r005', 'r007', 'r010',
    ],
    rewardPool: [
      'c015', 'c020', 'c023',
      'a005', 'a014', 'a025', 'a032', 'a046',
      'i007', 'i017',
      'r005', 'r007',
    ],
  },
  {
    id: 5,
    title: 'Chapter 6: The Budget Meeting',
    opponentName: 'The Budget Meeting',
    flavor: 'They decided before you walked in. This is theater. Your entire existence is a line item to be cut.',
    difficulty: 'hard',
    difficultyLabel: 'Hard',
    botDeckIds: [
      'c014', 'c014', 'c016', 'c016', 'c017', 'c017', 'c024', 'c024',
      'a009', 'a009', 'a019', 'a019', 'a034', 'a034', 'a036', 'a036',
      'a043', 'a043', 'a046', 'a046', 'a022', 'a022',
      'i015', 'i015', 'i016', 'i016', 'i020',
      'r008', 'r011', 'r012',
    ],
    rewardPool: [
      'c016', 'c017', 'c024',
      'a019', 'a034', 'a036', 'a043', 'a046',
      'i015', 'i016', 'i020',
      'r008', 'r011', 'r012',
    ],
  },
];

// ── Save/Load helpers ─────────────────────────────────────────────────────

export const STORY_SAVE_KEY = 'fmbd_story';

export interface StorySave {
  starterChoice: string;
  deckIds: string[];
  completedChapters: number[];
  unlockedThrough: number;
}

export function loadStorySave(): StorySave | null {
  try {
    const raw = localStorage.getItem(STORY_SAVE_KEY);
    if (raw) return JSON.parse(raw) as StorySave;
  } catch {}
  return null;
}

export function saveStoryProgress(save: StorySave): void {
  localStorage.setItem(STORY_SAVE_KEY, JSON.stringify(save));
}

export function clearStorySave(): void {
  localStorage.removeItem(STORY_SAVE_KEY);
}

// Pick 3 random unique cards from a reward pool
export function pickRewards(pool: string[], count = 3): string[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
