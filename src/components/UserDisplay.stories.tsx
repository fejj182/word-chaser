import type { Meta, StoryObj } from '@storybook/react';
import { UserDisplay } from './UserDisplay';
import { UserProvider } from '@/contexts/UserContext';

const meta: Meta<typeof UserDisplay> = {
  title: 'Components/UserDisplay',
  component: UserDisplay,
  decorators: [
    (Story) => (
      <UserProvider>
        <Story />
      </UserProvider>
    ),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A fixed-position component that displays the current user information and provides a copy ID feature.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default state - no user signed in
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Component is hidden when no user is signed in.',
      },
    },
  },
};