import type { Meta, StoryObj } from '@storybook/react';
import { LetterGrid } from '../LetterGrid';

const meta: Meta<typeof LetterGrid> = {
  title: 'Features/Game Play/LetterGrid',
  component: LetterGrid,
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
