import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FinalGameResultsUI } from '../FinalGameResults/FinalGameResultsUI';

const meta: Meta<typeof FinalGameResultsUI> = {
  title: 'Features/Game Play/FinalGameResultsUI',
  component: FinalGameResultsUI,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    onReturnToMenu: { action: 'return-to-menu-clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockPlayers = {
  'player1': { displayName: 'Alice' },
  'player2': { displayName: 'Bob' },
  'player3': { displayName: 'Charlie' },
};

const mockSortedPlayers = [
  { playerId: 'player1', displayName: 'Alice', score: 150 },
  { playerId: 'player2', displayName: 'Bob', score: 120 },
  { playerId: 'player3', displayName: 'Charlie', score: 90 },
];

const mockRoundResults = {
  'round-1': {
    roundNumber: 1,
    roundScores: { 'player1': 50, 'player2': 40, 'player3': 30 },
    roundWords: {
      'player1': [
        { word: 'cat', playerId: 'player1', playerName: 'Alice', score: 15, submittedAt: 1000 },
        { word: 'dog', playerId: 'player1', playerName: 'Alice', score: 20, submittedAt: 1100 },
        { word: 'bird', playerId: 'player1', playerName: 'Alice', score: 15, submittedAt: 1200 },
      ],
      'player2': [
        { word: 'fish', playerId: 'player2', playerName: 'Bob', score: 20, submittedAt: 1050 },
        { word: 'mouse', playerId: 'player2', playerName: 'Bob', score: 20, submittedAt: 1150 },
      ],
      'player3': [
        { word: 'ant', playerId: 'player3', playerName: 'Charlie', score: 30, submittedAt: 1300 },
      ],
    },
    roundWinner: {
      playerId: 'player1',
      playerName: 'Alice',
      score: 50,
    },
  },
  'round-2': {
    roundNumber: 2,
    roundScores: { 'player1': 60, 'player2': 50, 'player3': 35 },
    roundWords: {
      'player1': [
        { word: 'elephant', playerId: 'player1', playerName: 'Alice', score: 30, submittedAt: 2000 },
        { word: 'tiger', playerId: 'player1', playerName: 'Alice', score: 30, submittedAt: 2100 },
      ],
      'player2': [
        { word: 'lion', playerId: 'player2', playerName: 'Bob', score: 25, submittedAt: 2050 },
        { word: 'bear', playerId: 'player2', playerName: 'Bob', score: 25, submittedAt: 2150 },
      ],
      'player3': [
        { word: 'fox', playerId: 'player3', playerName: 'Charlie', score: 15, submittedAt: 2200 },
        { word: 'wolf', playerId: 'player3', playerName: 'Charlie', score: 20, submittedAt: 2250 },
      ],
    },
    roundWinner: {
      playerId: 'player1',
      playerName: 'Alice',
      score: 60,
    },
  },
  'round-3': {
    roundNumber: 3,
    roundScores: { 'player1': 40, 'player2': 30, 'player3': 25 },
    roundWords: {
      'player1': [
        { word: 'snake', playerId: 'player1', playerName: 'Alice', score: 40, submittedAt: 3000 },
      ],
      'player2': [
        { word: 'frog', playerId: 'player2', playerName: 'Bob', score: 30, submittedAt: 3050 },
      ],
      'player3': [
        { word: 'bee', playerId: 'player3', playerName: 'Charlie', score: 25, submittedAt: 3100 },
      ],
    },
    roundWinner: {
      playerId: 'player1',
      playerName: 'Alice',
      score: 40,
    },
  },
};

const mockGetTotalWordsFound = (playerId: string): number => {
  const totals: Record<string, number> = {
    'player1': 6,
    'player2': 5,
    'player3': 4,
  };
  return totals[playerId] || 0;
};

export const WithWinner: Story = {
  args: {
    gameWinner: {
      playerId: 'player1',
      playerName: 'Alice',
      finalScore: 150,
    },
    sortedPlayers: mockSortedPlayers,
    roundResults: mockRoundResults,
    players: mockPlayers,
    getTotalWordsFound: mockGetTotalWordsFound,
  },
};

export const WithTie: Story = {
  args: {
    gameWinner: undefined,
    sortedPlayers: [
      { playerId: 'player1', displayName: 'Alice', score: 120 },
      { playerId: 'player2', displayName: 'Bob', score: 120 },
      { playerId: 'player3', displayName: 'Charlie', score: 90 },
    ],
    roundResults: mockRoundResults,
    players: mockPlayers,
    getTotalWordsFound: mockGetTotalWordsFound,
  },
};
