import type { Meta, StoryObj } from '@storybook/react';
import { UserProvider } from '@/features/guest-auth/contexts/UserContext';
import { RoomProvider } from '@/features/shared/contexts/RoomContext';
import JoinRoom from '../JoinRoom';

// Wrapper component to provide necessary context
const JoinRoomWithProviders = () => (
  <UserProvider>
    <RoomProvider>
      <JoinRoom />
    </RoomProvider>
  </UserProvider>
);

const meta: Meta<typeof JoinRoomWithProviders> = {
  title: 'Components/JoinRoom',
  component: JoinRoomWithProviders,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onSubmit: { action: 'submitted' },
    isLoading: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};