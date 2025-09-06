import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GridSizeSelector } from '../GridSizeSelector';

describe('GridSizeSelector', () => {
  const defaultProps = {
    value: 'medium' as const,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all grid size options', () => {
    render(<GridSizeSelector {...defaultProps} />);

    expect(screen.getByText('4×4')).toBeInTheDocument();
    expect(screen.getByText('6×6')).toBeInTheDocument();
  });

  it('should show descriptions for each grid size', () => {
    render(<GridSizeSelector {...defaultProps} />);

    expect(screen.getByText('Small grid - easier, faster games')).toBeInTheDocument();
    expect(screen.getByText('Medium grid - balanced challenge')).toBeInTheDocument();
  });

  it('should highlight the selected value', () => {
    render(<GridSizeSelector {...defaultProps} value="small" />);

    const smallButton = screen.getByText('4×4').closest('button');
    expect(smallButton).toHaveClass('border-blue-500');
  });

  it('should call onChange when a different option is clicked', () => {
    render(<GridSizeSelector {...defaultProps} />);

    const smallButton = screen.getByText('4×4').closest('button');
    fireEvent.click(smallButton!);

    expect(defaultProps.onChange).toHaveBeenCalledWith('small');
  });

  it('should not call onChange when the same option is clicked', () => {
    render(<GridSizeSelector {...defaultProps} value="medium" />);

    const mediumButton = screen.getByText('6×6').closest('button');
    fireEvent.click(mediumButton!);

    expect(defaultProps.onChange).not.toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<GridSizeSelector {...defaultProps} disabled={true} />);

    const buttons = screen.getAllByRole('radio');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('should not call onChange when disabled', () => {
    render(<GridSizeSelector {...defaultProps} disabled={true} />);

    const smallButton = screen.getByText('4×4').closest('button');
    fireEvent.click(smallButton!);

    expect(defaultProps.onChange).not.toHaveBeenCalled();
  });

  it('should have proper ARIA attributes', () => {
    render(<GridSizeSelector {...defaultProps} value="medium" />);

    const mediumButton = screen.getByText('6×6').closest('button');
    expect(mediumButton).toHaveAttribute('aria-checked', 'true');

    const smallButton = screen.getByText('4×4').closest('button');
    expect(smallButton).toHaveAttribute('aria-checked', 'false');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <GridSizeSelector {...defaultProps} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});

