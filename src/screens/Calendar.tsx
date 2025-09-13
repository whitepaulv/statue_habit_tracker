// src/screens/Calendar.tsx
import React, { useMemo, useState } from 'react';
import { Dimensions, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
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
  if (max <= 0) return '#F2F4F7';
  if (count <= 0) return '#FFE5E5';
  if (count < max) return '#FFF4CC';
  return '#D9F7D9';
}

// ===== Design tokens (match Habits) =====
const SURFACE   = '#F2F4F7';
const CARD_BG   = '#FFFFFF';
const INK       = '#0F172A';
const MUTED     = '#6B7280';
const BORDER    = 'rgba(15,23,42,0.08)';
const RADIUS    = 14;

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
    <View style={{ flex: 1, backgroundColor: SURFACE }}>
      {/* Top safe area with unified SURFACE + solid header (thicker divider, big title) */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: SURFACE }}>
        <View
          style={{
            backgroundColor: SURFACE,
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderBottomWidth: 2,
            borderBottomColor: BORDER,
          }}
        >
          <Text style={{ fontSize: 40, fontWeight: '800', color: INK, textAlign: 'center' }}>
            Calendar
          </Text>
        </View>
      </SafeAreaView>

      {/* Main content safe areas */}
      <SafeAreaView edges={['left','right','bottom']} style={{ flex: 1 }}>
        {/* Month controls */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <PillButton label="‹" onPress={() => setMonth(m => addMonths(m, -1))} accessibilityLabel="Previous month" />
          <Text style={{ fontSize: 24, fontWeight: '800', color: INK }}>{title}</Text>
          <PillButton label="›" onPress={() => setMonth(m => addMonths(m, +1))} accessibilityLabel="Next month" />
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
              <Text style={{ fontSize: 12, color: MUTED, fontWeight: '700' }}>{w}</Text>
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
                const bg = isFuture ? CARD_BG : trafficLightColor(count, maxHabits);

                const dim = cell.inMonth ? 1 : 0.38;
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
                      borderColor: isSelected ? '#111' : (isTodayCell ? '#16A34A' : BORDER),
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
                    <Text style={{ fontSize: 18, fontWeight: '800', color: INK, opacity: dim }}>
                      {cell.date.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {/* Legend */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 12 }}>
          <Legend color="#FFE5E5" label="Missed" />
          <Legend color="#FFF4CC" label="Partial" />
          <Legend color="#D9F7D9" label="Complete" />
        </View>

        {/* Subtle divider (matches style language) */}
        <View style={{ height: 2, backgroundColor: BORDER, marginTop: 12, marginHorizontal: 16, borderRadius: 1 }} />

        {/* SELECTED DAY PANEL (card-like, smooth scroll) */}
        <View style={{ flex: 1, marginTop: 16, paddingHorizontal: 16, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: INK }}>
              {selectedNice}
            </Text>

            {habits.length > 0 && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <PillButton label="Mark all" onPress={() => markAll(selectedISO, true)} />
                <PillButton label="Clear all" onPress={() => markAll(selectedISO, false)} variant="secondary" />
              </View>
            )}
          </View>

          {habits.length === 0 ? (
            <Text style={{ color: MUTED }}>No habits yet — add some on the Habits tab.</Text>
          ) : (
            <FlatList
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 24 }}
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
                      borderRadius: RADIUS,
                      backgroundColor: done ? 'rgba(34,197,94,0.08)' : CARD_BG,
                      borderColor: done ? 'rgba(22,163,74,0.35)' : BORDER,
                      shadowColor: '#000',
                      shadowOpacity: 0.04,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 3 },
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
                        backgroundColor: done ? 'rgba(34,197,94,0.1)' : 'transparent',
                        borderColor: done ? 'rgba(22,163,74,0.5)' : 'rgba(0,0,0,0.2)',
                      }}
                    >
                      <Text>{done ? '✅' : ''}</Text>
                    </View>

                    {/* habit name */}
                    <Text style={{ flex: 1, fontSize: 16, color: INK }}>{item.name}</Text>
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

function PillButton({
  label,
  onPress,
  accessibilityLabel,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  variant?: 'primary' | 'secondary';
}) {
  const bg = variant === 'primary' ? '#FFFFFF' : '#FFFFFF';
  const border = variant === 'primary' ? BORDER : BORDER;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={{
        minWidth: 48,
        height: 40,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: border,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: '800', color: INK }}>{label}</Text>
    </Pressable>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: color, borderWidth: 1, borderColor: BORDER }} />
      <Text style={{ fontSize: 12, color: MUTED }}>{label}</Text>
    </View>
  );
}
