import React, { useState } from 'react';
import { Pressable, SafeAreaView, StatusBar, View } from 'react-native';
import PagerView, { PagerViewOnPageSelectedEvent } from 'react-native-pager-view';

// Screens
import Calendar from './src/screens/Calendar';
import Habits from './src/screens/Habits';
// If you've already renamed the file to Stats.tsx, change this import accordingly:
import Stats from './src/screens/Stats';

// Global state provider (from the plan I sent)
import { HabitsProvider } from './src/store/HabitsContext';

export default function App() {
  const [page, setPage] = useState(0);

  const handlePageSelected = (e: PagerViewOnPageSelectedEvent) => {
    setPage(e.nativeEvent.position);
  };

  return (
    <HabitsProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <StatusBar />
        <View style={{ flex: 1 }}>
          <PagerView
            style={{ flex: 1 }}
            initialPage={0}
            onPageSelected={handlePageSelected}
          >
            <View key="habits" style={{ flex: 1 }}>
              <Habits />
            </View>
            <View key="calendar" style={{ flex: 1 }}>
              <Calendar />
            </View>
            <View key="stats" style={{ flex: 1 }}>
              <Stats />
            </View>
          </PagerView>

          {/* Dots indicator */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 10 }}>
            {[0, 1, 2].map((i) => (
              <Pressable
                key={i}
                onPress={() => setPage(i)}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: page === i ? '#222' : '#bbb',
                  marginHorizontal: 4,
                }}
                accessibilityRole="button"
                accessibilityLabel={`Go to page ${i + 1}`}
              />
            ))}
          </View>
        </View>
      </SafeAreaView>
    </HabitsProvider>
  );
}
