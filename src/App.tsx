import React, { useState } from 'react';
import type { GameScreen, GameSettings, DeckSave, BattleState, AIDifficulty, AnyCard } from './engine/types';
import { buildPlayerState, makeInitialBattleState } from './engine/battleEngine';
import { starterDecks } from './data/starterDecks';
import {
  storyChapters,
  storyStarterPacks,
  loadStorySave,
  saveStoryProgress,
  clearStorySave,
  pickRewards,
} from './data/storyMode';
import type { StorySave } from './data/storyMode';
import { getCardById } from './data/cards';

import MainMenu from './screens/MainMenu';
import DeckSelection from './screens/DeckSelection';
import BattleScreen from './screens/BattleScreen';
import VictoryScreen from './screens/VictoryScreen';
import RulesScreen from './screens/RulesScreen';
import SettingsScreen from './screens/SettingsScreen';
import DeckBuilder from './screens/DeckBuilder';
import CardCollection from './screens/CardCollection';
import QuickPlay from './screens/QuickPlay';
import StoryMap from './screens/StoryMap';
import StoryReward from './screens/StoryReward';

const SETTINGS_KEY = 'fmbd_settings';
const DECKS_KEY = 'fmbd_decks';

const defaultSettings: GameSettings = {
  botMode: true,
  animationsEnabled: true,
  sfxEnabled: false,
  player1Name: 'Player 1',
  player2Name: 'Player 2',
};

function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {}
  return { ...defaultSettings };
}

