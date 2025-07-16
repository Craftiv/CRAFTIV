import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

// Mock deleted files/projects
const mockTrash = [
  { id: '1', name: 'Design X', type: 'Project', deletedAt: '2024-07-20', image: null },
  { id: '2', name: 'Flyer B', type: 'File', deletedAt: '2024-07-19', image: null },
];

export default function Trash() {
  const { colors, isDark } = useTheme();
  const [trash, setTrash] = useState(mockTrash);
  const router = useRouter();

  const handleRestore = (id: string) => {
    setTrash(trash.filter(item => item.id !== id));
    // In real app, restore logic here
  };

  const handleEmptyTrash = () => {
    Alert.alert('Empty Trash', 'Are you sure you want to permanently delete all items?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Empty', style: 'destructive', onPress: () => setTrash([]) },
    ]);
  };

  return (
    <LinearGradient
      colors={isDark ? ['#23235B', '#6366F1'] : ['#A78BFA', '#F7F4FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBg}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <View style={styles.headerRow}>
          <Ionicons name="trash" size={32} color={colors.primary} style={{ marginRight: 10 }} />
          <Text style={[styles.title, { color: colors.text }]}>Trash</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={handleEmptyTrash}>
            <Ionicons name="trash-bin" size={20} color={colors.error} />
            <Text style={[styles.emptyBtnText, { color: colors.error }]}>Empty</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>
        {trash.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-offline" size={48} color={colors.border} style={{ marginBottom: 16 }} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Trash is empty</Text>
          </View>
        ) : (
          <FlatList
            data={trash}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <View style={[styles.trashCard, { backgroundColor: colors.surface, shadowColor: colors.text }]}> 
                <Ionicons name={item.type === 'Project' ? 'folder' : 'document'} size={28} color={colors.primary} style={{ marginRight: 14 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.trashName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.trashMeta, { color: colors.textSecondary }]}>{item.type} • Deleted {item.deletedAt}</Text>
                </View>
                <TouchableOpacity style={styles.restoreBtn} onPress={() => handleRestore(item.id)}>
                  <Ionicons name="refresh" size={20} color={colors.success} />
                  <Text style={[styles.restoreText, { color: colors.success }]}>Restore</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 10,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  trashCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  trashName: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  trashMeta: {
    fontSize: 13,
    fontWeight: '500',
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 10,
  },
  restoreText: {
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  closeBtn: {
    marginLeft: 10,
    padding: 4,
  },
}); 