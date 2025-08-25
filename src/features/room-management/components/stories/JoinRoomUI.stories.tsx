import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import JoinRoomUI from '../JoinRoomUI';

const meta: Meta<typeof JoinRoomUI> = {
  title: 'Features/Room Management/JoinRoomUI',
  component: JoinRoomUI,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onSubmit: { action: 'submitted' },
    onRoomIdChange: { action: 'roomIdChanged' },
    isLoading: {
      control: { type: 'boolean' },
    },
    error: {
      control: { type: 'text' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    roomId: '',
    isLoading: false,
    error: null,
  },
};

export const WithError: Story = {
  args: {
    roomId: '',
    isLoading: false,
    error: 'Invalid room code',
  },
};



