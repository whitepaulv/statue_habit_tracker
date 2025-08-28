import { StyleSheet, Text, View } from 'react-native';

export default function StatueScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.stage}>🗿 Stage 4</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  stage: { fontSize: 32, fontWeight: 'bold' },
});