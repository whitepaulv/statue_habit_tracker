// src/screens/Stats.tsx
import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHabits } from '../store/HabitsContext';

// ---- Design Tokens ----
const STATUE_BG = '#FAFAF7'; // sampled from statue image
const SCREEN_BG = STATUE_BG;
const CARD_BG   = STATUE_BG;
const INK       = '#0F172A';
const MUTED     = '#6B7280';
const BORDER    = 'rgba(15,23,42,0.08)';

// ---- Assets ----
const statueMap: Record<number, any> = {
  1: require('../../assets/statues/habit_tracker_statue_image_1.png'),
  2: require('../../assets/statues/habit_tracker_statue_image_2.png'),
  3: require('../../assets/statues/habit_tracker_statue_image_3.png'),
  4: require('../../assets/statues/habit_tracker_statue_image_4.png'),
  5: require('../../assets/statues/habit_tracker_statue_image_5.png'),
  6: require('../../assets/statues/habit_tracker_statue_image_6.png'),
};

// ---- Date helpers ----
function pad2(n: number) { return String(n).padStart(2, '0'); }
function isoFromDate(d: Date) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function addDays(d: Date, delta: number) { const nd = new Date(d); nd.setDate(nd.getDate() + delta); return nd; }

export default function Stats() {
  const { height, width } = useWindowDimensions();
  const { state, isCompleted } = useHabits();

  const totalHabits = state.habits.length;
  const todayIso = isoFromDate(new Date());

  // Count today's completions
  const { pctToday } = useMemo(() => {
    if (totalHabits === 0) return { pctToday: 0 };
    let done = 0;
    for (const h of state.habits) {
      if (isCompleted(h.id, todayIso)) done++;
    }
    const pct = Math.round((done / totalHabits) * 100);
    return { pctToday: pct };
  }, [state.habits, state.completions, totalHabits, isCompleted]);

  // Determine statue stage progression
  const { stage, perfectDays } = useMemo(() => {
    let stage = 1;
    let perfectDays = 0;

    const allDates = Array.from(new Set(state.completions.map(c => c.date))).sort();

    for (const date of allDates) {
      let done = 0;
      for (const h of state.habits) if (isCompleted(h.id, date)) done++;
      const pct = totalHabits > 0 ? (done / totalHabits) * 100 : 0;

      if (pct === 100) {
        stage = Math.min(6, stage + 1);
        perfectDays++;
      } else if (pct >= 50) {
        stage = stage;
      } else {
        stage = Math.max(1, stage - 1);
      }

      if (stage === 6 && pct < 100) {
        stage = 5;
      }
    }

    return { stage, perfectDays };
  }, [state.completions, state.habits, isCompleted, totalHabits]);

  const empty = totalHabits === 0;

  return (
    <View style={{ flex: 1, backgroundColor: SCREEN_BG }}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: SCREEN_BG }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Statue</Text>
        </View>
      </SafeAreaView>

      {/* Content */}
      <SafeAreaView edges={['left','right','bottom']} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* FULL-SCREEN HERO */}
          <View
            style={[styles.hero, { minHeight: height - 140 }]}
            accessibilityLabel="Current statue stage"
          >
            {empty ? (
              <>
                <Text style={styles.heroStage}>No habits yet</Text>
                <Text style={styles.heroSub}>Add a habit on the middle tab to start sculpting.</Text>
              </>
            ) : (
              <>
                <Image
                  source={statueMap[stage]}
                  style={{
                    width: width * 0.9,   // nearly full width
                    height: height * 0.75, // most of the screen height
                    marginBottom: 16,
                  }}
                  resizeMode="contain"
                />
                <Text style={styles.heroStage}>{`Stage ${stage}`}</Text>
                {stage === 6 && (
                  <Text style={styles.heroSub}>
                    Perfect days: {perfectDays}
                  </Text>
                )}
              </>
            )}
          </View>

          {/* ONE-LINE PERCENTAGE */}
          <View style={styles.lineItem}>
            <Text style={styles.lineItemText}>
              {empty
                ? 'Today: —'
                : `Today’s completion: ${pctToday}%`}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: BORDER,
  },
  headerTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: INK,
    textAlign: 'center',
  },

  hero: {
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 20,
  },
  heroStage: {
    fontSize: 28,
    fontWeight: '800',
    color: INK,
    textAlign: 'center',
  },
  heroSub: {
    marginTop: 6,
    color: MUTED,
    textAlign: 'center',
  },

  lineItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  lineItemText: {
    color: INK,
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
});
