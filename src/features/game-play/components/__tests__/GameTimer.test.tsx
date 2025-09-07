import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { GameTimer } from '../GameTimer';

describe('GameTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders timer with initial time', () => {
    render(<GameTimer />);

    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('3:00')).toBeInTheDocument();
  });

  it('updates timer countdown', () => {
    render(<GameTimer />);

    // Advance timer by 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(screen.getByText('2:30')).toBeInTheDocument();
  });
});
