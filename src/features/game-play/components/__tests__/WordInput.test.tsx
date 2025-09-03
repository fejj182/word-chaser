import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WordInput } from '../WordInput';

describe('WordInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders word input form', () => {
    render(<WordInput />);

    expect(screen.getByText('Submit Words')).toBeInTheDocument();
    expect(screen.getByLabelText('Current Word')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Word' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('disables submit button when word is too short', () => {
    render(<WordInput />);

    const submitButton = screen.getByRole('button', { name: 'Submit Word' });
    const input = screen.getByLabelText('Current Word');

    expect(submitButton).toBeDisabled();

    fireEvent.change(input, { target: { value: 'ab' } });
    expect(submitButton).toBeDisabled();

    fireEvent.change(input, { target: { value: 'abc' } });
    expect(submitButton).not.toBeDisabled();
  });

  it('submits word and clears input', async () => {
    render(<WordInput />);

    const input = screen.getByLabelText('Current Word');
    const submitButton = screen.getByRole('button', { name: 'Submit Word' });

    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(input).toHaveValue('');
    });

    expect(screen.getByText('TEST')).toBeInTheDocument();
  });

  it('clears input when clear button is clicked', () => {
    render(<WordInput />);

    const input = screen.getByLabelText('Current Word');
    const clearButton = screen.getByRole('button', { name: 'Clear' });

    fireEvent.change(input, { target: { value: 'test' } });
    expect(input).toHaveValue('test');

    fireEvent.click(clearButton);
    expect(input).toHaveValue('');
  });

  it('shows submitted words list', () => {
    render(<WordInput />);

    const input = screen.getByLabelText('Current Word');
    const submitButton = screen.getByRole('button', { name: 'Submit Word' });

    // Submit first word
    fireEvent.change(input, { target: { value: 'first' } });
    fireEvent.click(submitButton);

    // Submit second word
    fireEvent.change(input, { target: { value: 'second' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('FIRST')).toBeInTheDocument();
    expect(screen.getByText('SECOND')).toBeInTheDocument();
  });

  it('handles form submission with enter key', async () => {
    render(<WordInput />);

    const input = screen.getByLabelText('Current Word');

    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(input).toHaveValue('');
    });

    expect(screen.getByText('TEST')).toBeInTheDocument();
  });
});
