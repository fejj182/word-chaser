import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { RoundResultsUI } from '../RoundResults/RoundResultsUI';

const meta: Meta<typeof RoundResultsUI> = {
  title: 'Features/Game Play/RoundResultsUI',
  component: RoundResultsUI,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockPlayers = {
  'player1': { displayName: 'Alice' },
  'player2': { displayName: 'Bob' },
  'player3': { displayName: 'Charlie' },
};

export const WithWinner: Story = {
  args: {
    roundResult: {
      roundNumber: 1,
      roundScores: {
        'player1': 50,
        'player2': 40,
        'player3': 30,
      },
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
    players: mockPlayers,
    countdown: 3,
  },
};

export const NoWinner: Story = {
  args: {
    roundResult: {
      roundNumber: 2,
      roundScores: {
        'player1': 0,
        'player2': 0,
        'player3': 0,
      },
      roundWords: {
        'player1': [],
        'player2': [],
        'player3': [],
      },
      roundWinner: null,
    },
    players: mockPlayers,
    countdown: 5,
  },
};
