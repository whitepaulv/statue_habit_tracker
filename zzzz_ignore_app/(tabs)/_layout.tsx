import React, { useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import PagerView from 'react-native-pager-view';

import CalendarScreen from './calendar';
import HabitsScreen from './index';
import StatueScreen from './statue';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function Layout() {
  const [page, setPage] = useState(0);

  return (
    <View style={{ flex: 1 }}>
      <PagerView
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={(e) => setPage(e.nativeEvent.position)}
      >
        <View key="1"><HabitsScreen /></View>
        <View key="2"><CalendarScreen /></View>
        <View key="3"><StatueScreen /></View>
      </PagerView>

      {/* Optional dots at bottom */}
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              page === i ? styles.activeDot : styles.inactiveDot
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#fff',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 5,
  },
  activeDot: { backgroundColor: '#333' },
  inactiveDot: { backgroundColor: '#ccc' },
});
