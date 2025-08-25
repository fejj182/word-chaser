import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import CreateRoomUI from '../CreateRoomUI';

const meta: Meta<typeof CreateRoomUI> = {
  title: 'Features/Room Management/CreateRoomUI',
  component: CreateRoomUI,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onSubmit: { action: 'submitted' },
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
    isLoading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default form state with empty room name. The Create Room button should be disabled.',
      },
    },
  },
};

export const WithError: Story = {
  args: {
    isLoading: false,
    error: 'Failed to create room. Room name might already exist.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state showing validation or server error message.',
      },
    },
  },
};
