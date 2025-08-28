import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'habittracker.v1';

export type Habit = {
  id: string;
  name: string;
  color?: string;
  createdAt: string; // ISO
  archived?: boolean;
};

export type Completion = {
  habitId: string;
  date: string; // 'YYYY-MM-DD'
};

export type DB = {
  habits: Habit[];
  completions: Completion[]; // one record = completed that day
  _version: 1;
};

const emptyDB: DB = { habits: [], completions: [], _version: 1 };

export async function loadDB(): Promise<DB> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return emptyDB;
  try {
    const parsed: DB = JSON.parse(raw);
    return parsed?._version === 1 ? parsed : emptyDB;
  } catch {
    return emptyDB;
  }
}

export async function saveDB(db: DB) {
  await AsyncStorage.setItem(KEY, JSON.stringify(db));
}

export function todayISO(date = new Date()): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}
