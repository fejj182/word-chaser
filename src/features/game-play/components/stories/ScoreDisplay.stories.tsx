import type { Meta, StoryObj } from '@storybook/react';
import { ScoreDisplay } from '../ScoreDisplay';

const meta: Meta<typeof ScoreDisplay> = {
  title: 'Features/Game Play/ScoreDisplay',
  component: ScoreDisplay,
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
