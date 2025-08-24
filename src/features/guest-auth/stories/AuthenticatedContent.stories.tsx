import type { Meta, StoryObj } from '@storybook/react';
import { AuthenticatedContent } from '../components/AuthenticatedContent';
import { UserContext } from '../contexts/UserContext';

const meta: Meta<typeof AuthenticatedContent> = {
  title: 'Features/Guest Auth/AuthenticatedContent',
  component: AuthenticatedContent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The full screen content shown to authenticated users. Includes the game header, user display, and room management interface.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story: any) => (
      <UserContext.Provider value={{
        userId: 'guest-12345',
        displayName: 'Guest-Player-001',
        setUser: () => {},
      }}>
        <div style={{ height: '100vh' }}>
          <Story />
        </div>
      </UserContext.Provider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLongDisplayName: Story = {
  decorators: [
    (Story: any) => (
      <UserContext.Provider value={{
        userId: 'guest-12345-very-long-id',
        displayName: 'Guest-Player-With-Very-Long-Name-001',
        setUser: () => {},
      }}>
        <div style={{ height: '100vh' }}>
          <Story />
        </div>
      </UserContext.Provider>
    ),
  ],
};
