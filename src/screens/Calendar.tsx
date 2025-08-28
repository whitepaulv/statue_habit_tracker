import React, { useMemo, useState } from 'react';
import { Dimensions, FlatList, Pressable, SafeAreaView, Text, View } from 'react-native';
import { useHabits } from '../store/HabitsContext';
import { todayISO } from '../utils/storage';

type DayCell = {
  date: Date;
  iso: string;      // YYYY-MM-DD
  inMonth: boolean;
  isToday: boolean;
};

function pad2(n: number) { return String(n).padStart(2, '0'); }
function isoFromDate(d: Date) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addMonths(d: Date, m: number) { return new Date(d.getFullYear(), d.getMonth() + m, 1); }
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}
function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function parseISO(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
function niceDate(iso: string) {
  const d = parseISO(iso);
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function buildMonthMatrix(anchor: Date): DayCell[][] {
  const first = startOfMonth(anchor);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay()); // back to Sunday
  const today = new Date();

  const matrix: DayCell[][] = [];
  for (let w = 0; w < 6; w++) {
    const row: DayCell[] = [];
    for (let d = 0; d < 7; d++) {
      const cur = new Date(start);
      cur.setDate(start.getDate() + w * 7 + d);
      row.push({
        date: cur,
        iso: isoFromDate(cur),
        inMonth: cur.getMonth() === anchor.getMonth(),
        isToday: isSameDay(cur, today),
      });
    }
    matrix.push(row);
  }
  return matrix;
}

/** Traffic-light colors (past/today only)
 * - No habits configured: neutral gray
 * - 0 done: red
 * - some done: yellow
 * - all done: green
 * Future days: forced white
 */
function trafficLightColor(count: number, max: number) {
  if (max <= 0) return '#f2f2f2';
  if (count <= 0) return '#ffdddd';
  if (count < max) return '#fff5cc';
  return '#d9f7d9';
}

// ----- Grid sizing: 20% smaller than natural full-width cells -----
const SCREEN_WIDTH = Dimensions.get('window').width;
// Keep these in sync with the grid wrapper's padding/gap:
const GRID_HPAD = 8;      // paddingHorizontal on grid wrapper
const GRID_GAP = 8;       // gap between cells
const GRID_CONTAINER_WIDTH = SCREEN_WIDTH - GRID_HPAD * 2;
// Natural full-size cell width if we used flex:1 would be:
// (GRID_CONTAINER_WIDTH - GRID_GAP*6) / 7
const BASE_CELL = (GRID_CONTAINER_WIDTH - GRID_GAP * 6) / 7;
// Make cells ~20% smaller than previous step:
const CELL = Math.floor(BASE_CELL * 0.8);

export default function Calendar() {
  const { state, isCompleted, toggleCompleteToday } = useHabits();

  // Month being displayed
  const [month, setMonth] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });

  // Selected day (controls the lower habit panel)
  const todayIso = todayISO();
  const [selectedISO, setSelectedISO] = useState<string>(todayIso);

  const matrix = useMemo(() => buildMonthMatrix(month), [month]);
  const habits = state.habits;
  const maxHabits = habits.length;

  const TODAY = new Date();
  const TODAY_START = startOfDay(TODAY);

  // Count completions per day in the visible grid
  const completionCountByISO = useMemo(() => {
    const map = new Map<string, number>();
    if (maxHabits === 0) return map;
    for (const row of matrix) {
      for (const cell of row) {
        const iso = isoFromDate(cell.date);
        let count = 0;
        for (const h of habits) {
          if (state.completions.some(c => c.habitId === h.id && c.date === iso)) count++;
        }
        map.set(iso, count);
      }
    }
    return map;
  }, [matrix, habits, state.completions, maxHabits]);

  const title = useMemo(
    () => month.toLocaleString(undefined, { month: 'long', year: 'numeric' }),
    [month]
  );

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const selectedNice = niceDate(selectedISO);

  const markAll = (iso: string, done: boolean) => {
    for (const h of habits) {
      const already = isCompleted(h.id, iso);
      if (done && !already) toggleCompleteToday(h.id, iso);
      if (!done && already) toggleCompleteToday(h.id, iso);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header with larger arrows + title */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable
          onPress={() => setMonth(m => addMonths(m, -1))}
          style={{
            width: 48, height: 48, borderRadius: 12,
            backgroundColor: '#f2f2f2', alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: '#e5e5e5',
          }}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
        >
          <Text style={{ fontSize: 26, fontWeight: '700' }}>{'‹'}</Text>
        </Pressable>

        <Text style={{ fontSize: 28, fontWeight: '800' }}>{title}</Text>

        <Pressable
          onPress={() => setMonth(m => addMonths(m, +1))}
          style={{
            width: 48, height: 48, borderRadius: 12,
            backgroundColor: '#f2f2f2', alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: '#e5e5e5',
          }}
          accessibilityRole="button"
          accessibilityLabel="Next month"
        >
          <Text style={{ fontSize: 26, fontWeight: '700' }}>{'›'}</Text>
        </Pressable>
      </View>

      {/* Weekday labels (centered) */}
      <View
        style={{
          flexDirection: 'row',
          alignSelf: 'center',
          width: GRID_CONTAINER_WIDTH,
          paddingHorizontal: GRID_HPAD,
          paddingBottom: 6,
          gap: GRID_GAP,
          justifyContent: 'center',
        }}
      >
        {weekdayLabels.map((w) => (
          <View key={w} style={{ width: CELL, alignItems: 'center', paddingVertical: 6 }}>
            <Text style={{ fontSize: 12, color: '#666', fontWeight: '600' }}>{w}</Text>
          </View>
        ))}
      </View>

      {/* Month grid (centered, fixed cell sizes) */}
      <View style={{ alignSelf: 'center', width: GRID_CONTAINER_WIDTH, paddingHorizontal: GRID_HPAD, gap: GRID_GAP }}>
        {matrix.map((week, wi) => (
          <View key={wi} style={{ flexDirection: 'row', gap: GRID_GAP, justifyContent: 'center' }}>
            {week.map((cell) => {
              const iso = isoFromDate(cell.date);
              const count = completionCountByISO.get(iso) ?? 0;

              const isFuture = startOfDay(cell.date).getTime() > TODAY_START.getTime();
              const bg = isFuture ? '#ffffff' : trafficLightColor(count, maxHabits);

              const dim = cell.inMonth ? 1 : 0.35;
              const isTodayCell = isSameDay(cell.date, TODAY);
              const isSelected = selectedISO === iso;

              return (
                <Pressable
                  key={iso}
                  disabled={isFuture}                       // ⛔️ can't click future days
                  onPress={() => setSelectedISO(iso)}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isFuture }}
                  style={{
                    width: CELL,
                    height: CELL,
                    borderRadius: 12,
                    borderWidth: isSelected ? 3 : (isTodayCell ? 2 : 1),
                    borderColor: isSelected ? '#111' : (isTodayCell ? '#2b7' : '#e3e3e3'),
                    backgroundColor: bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 4,
                    opacity: isFuture ? 0.9 : 1,          // subtle visual cue
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                    shadowOffset: { width: 0, height: 1 },
                  }}
                >
                  <Text style={{ fontSize: 18, fontWeight: '700', opacity: dim }}>
                    {cell.date.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 10 }}>
        <Legend color="#ffdddd" label="Missed" />
        <Legend color="#fff5cc" label="Partial" />
        <Legend color="#d9f7d9" label="Complete" />
      </View>

      {/* Bold divider */}
      <View style={{ height: 2, backgroundColor: '#000', marginTop: 12, marginHorizontal: 16 }} />

      {/* SELECTED DAY PANEL */}
      <View style={{ flex: 1, marginTop: 16, paddingHorizontal: 16, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: '800' }}>
            {selectedNice}
          </Text>

          {habits.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => markAll(selectedISO, true)}
                style={{ paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderRadius: 8, backgroundColor: '#eef9ee' }}
              >
                <Text style={{ fontWeight: '600' }}>Mark all</Text>
              </Pressable>
              <Pressable
                onPress={() => markAll(selectedISO, false)}
                style={{ paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderRadius: 8, backgroundColor: '#fff' }}
              >
                <Text style={{ fontWeight: '600' }}>Clear all</Text>
              </Pressable>
            </View>
          )}
        </View>

        {habits.length === 0 ? (
          <Text style={{ color: '#666' }}>No habits yet — add some on the Habits tab.</Text>
        ) : (
          <FlatList
            style={{ flex: 1 }}                               // take remaining space
            contentContainerStyle={{ paddingBottom: 24 }}      // breathing room at bottom
            data={habits}
            keyExtractor={(h) => h.id}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            // Web-like scroll behavior
            bounces={false}
            alwaysBounceVertical={false}
            overScrollMode="never"
            decelerationRate="normal"
            showsVerticalScrollIndicator
            contentInsetAdjustmentBehavior="never"
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const done = isCompleted(item.id, selectedISO);

              return (
                <Pressable
                  onPress={() => toggleCompleteToday(item.id, selectedISO)}  // tap anywhere toggles
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderRadius: 12,
                    backgroundColor: done ? '#bdf7bd' : '#fff',   // whole row turns green
                    borderColor: done ? '#9ad89a' : '#ccc',
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Toggle ${item.name} for ${selectedNice}`}
                >
                  {/* visual checkbox */}
                  <View
                    pointerEvents="none"
                    style={{
                      width: 28, height: 28, borderRadius: 6, borderWidth: 1,
                      alignItems: 'center', justifyContent: 'center',
                      backgroundColor: done ? '#bdf7bd' : 'transparent',
                      borderColor: done ? '#7bc47b' : '#aaa',
                    }}
                  >
                    <Text>{done ? '✅' : ''}</Text>
                  </View>

                  {/* habit name */}
                  <Text style={{ flex: 1, fontSize: 16 }}>{item.name}</Text>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: color, borderWidth: 1, borderColor: '#ddd' }} />
      <Text style={{ fontSize: 12, color: '#666' }}>{label}</Text>
    </View>
  );
}
