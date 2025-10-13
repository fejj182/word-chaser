import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { GameTimer } from '../GameTimer';
import { UserRoomDecorator } from '@/features/development/stories/decorators';

const meta: Meta<typeof GameTimer> = {
  title: 'Features/Game Play/GameTimer',
  component: GameTimer,
  decorators: [UserRoomDecorator],
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
