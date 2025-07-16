import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LogsScreen() {
  const router = useRouter();
  // Placeholder logs data
  const logs = [
    { date: 'Today', entries: [
      { name: 'Design X', time: '00:30:15' },
      { name: 'Design Y', time: '00:20:00' },
    ]},
    { date: 'July 14', entries: [
      { name: 'Poster A', time: '00:25:00' },
      { name: 'Flyer B', time: '00:18:22' },
    ]},
  ];
  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#23235B" />
        </TouchableOpacity>
        <Text style={styles.title}>Your Design Logs</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView style={{ width: '100%' }} contentContainerStyle={{ padding: 20 }}>
        {logs.map((group, idx) => (
          <View key={group.date} style={{ marginBottom: 18 }}>
            <Text style={styles.dateLabel}>{group.date}</Text>
            {group.entries.map((entry, i) => (
              <View key={i} style={styles.logRow}>
                <Text style={styles.logName}>{entry.name}</Text>
                <Text style={styles.logTime}>{entry.time}</Text>
              </View>
            ))}
          </View>
        ))}
        <View style={styles.exportRow}>
          <TouchableOpacity style={styles.exportBtn}><Text style={styles.exportBtnText}>Export Logs</Text></TouchableOpacity>
          <TouchableOpacity style={styles.clearBtn}><Text style={styles.clearBtnText}>Clear History</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#23235B',
  },
  dateLabel: {
    fontSize: 15,
    color: '#6366F1',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  logName: {
    fontSize: 16,
    color: '#23235B',
  },
  logTime: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: 'bold',
  },
  exportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 12,
  },
  exportBtn: {
    backgroundColor: '#A78BFA',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  exportBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  clearBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  clearBtnText: {
    color: '#23235B',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 