import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { UserDisplay } from '../UserDisplay';

const meta: Meta<typeof UserDisplay> = {
  title: 'Features/Guest Auth/UserDisplay',
  component: UserDisplay,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays the current user\'s display name in a card format. Shows "Playing as:" label followed by the user\'s name.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    displayName: {
      control: { type: 'text' },
      description: 'The display name to show for the user',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    displayName: 'Guest-Player-001',
  },
};

export const WithLongName: Story = {
  args: {
    displayName: 'Guest-Player-With-Very-Long-Name-001',
  },
};
