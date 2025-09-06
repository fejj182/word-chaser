import type { Meta, StoryObj } from '@storybook/react';
import { GridSizeSelector } from '../GridSizeSelector';
import { useState } from 'react';
import { GridSize } from '../../contexts/GamePlayContext';

const meta: Meta<typeof GridSizeSelector> = {
  title: 'Features/Game Play/GridSizeSelector',
  component: GridSizeSelector,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'select',
      options: ['small', 'medium'],
      description: 'The currently selected grid size',
    },
    onChange: {
      action: 'changed',
      description: 'Callback fired when grid size selection changes',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the selector is disabled',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof GridSizeSelector>;

// Interactive story with state management
const InteractiveTemplate = (args: any) => {
  const [value, setValue] = useState<GridSize>('small');
  
  return (
    <GridSizeSelector
      {...args}
      value={value}
      onChange={(newValue) => {
        setValue(newValue);
        args.onChange?.(newValue);
      }}
    />
  );
};

export const Default: Story = {
  render: InteractiveTemplate,
  args: {
    value: 'small',
    disabled: false,
  },
};

export const Disabled: Story = {
  args: {
    value: 'small',
    disabled: true,
  },
};

