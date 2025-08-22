import type { Meta, StoryObj } from '@storybook/react';
import { UnauthenticatedContent } from '../components/UnauthenticatedContent';

const meta: Meta<typeof UnauthenticatedContent> = {
  title: 'Features/Guest Auth/UnauthenticatedContent',
  component: UnauthenticatedContent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The full screen content shown to users who are not signed in. Includes the game header and guest sign-in form.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story: any) => (
      <div style={{ height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default state - shows the sign-in interface
export const Default: Story = {};
