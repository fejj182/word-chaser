import type { Meta, StoryObj } from '@storybook/react';
import { GuestSignIn } from './GuestSignIn';
import { UserProvider } from '@/contexts/UserContext';

const meta: Meta<typeof GuestSignIn> = {
  title: 'Components/GuestSignIn',
  component: GuestSignIn,
  decorators: [
    (Story) => (
      <UserProvider>
        <Story />
      </UserProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A component that handles anonymous guest sign-in for the Word Chaser game.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default state - not signed in
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default state when user is not signed in. Shows the "Play as Guest" button.',
      },
    },
  },
};