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

    expect(screen.getByText('Time Remaining')).toBeInTheDocument();
    expect(screen.getByText('3:00')).toBeInTheDocument();
    expect(screen.getByText('Round in progress')).toBeInTheDocument();
  });

  it('updates timer countdown', () => {
    render(<GameTimer />);

    // Advance timer by 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(screen.getByText('2:30')).toBeInTheDocument();
  });

  it('shows hurry up message when time is low', () => {
    render(<GameTimer />);

    // Advance timer to 25 seconds remaining
    act(() => {
      jest.advanceTimersByTime(155000);
    });

    expect(screen.getByText('0:25')).toBeInTheDocument();
    expect(screen.getByText('Hurry up!')).toBeInTheDocument();
  });

  it('shows time up message when timer reaches zero', () => {
    render(<GameTimer />);

    // Advance timer to completion
    act(() => {
      jest.advanceTimersByTime(180000);
    });

    expect(screen.getByText('0:00')).toBeInTheDocument();
    expect(screen.getByText("Time's up! Round complete.")).toBeInTheDocument();
  });

  it('displays progress bar', () => {
    render(<GameTimer />);

    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();

    // Advance timer by 50%
    act(() => {
      jest.advanceTimersByTime(90000);
    });

    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});
