// App.tsx
import * as SystemUI from 'expo-system-ui';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StatusBar, View } from 'react-native';
import PagerView, { PagerViewOnPageSelectedEvent } from 'react-native-pager-view';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import Calendar from './src/screens/Calendar';
import Habits from './src/screens/Habits';
import Stats from './src/screens/Stats';

// Global state provider
import { HabitsProvider } from './src/store/HabitsContext';

// Single source of truth for the app's surface color
const SURFACE = '#F2F4F7';

export default function App() {
  // Habits is the middle page -> index 1
  const [page, setPage] = useState(1);
  const pagerRef = useRef<PagerView>(null);

  useEffect(() => {
    // Ensure OS-level background matches app surface
    SystemUI.setBackgroundColorAsync(SURFACE).catch(() => {});
  }, []);

  const handlePageSelected = (e: PagerViewOnPageSelectedEvent) => {
    setPage(e.nativeEvent.position);
  };

  const goTo = (i: number) => {
    setPage(i);
    pagerRef.current?.setPage(i);
  };

  return (
    <SafeAreaProvider>
      <HabitsProvider>
        {/* Android fills this color; iOS uses barStyle only */}
        <StatusBar barStyle="dark-content" backgroundColor={SURFACE} />

        {/* Root container uses the same SURFACE color everywhere */}
        <View style={{ flex: 1, backgroundColor: SURFACE }}>
          <PagerView
            ref={pagerRef}
            style={{ flex: 1 }}
            initialPage={1}                 // start on Habits (middle)
            onPageSelected={handlePageSelected}
          >
            {/* LEFT: Calendar (index 0) */}
            <View key="calendar" style={{ flex: 1 }}>
              <Calendar />
            </View>

            {/* MIDDLE: Habits (index 1) */}
            <View key="habits" style={{ flex: 1 }}>
              <Habits />
            </View>

            {/* RIGHT: Stats (index 2) */}
            <View key="stats" style={{ flex: 1 }}>
              <Stats />
            </View>
          </PagerView>

          {/* Dots indicator (left->right = Calendar, Habits, Stats) */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 10 }}>
            {[
              { i: 0, label: 'Calendar' },
              { i: 1, label: 'Habits' },
              { i: 2, label: 'Stats' },
            ].map(({ i, label }) => (
              <Pressable
                key={i}
                onPress={() => goTo(i)}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: page === i ? '#222' : '#bbb',
                  marginHorizontal: 4,
                }}
                accessibilityRole="button"
                accessibilityLabel={`Go to ${label}`}
              />
            ))}
          </View>
        </View>
      </HabitsProvider>
    </SafeAreaProvider>
  );
}
