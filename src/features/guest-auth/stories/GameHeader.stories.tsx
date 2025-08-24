import type { Meta, StoryObj } from '@storybook/react';
import { GameHeader } from '../components/GameHeader';

const meta: Meta<typeof GameHeader> = {
  title: 'Features/Guest Auth/GameHeader',
  component: GameHeader,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'The main game header with title and description. Used in both authenticated and unauthenticated content.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
