import type { Meta, StoryObj } from '@storybook/react';
import { WordInput } from '../WordInput';

const meta: Meta<typeof WordInput> = {
  title: 'Features/Game Play/WordInput',
  component: WordInput,
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