function loadDecks(): DeckSave[] {
  try {
    const raw = localStorage.getItem(DECKS_KEY);
    if (raw) return JSON.parse(raw) as DeckSave[];
  } catch {}
  return [];
}

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('main-menu');
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [savedDecks, setSavedDecks] = useState<DeckSave[]>(loadDecks);
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [pendingP1DeckId, setPendingP1DeckId] = useState<string | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<AIDifficulty>('normal');

  // ── Story mode state ──
  const [storySave, setStorySave] = useState<StorySave | null>(loadStorySave);
  const [currentStoryChapter, setCurrentStoryChapter] = useState<number>(0);
  const [storyRewardCards, setStoryRewardCards] = useState<AnyCard[]>([]);
  const [isBattleStoryMode, setIsBattleStoryMode] = useState(false);

  const allDecks = [...starterDecks, ...savedDecks];

  const startBattle = (p1DeckId: string, p2DeckId: string) => {
    const p1Deck = allDecks.find((d) => d.id === p1DeckId) ?? starterDecks[0];
    const p2Deck = allDecks.find((d) => d.id === p2DeckId) ?? starterDecks[1];
    const p1State = buildPlayerState('player1', settings.player1Name, p1Deck.cardIds);
    const p2State = buildPlayerState(
      'player2',
      settings.botMode ? 'The Bot' : settings.player2Name,
      p2Deck.cardIds,
    );
    const initial = makeInitialBattleState(p1State, p2State);
    setBattleState(initial);
    setScreen('battle');
  };

  const startQuickPlay = (p1DeckId: string, difficulty: AIDifficulty) => {
    setCurrentDifficulty(difficulty);
    const p1Deck = allDecks.find((d) => d.id === p1DeckId) ?? starterDecks[0];
    const botDeck = allDecks[Math.floor(Math.random() * allDecks.length)];
    const p1State = buildPlayerState('player1', settings.player1Name, p1Deck.cardIds);
    const p2State = buildPlayerState('player2', 'The Bot', botDeck.cardIds);
    const initial = makeInitialBattleState(p1State, p2State);
    setBattleState(initial);
    setScreen('battle');
  };

  const handleGameOver = (state: BattleState) => {
    setBattleState(state);
    setScreen('victory');
  };

  // ── Story handlers ──

  const handleChooseStarter = (starterId: string) => {
    const pack = storyStarterPacks.find((p) => p.id === starterId) ?? storyStarterPacks[0];
    const save: StorySave = {
      starterChoice: starterId,
      deckIds: [...pack.cardIds],
      completedChapters: [],
      unlockedThrough: 0,
    };
    saveStoryProgress(save);
    setStorySave(save);
  };

  const startStoryChapter = (chapterIdx: number) => {
    if (!storySave) return;
    const chapter = storyChapters[chapterIdx];
    setCurrentStoryChapter(chapterIdx);
    setCurrentDifficulty(chapter.difficulty);
    const p1State = buildPlayerState('player1', settings.player1Name, storySave.deckIds);
    const p2State = buildPlayerState('player2', chapter.opponentName, chapter.botDeckIds);
    setBattleState(makeInitialBattleState(p1State, p2State));
    setIsBattleStoryMode(true);
    setScreen('battle');
  };

  const handleStoryGameOver = (state: BattleState) => {
    setBattleState(state);
    setIsBattleStoryMode(false);
    if (state.winner !== 'player1') {
      // Player lost — go back to map to retry
      setScreen('story-map');
      return;
    }
    // Player won — generate reward cards
    const chapter = storyChapters[currentStoryChapter];
    const rewardIds = pickRewards(chapter.rewardPool, 3);
    const cards = rewardIds.map((id) => getCardById(id)).filter(Boolean) as AnyCard[];
    setStoryRewardCards(cards);
    setScreen('story-reward');
  };

  const handleStoryRewardConfirm = (chosen: AnyCard[]) => {
    if (!storySave) return;
    const newDeckIds = [...storySave.deckIds, ...chosen.map((c) => c.id)];
    const newCompleted = storySave.completedChapters.includes(currentStoryChapter)
      ? storySave.completedChapters
      : [...storySave.completedChapters, currentStoryChapter];
    const nextUnlocked = Math.max(storySave.unlockedThrough, currentStoryChapter + 1);
    const updated: StorySave = {
      ...storySave,
      deckIds: newDeckIds,
      completedChapters: newCompleted,
      unlockedThrough: Math.min(nextUnlocked, storyChapters.length - 1),
    };
    saveStoryProgress(updated);
    setStorySave(updated);
    setScreen('story-map');
  };

  const handleStoryReset = () => {
    clearStorySave();
    setStorySave(null);
  };

  return (
    <>
      {screen === 'main-menu' && (
        <MainMenu
          settings={settings}
          savedDecks={savedDecks}
          onQuickPlay={() => setScreen('quick-play')}
          onStartBattle={() => setScreen('deck-selection')}
          onOpenDeckBuilder={() => setScreen('deck-builder')}
          onOpenCollection={() => setScreen('card-collection')}
          onOpenRules={() => setScreen('rules')}
          onOpenSettings={() => setScreen('settings')}
          onStoryMode={() => setScreen('story-map')}
        />
      )}
      {screen === 'quick-play' && (
        <QuickPlay
          savedDecks={savedDecks}
          onStart={startQuickPlay}
          onBack={() => setScreen('main-menu')}
        />
      )}
      {screen === 'deck-selection' && (
        <DeckSelection
          savedDecks={savedDecks}
          settings={settings}
          onSelectDecks={startBattle}
          onBack={() => setScreen('main-menu')}
        />
      )}
      {screen === 'battle' && battleState && (
        <BattleScreen
          initialState={battleState}
          settings={settings}
          difficulty={currentDifficulty}
          onGameOver={isBattleStoryMode ? handleStoryGameOver : handleGameOver}
          onForfeit={() => setScreen(isBattleStoryMode ? 'story-map' : 'main-menu')}
        />
      )}
      {screen === 'victory' && battleState && (
        <VictoryScreen
          state={battleState}
          onPlayAgain={() => setScreen('deck-selection')}
          onMainMenu={() => setScreen('main-menu')}
        />
      )}
      {screen === 'rules' && <RulesScreen onBack={() => setScreen('main-menu')} />}
      {screen === 'settings' && (
        <SettingsScreen
          settings={settings}
          onSave={setSettings}
          onBack={() => setScreen('main-menu')}
        />
      )}
      {screen === 'deck-builder' && (
        <DeckBuilder
          savedDecks={savedDecks}
          onSave={setSavedDecks}
          onBack={() => setScreen('main-menu')}
        />
      )}
      {screen === 'card-collection' && (
        <CardCollection onBack={() => setScreen('main-menu')} />
      )}
      {screen === 'story-map' && (
        <StoryMap
          storySave={storySave}
          onStartChapter={startStoryChapter}
          onChooseStarter={handleChooseStarter}
          onBack={() => setScreen('main-menu')}
          onReset={handleStoryReset}
        />
      )}
      {screen === 'story-reward' && storyRewardCards.length > 0 && (
        <StoryReward
          chapterTitle={storyChapters[currentStoryChapter].title}
          rewards={storyRewardCards}
          onConfirm={handleStoryRewardConfirm}
        />
      )}
    </>
  );
}
