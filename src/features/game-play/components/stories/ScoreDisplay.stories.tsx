import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ScoreDisplay } from '../ScoreDisplay';
import { UserRoomDecorator } from '@/features/development/stories/decorators';

const meta: Meta<typeof ScoreDisplay> = {
  title: 'Features/Game Play/ScoreDisplay',
  component: ScoreDisplay,
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
