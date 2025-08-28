import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { Completion, DB, Habit, loadDB, saveDB, todayISO } from '../utils/storage';

function makeId() {
  try {
    const uuid = (globalThis as any)?.crypto?.randomUUID?.();
    if (uuid) return uuid;
  } catch {}
  return 'h_' + Math.random().toString(36).slice(2, 10);
}

type State = DB;
type Action =
  | { type: 'LOAD'; payload: DB }
  | { type: 'ADD_HABIT'; name: string; color?: string }
  | { type: 'RENAME_HABIT'; id: string; name: string }
  | { type: 'DELETE_HABIT'; id: string }
  | { type: 'TOGGLE_COMPLETE_TODAY'; id: string; date?: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD':
      return action.payload;

    case 'ADD_HABIT': {
      const name = action.name.trim();
      if (!name) return state; // ignore empty
      const id = makeId();
      const newHabit: Habit = {
        id,
        name,
        color: action.color,
        createdAt: new Date().toISOString(),
      };
      return { ...state, habits: [...state.habits, newHabit] };
    }

    case 'RENAME_HABIT': {
      const habits = state.habits.map(h =>
        h.id === action.id ? { ...h, name: action.name } : h
      );
      return { ...state, habits };
    }

    case 'DELETE_HABIT': {
      const habits = state.habits.filter(h => h.id !== action.id);
      const completions = state.completions.filter(c => c.habitId !== action.id);
      return { ...state, habits, completions };
    }

    case 'TOGGLE_COMPLETE_TODAY': {
      const date = action.date ?? todayISO();
      const idx = state.completions.findIndex(
        c => c.habitId === action.id && c.date === date
      );
      let completions: Completion[];
      if (idx >= 0) {
        // was completed -> uncomplete
        completions = state.completions
          .slice(0, idx)
          .concat(state.completions.slice(idx + 1));
      } else {
        completions = [...state.completions, { habitId: action.id, date }];
      }
      return { ...state, completions };
    }

    default:
      return state;
  }
}

type Ctx = {
  state: State;
  addHabit: (name: string, color?: string) => void;
  renameHabit: (id: string, name: string) => void;
  deleteHabit: (id: string) => void;
  toggleCompleteToday: (id: string, date?: string) => void;
  isCompleted: (id: string, date?: string) => boolean;
};

const HabitsContext = createContext<Ctx | null>(null);

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { habits: [], completions: [], _version: 1 });

  useEffect(() => {
    (async () => {
      try {
        const db = await loadDB();
        dispatch({ type: 'LOAD', payload: db });
      } catch (e) {
        console.warn('Failed to load DB', e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await saveDB(state);
      } catch (e) {
        console.warn('Failed to save DB', e);
      }
    })();
  }, [state]);

  const value = useMemo<Ctx>(() => ({
    state,
    addHabit: (name, color) => dispatch({ type: 'ADD_HABIT', name, color }),
    renameHabit: (id, name) => dispatch({ type: 'RENAME_HABIT', id, name }),
    deleteHabit: (id) => dispatch({ type: 'DELETE_HABIT', id }),
    toggleCompleteToday: (id, date) => dispatch({ type: 'TOGGLE_COMPLETE_TODAY', id, date }),
    isCompleted: (id, date) => {
      const d = date ?? todayISO();
      return state.completions.some(c => c.habitId === id && c.date === d);
    },
  }), [state]);

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>;
}

export function useHabits() {
  const ctx = useContext(HabitsContext);
  if (!ctx) throw new Error('useHabits must be used inside HabitsProvider');
  return ctx;
}
