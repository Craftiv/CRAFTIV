import { create } from 'zustand';

export type TimerMode = 'stopwatch' | 'countdown';

interface TimerState {
  mode: TimerMode;
  isRunning: boolean;
  startTime: number | null; // ms timestamp
  elapsedTime: number; // ms
  countdownDuration: number; // ms
  remainingTime: number; // ms
  isFocusMode: boolean;
  // Actions
  setMode: (mode: TimerMode) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  setCountdownDuration: (ms: number) => void;
  tick: () => void;
  toggleFocusMode: () => void;
  clearProgress: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  mode: 'countdown', // Default to countdown mode
  isRunning: false,
  startTime: null,
  elapsedTime: 0,
  countdownDuration: 60 * 60 * 1000, // default 60 min
  remainingTime: 60 * 60 * 1000,
  isFocusMode: false,
  setMode: (mode) => set({ mode }),
  start: () => {
    if (!get().isRunning) {
      const now = Date.now();
      set(state => ({
        isRunning: true,
        startTime: now - (state.mode === 'stopwatch' ? state.elapsedTime : (state.countdownDuration - state.remainingTime)),
      }));
    }
  },
  pause: () => {
    if (get().isRunning) {
      const now = Date.now();
      set(state => {
        if (state.mode === 'stopwatch') {
          return {
            isRunning: false,
            elapsedTime: now - (state.startTime ?? now),
          };
        } else {
          // countdown
          return {
            isRunning: false,
            remainingTime: Math.max(state.countdownDuration - (now - (state.startTime ?? now)), 0),
          };
        }
      });
    }
  },
  reset: () => set(state => ({
    isRunning: false,
    startTime: null,
    elapsedTime: 0,
    remainingTime: state.countdownDuration,
  })),
  setCountdownDuration: (ms) => set({ countdownDuration: ms, remainingTime: ms }),
  tick: () => {
    const now = Date.now();
    const { isRunning, startTime, mode, countdownDuration } = get();
    if (!isRunning || !startTime) return;
    if (mode === 'stopwatch') {
      set({ elapsedTime: now - startTime });
    } else {
      const elapsed = now - startTime;
      const remaining = Math.max(countdownDuration - elapsed, 0);
      set({ remainingTime: remaining });
      if (remaining <= 0) {
        set({ isRunning: false });
      }
    }
  },
  toggleFocusMode: () => set(state => ({ isFocusMode: !state.isFocusMode })),
  clearProgress: () => set(state => ({
    isRunning: false,
    startTime: null,
    elapsedTime: 0,
    remainingTime: state.countdownDuration,
  })),
})); 