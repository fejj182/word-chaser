import type { Meta, StoryObj } from '@storybook/react';
import RoomMenuUI from '../RoomMenuUI';

const meta: Meta<typeof RoomMenuUI> = {
  title: 'Features/Room Management/RoomMenuUI',
  component: RoomMenuUI,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onCreate: { action: 'create-clicked' },
    onJoin: { action: 'join-clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};



