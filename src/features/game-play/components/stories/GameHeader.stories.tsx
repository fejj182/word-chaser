import { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GameHeader } from "../GameHeader";

const meta: Meta<typeof GameHeader> = {
  title: 'Features/Game Play/GameHeader',
  component: GameHeader,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    roomName: { control: 'text' },
    playerName: { control: 'text' },
    onLeaveGame: { action: 'leaveGame' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    roomName: 'Test Room',
    playerName: 'Test Player',
  },
};