import type { Meta, StoryObj } from '@storybook/react';
import CreateRoomForm from '../CreateRoomForm';

const meta: Meta<typeof CreateRoomForm> = {
  title: 'Components/CreateRoomForm',
  component: CreateRoomForm,
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
  args: {
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default form state with empty room name. The Create Room button should be disabled.',
      },
    },
  },
};
