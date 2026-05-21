// ============================================================
// FILTHY MINDED BATTLE DECK — Starter Decks
// ============================================================

import type { DeckSave } from '../engine/types';

// Office Chaos Starter — Office and Chaos focused
export const officeStarterDeck: DeckSave = {
  id: 'starter-office',
  name: 'Office Chaos Starter',
  cardIds: [
    // Creatures x8
    'c001', // Passive Aggressaurus
    'c001', // Passive Aggressaurus
    'c004', // Trash Panda Executive
    'c004', // Trash Panda Executive
    'c007', // Reply All Raptor
    'c007', // Reply All Raptor
    'c022', // Microwave Mutant
    'c022', // Microwave Mutant
    // Action x14
    'a001', // HR Summons
    'a001', // HR Summons
    'a002', // Petty Receipt
    'a002', // Petty Receipt
    'a012', // Inbox Zero Fantasy
    'a012', // Inbox Zero Fantasy
    'a015', // Passive Aggressive Sticky Note
    'a015', // Passive Aggressive Sticky Note
    'a024', // Reclaim Your Time
    'a026', // Budget Meeting
    'a026', // Budget Meeting
    'a038', // Conference Call Ambush
    'a039', // Caffeine Crash
    'a039', // Caffeine Crash
    // Items x5
    'i003', // Stress Ball of Power
    'i003', // Stress Ball of Power
    'i004', // Cursed Lanyard
    'i004', // Cursed Lanyard
    'i016', // Caffeine Dependency Crown
    // Reactions x3
    'r001', // Actually Though
    'r006', // Pivot
    'r009', // Soft No
  ],
};

// Digital Mind Starter — Digital and Mind focused
export const digitalStarterDeck: DeckSave = {
  id: 'starter-digital',
  name: 'Digital Mind Starter',
  cardIds: [
    // Creatures x8
    'c003', // Doomscroll Drake
    'c003', // Doomscroll Drake
    'c005', // Overshare Oracle
    'c005', // Overshare Oracle
    'c010', // Notification Nightmare
    'c010', // Notification Nightmare
    'c015', // Fomo Phantom
    'c020', // Algorithm Ape
    // Action x14
    'a003', // Emergency Group Chat
    'a003', // Emergency Group Chat
    'a005', // Side Hustle Energy Drink
    'a005', // Side Hustle Energy Drink
    'a008', // Unsubscribe Bomb
    'a008', // Unsubscribe Bomb
    'a014', // Vague Posting
    'a014', // Vague Posting
    'a018', // Internet Rabbit Hole
    'a025', // Viral Moment
    'a025', // Viral Moment
    'a032', // Doomscroll Session
    'a040', // No Context Screenshot
    'a046', // Clout Transfer
    // Items x5
    'i006', // Ring Light of Confidence
    'i007', // Brand Deal Shield
    'i013', // Night Mode Goggles
    'i013', // Night Mode Goggles
    'i017', // Hyper Focus Lens
    // Reactions x3
    'r003', // Receipts Ready
    'r007', // I Read That Wrong
    'r010', // Not My Problem
  ],
};

export const starterDecks: DeckSave[] = [officeStarterDeck, digitalStarterDeck];
