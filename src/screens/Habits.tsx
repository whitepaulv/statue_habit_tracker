// src/screens/Habits.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Keyboard,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHabits } from '../store/HabitsContext';

const MAX_NAME_LEN = 25;

// Unified surface color so top/bottom grays match perfectly
const SURFACE   = '#F2F4F7';
const SCREEN_BG = SURFACE;
const CARD_BG   = '#FFFFFF';
const INK       = '#0F172A';
const MUTED     = '#6B7280';
const BORDER    = 'rgba(15,23,42,0.08)';
const RADIUS    = 14;

// Big accent palette (way more options)
const PALETTE = [
  '#22C55E','#16A34A','#059669','#10B981','#34D399','#84CC16','#65A30D','#4D7C0F',
  '#60A5FA','#3B82F6','#2563EB','#1D4ED8','#0EA5E9','#06B6D4','#0891B2','#0E7490',
  '#F59E0B','#D97706','#B45309','#F97316','#EA580C','#FB7185','#F43F5E','#E11D48',
  '#EF4444','#DC2626','#991B1B','#A78BFA','#8B5CF6','#7C3AED','#E879F9','#D946EF',
  '#C084FC','#9333EA','#FDE047','#FACC15','#FBBF24','#EAB308','#14B8A6','#0D9488',
  '#94A3B8','#64748B','#475569','#1F2937','#000000','#FFFFFF'
];

const hash = (s: string) => [...s].reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
const colorForHabit = (idOrName: string) => PALETTE[Math.abs(hash(idOrName)) % PALETTE.length];

