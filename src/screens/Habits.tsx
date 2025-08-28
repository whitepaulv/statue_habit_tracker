import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Keyboard,
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

// Design tokens
const SCREEN_BG = '#F2F4F7';
const CARD_BG   = '#FFFFFF';
const INK       = '#0F172A';
const MUTED     = '#6B7280';
const BORDER    = 'rgba(15,23,42,0.08)';
const RADIUS    = 14;

// Accent palette for selection + fallback hashing
const PALETTE = ['#22C55E','#60A5FA','#F59E0B','#F43F5E','#A78BFA','#06B6D4','#84CC16'];
const hash = (s: string) => [...s].reduce((a,c)=>((a<<5)-a+c.charCodeAt(0))|0,0);
const colorForHabit = (idOrName: string) => PALETTE[Math.abs(hash(idOrName)) % PALETTE.length];

export default function Habits() {
  const { state, addHabit, renameHabit, deleteHabit, toggleCompleteToday, isCompleted } = useHabits();
  const [newName, setNewName] = useState('');
  const [selColor, setSelColor] = useState<string>(PALETTE[0]); // chosen color for new habit

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
    addHabit(name, selColor);     // <-- save the color
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
    <SafeAreaView style={{ flex: 1, backgroundColor: SCREEN_BG }}>
      <StatusBar style="dark" backgroundColor={SCREEN_BG} />

      {/* Subtle full-width gradient header */}
      <LinearGradient
        colors={['#F8FAFF', '#EEF4FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingVertical: 18,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: BORDER,
        }}
      >
        <Text style={{ fontSize: 28, fontWeight: '800', color: INK, textAlign: 'center' }}>
          Habits
        </Text>
      </LinearGradient>

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

        {/* Color palette (compact, clean) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 2 }}>
          <Text style={{ color: MUTED, fontSize: 12, width: 42 }}>Color</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {PALETTE.map((c) => {
              const selected = selColor === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelColor(c);
                  }}
                  accessibilityLabel={`Select color ${c}`}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: c,
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? INK : 'rgba(0,0,0,0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selected && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
                </Pressable>
              );
            })}
          </ScrollView>
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
                {/* Left accent stripe uses saved color */}
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
  );
}
