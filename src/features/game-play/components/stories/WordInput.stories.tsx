import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { WordInput } from '../WordInput';
import { AllProvidersDecorator } from '@/features/development/stories/decorators';

const meta: Meta<typeof WordInput> = {
  title: 'Features/Game Play/WordInput',
  component: WordInput,
  decorators: [AllProvidersDecorator],
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
