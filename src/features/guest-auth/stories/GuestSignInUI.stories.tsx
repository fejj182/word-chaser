import type { Meta, StoryObj } from '@storybook/react';
import { GuestSignInUI } from '../components/GuestSignInUI';

const meta: Meta<typeof GuestSignInUI> = {
  title: 'Components/GuestSignInUI',
  component: GuestSignInUI,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Pure UI component for guest sign-in. No API calls, just props.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isLoading: { control: 'boolean' },
    error: { control: 'text' },
    isSignedIn: { control: 'boolean' },
    displayName: { control: 'text' },
    onSignIn: { action: 'sign-in-clicked' },
    onStartGame: { action: 'start-game-clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default state - not signed in
export const Default: Story = {
  args: {
    isLoading: false,
    error: null,
    isSignedIn: false,
    displayName: null,
  },
};

// Loading state
export const Loading: Story = {
  args: {
    isLoading: true,
    error: null,
    isSignedIn: false,
    displayName: null,
  },
};

// Error state
export const Error: Story = {
  args: {
    isLoading: false,
    error: 'Network error occurred',
    isSignedIn: false,
    displayName: null,
  },
};

// Signed in state
export const SignedIn: Story = {
  args: {
    isLoading: false,
    error: null,
    isSignedIn: true,
    displayName: 'Guest-abc12345',
  },
};
