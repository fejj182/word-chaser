import { renderHook, act } from '@testing-library/react';
import { useToast } from '../useToast';

describe('useToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with hidden toast', () => {
    const { result } = renderHook(() => useToast());

    expect(result.current.toast.isVisible).toBe(false);
    expect(result.current.toast.message).toBe('');
    expect(result.current.toast.type).toBe('info');
  });

  it('shows toast with custom message and type', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Test message', 'error');
    });

    expect(result.current.toast.isVisible).toBe(true);
    expect(result.current.toast.message).toBe('Test message');
    expect(result.current.toast.type).toBe('error');
  });

  it('shows success toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSuccess('Success message');
    });

    expect(result.current.toast.isVisible).toBe(true);
    expect(result.current.toast.message).toBe('Success message');
    expect(result.current.toast.type).toBe('success');
  });

  it('shows error toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showError('Error message');
    });

    expect(result.current.toast.isVisible).toBe(true);
    expect(result.current.toast.message).toBe('Error message');
    expect(result.current.toast.type).toBe('error');
  });

  it('shows info toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showInfo('Info message');
    });

    expect(result.current.toast.isVisible).toBe(true);
    expect(result.current.toast.message).toBe('Info message');
    expect(result.current.toast.type).toBe('info');
  });

  it('hides toast', () => {
    const { result } = renderHook(() => useToast());

    // First show a toast
    act(() => {
      result.current.showToast('Test message', 'error');
    });

    expect(result.current.toast.isVisible).toBe(true);

    // Then hide it
    act(() => {
      result.current.hideToast();
    });

    expect(result.current.toast.isVisible).toBe(false);
    expect(result.current.toast.message).toBe('Test message'); // Message should remain
    expect(result.current.toast.type).toBe('error'); // Type should remain
  });

  it('overwrites previous toast when showing new one', () => {
    const { result } = renderHook(() => useToast());

    // Show first toast
    act(() => {
      result.current.showToast('First message', 'error');
    });

    expect(result.current.toast.message).toBe('First message');
    expect(result.current.toast.type).toBe('error');

    // Show second toast
    act(() => {
      result.current.showToast('Second message', 'success');
    });

    expect(result.current.toast.message).toBe('Second message');
    expect(result.current.toast.type).toBe('success');
    expect(result.current.toast.isVisible).toBe(true);
  });
});