export default function Habits() {
  const { state, addHabit, renameHabit, deleteHabit, toggleCompleteToday, isCompleted } = useHabits();
  const [newName, setNewName] = useState('');
  const [selColor, setSelColor] = useState<string>(PALETTE[0]);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);

  const norm = (s: string) => s.trim().toLowerCase();

  const sortedHabits = useMemo(
    () => [...state.habits].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [state.habits]
  );

  const tryAddHabit = async () => {
    const name = newName.trim();
    if (!name) return;

    if (name.length > MAX_NAME_LEN) {
      Alert.alert(`Error: habit names must be ${MAX_NAME_LEN} characters or fewer.`, undefined, [
        { text: 'OK', onPress: () => setNewName('') },
      ]);
      return;
    }

    const exists = state.habits.some(h => norm(h.name) === norm(name));
    if (exists) {
      Alert.alert('Error: habit already exists!', undefined, [
        { text: 'OK', onPress: () => setNewName('') },
      ]);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addHabit(name, selColor);
    setNewName('');
    Keyboard.dismiss();
  };

  const tryRenameHabit = (id: string, currentName: string) => {
    Haptics.selectionAsync();
    Alert.prompt(
      'Rename habit',
      'Enter a new name',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (txt) => {
            const next = (txt ?? '').trim();
            if (!next) return;

            if (next.length > MAX_NAME_LEN) {
              Alert.alert(`Error: habit names must be ${MAX_NAME_LEN} characters or fewer.`);
              return;
            }

            const exists = state.habits.some(h => h.id !== id && norm(h.name) === norm(next));
            if (exists) {
              Alert.alert('Error: habit already exists!');
              return;
            }

            await Haptics.selectionAsync();
            renameHabit(id, next);
          },
        },
      ],
      'plain-text',
      currentName
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: SCREEN_BG }}>
      {/* Top safe area filled with the same SURFACE color */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: SURFACE }}>
        <View
          style={{
            backgroundColor: SURFACE, // solid — exact match with the rest
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderBottomWidth: 2,           // thicker divider
            borderBottomColor: BORDER,
          }}
        >
          <Text style={{ fontSize: 40, fontWeight: '800', color: INK, textAlign: 'center' }}>
            Habits
          </Text>
        </View>
      </SafeAreaView>

      {/* Main content */}
      <SafeAreaView edges={['left','right','bottom']} style={{ flex: 1 }}>
        <View style={{ flex: 1, padding: 16, gap: 12 }}>
          {/* Input row */}
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: CARD_BG,
                borderWidth: 1,
                borderColor: BORDER,
                borderRadius: RADIUS,
                paddingHorizontal: 12,
                paddingVertical: 10,
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 3 },
                elevation: 1,
              }}
            >
              <MaterialCommunityIcons name="pencil-outline" size={18} color={MUTED} style={{ marginRight: 8 }} />
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="New habit name"
                placeholderTextColor={MUTED}
                maxLength={MAX_NAME_LEN}
                style={{ flex: 1, color: INK, fontSize: 16 }}
                onSubmitEditing={tryAddHabit}
                returnKeyType="done"
              />
            </View>

            {/* Color Picker Button */}
            <Pressable
              onPress={() => setColorPickerVisible(true)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: selColor,
                borderWidth: 1,
                borderColor: BORDER,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              accessibilityLabel="Pick habit color"
            >
              <MaterialCommunityIcons name="palette" size={18} color="#fff" />
            </Pressable>

            {/* Add Button */}
            <Pressable
              onPress={tryAddHabit}
              onPressIn={() => Haptics.selectionAsync()}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: RADIUS,
                backgroundColor: pressed ? '#16A34A' : '#22C55E',
                shadowColor: '#22C55E',
                shadowOpacity: 0.25,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 2,
              })}
              hitSlop={8}
              accessibilityLabel="Add habit"
            >
              <MaterialCommunityIcons name="plus" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800' }}>Add</Text>
            </Pressable>
          </View>

          {/* List */}
          <FlatList
            data={sortedHabits}
            keyExtractor={(h) => h.id}
            contentContainerStyle={{ paddingVertical: 6, gap: 10 }}
            renderItem={({ item }) => {
              const done = isCompleted(item.id);
              const accent = item.color ?? colorForHabit(item.id || item.name);

              return (
                <View
                  style={{
                    borderRadius: RADIUS,
                    backgroundColor: CARD_BG,
                    borderWidth: 1,
                    borderColor: BORDER,
                    shadowColor: '#000',
                    shadowOpacity: 0.06,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 2,
                    overflow: 'hidden',
                  }}
                >
                  {/* Left accent stripe */}
                  <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: accent }} />

                  <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, paddingLeft: 16 }}>
                    <Pressable
                      onPress={async () => {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        toggleCompleteToday(item.id);
                      }}
                      style={({ pressed }) => ({
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        opacity: pressed ? 0.9 : 1,
                      })}
                      accessibilityRole="button"
                      accessibilityLabel={`Toggle ${item.name}`}
                    >
                      <MaterialCommunityIcons
                        name={done ? 'check-circle' : 'checkbox-blank-circle-outline'}
                        size={22}
                        color={done ? '#16A34A' : MUTED}
                      />

                      <Text
                        style={{
                          flex: 1,
                          fontSize: 24,
                          fontWeight: '700',
                          color: INK,
                          marginRight: 12,
                        }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {item.name}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => tryRenameHabit(item.id, item.name)}
                      onPressIn={() => Haptics.selectionAsync()}
                      hitSlop={10}
                      accessibilityLabel="Edit habit"
                      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, paddingHorizontal: 4, paddingVertical: 2 })}
                    >
                      <MaterialCommunityIcons name="wrench" size={18} color={MUTED} />
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        Alert.alert('Delete habit?', `Delete "${item.name}"?`, [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => deleteHabit(item.id) },
                        ]);
                      }}
                      onPressIn={() => Haptics.selectionAsync()}
                      hitSlop={10}
                      accessibilityLabel="Delete habit"
                      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, paddingHorizontal: 4, paddingVertical: 2 })}
                    >
                      <MaterialCommunityIcons name="trash-can" size={18} color="#DC2626" />
                    </Pressable>
                  </View>

                  {done && (
                    <View pointerEvents="none" style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(34,197,94,0.06)' }} />
                  )}
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: 20, gap: 6 }}>
                <MaterialCommunityIcons name="emoticon-happy-outline" size={26} color={MUTED} />
                <Text style={{ color: MUTED }}>No habits yet — add one above.</Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>

      {/* Color Picker Modal (tap outside to dismiss) */}
      <Modal
        visible={colorPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setColorPickerVisible(false)}
      >
        {/* Outer overlay closes on press */}
        <Pressable
          onPress={() => setColorPickerVisible(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
          }}
          accessibilityLabel="Close color picker"
        >
          {/* Inner content captures press so it won't bubble to the overlay */}
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: CARD_BG,
              padding: 20,
              borderRadius: RADIUS,
              width: '90%',
              maxWidth: 420,
            }}
          >
            <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 12, color: INK }}>
              Pick a color
            </Text>

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                {PALETTE.map((c) => {
                  const selected = selColor === c;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => {
                        setSelColor(c);
                        Haptics.selectionAsync();
                        setColorPickerVisible(false);
                      }}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: c,
                        borderWidth: selected ? 3 : 1,
                        borderColor: selected ? INK : '#ccc',
                      }}
                      accessibilityLabel={`Choose color ${c}`}
                    />
                  );
                })}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
