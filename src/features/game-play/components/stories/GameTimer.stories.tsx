import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { GameTimer } from '../GameTimer';

const meta: Meta<typeof GameTimer> = {
  title: 'Features/Game Play/GameTimer',
  component: GameTimer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
