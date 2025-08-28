import React, { useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useHabits } from '../store/HabitsContext';

export default function Habits() {
  const { state, addHabit, renameHabit, deleteHabit, toggleCompleteToday, isCompleted } = useHabits();
  const [newName, setNewName] = useState('');

  return (
    <View style={{ flex: 1, padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>Habits</Text>

      {/* Add new habit */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={newName}
          onChangeText={setNewName}
          placeholder="New habit name"
          style={{ flex: 1, borderWidth: 1, borderRadius: 8, padding: 10 }}
          onSubmitEditing={() => {
            const name = newName.trim();
            if (name) { addHabit(name); setNewName(''); }
          }}
        />
        <Pressable
          onPress={() => {
            const name = newName.trim();
            if (name) { addHabit(name); setNewName(''); }
          }}
          style={{ paddingHorizontal: 14, justifyContent: 'center', borderWidth: 1, borderRadius: 8 }}
        >
          <Text>Add</Text>
        </Pressable>
      </View>

      {/* List */}
      <FlatList
        data={state.habits}
        keyExtractor={(h) => h.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => {
          const done = isCompleted(item.id);
          return (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1, borderRadius: 10 }}>
              <Pressable
                onPress={() => toggleCompleteToday(item.id)}
                style={{
                  width: 28, height: 28, borderWidth: 1, borderRadius: 6,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: done ? '#bdf7bd' : 'transparent',
                }}
              >
                <Text>{done ? '✅' : ''}</Text>
              </Pressable>

              <Text style={{ flex: 1, fontSize: 16 }}>{item.name}</Text>

              <Pressable
                onPress={() => {
                  Alert.prompt('Rename habit', 'Enter a new name', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Save', onPress: (txt) => txt && renameHabit(item.id, txt.trim()) }
                  ], 'plain-text', item.name);
                }}
                style={{ paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderRadius: 8 }}
              >
                <Text>Edit</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Alert.alert('Delete habit?', `Delete "${item.name}"?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteHabit(item.id) }
                  ]);
                }}
                style={{ paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderRadius: 8 }}
              >
                <Text>Delete</Text>
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={<Text>No habits yet — add one above.</Text>}
      />
    </View>
  );
}
