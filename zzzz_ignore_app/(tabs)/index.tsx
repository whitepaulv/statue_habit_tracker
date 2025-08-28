import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Habit = { id: string; name: string; completed: boolean };

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([
    { id: '1', name: 'Drink Water', completed: false },
    { id: '2', name: 'Exercise', completed: false },
  ]);

  const toggleHabit = (id: string) => {
    setHabits(prev => prev.map(h => (h.id === id ? { ...h, completed: !h.completed } : h)));
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => toggleHabit(item.id)} style={styles.habit}>
            <Text style={styles.habitText}>{item.completed ? '✅' : '⬜️'} {item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  habit: { padding: 16, marginVertical: 8, backgroundColor: '#f3f3f3', borderRadius: 12 },
  habitText: { fontSize: 18 },
});
