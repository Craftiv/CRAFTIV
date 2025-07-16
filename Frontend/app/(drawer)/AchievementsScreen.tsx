import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AchievementsScreen() {
  const router = useRouter();
  // Placeholder achievement data
  const achievement = {
    title: 'Achievement Unlocked!',
    description: 'You completed 5 sessions!',
    name: 'Design Sprint Master',
  };
  return (
    <LinearGradient
      colors={["#A78BFA", "#F7F4FF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBg}
    >
      <View style={styles.container}>
        <View style={styles.modal}>
          <Ionicons name="trophy-outline" size={64} color="#A78BFA" style={{ marginBottom: 18 }} />
          <Text style={styles.title}>{achievement.title}</Text>
          <Text style={styles.desc}>{achievement.description}</Text>
          <Text style={styles.name}>{achievement.name}</Text>
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.shareBtn}><Text style={styles.shareBtnText}>Share</Text></TouchableOpacity>
            <TouchableOpacity style={styles.okBtn} onPress={() => router.back()}><Text style={styles.okBtnText}>OK</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 36,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
    minWidth: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#23235B',
    marginBottom: 10,
    textAlign: 'center',
  },
  desc: {
    fontSize: 17,
    color: '#23235B',
    marginBottom: 6,
    textAlign: 'center',
  },
  name: {
    fontSize: 17,
    color: '#6366F1',
    fontWeight: 'bold',
    marginBottom: 22,
    textAlign: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  shareBtn: {
    backgroundColor: '#A78BFA',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginRight: 8,
    elevation: 2,
  },
  shareBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  okBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    elevation: 2,
  },
  okBtnText: {
    color: '#23235B',
    fontWeight: 'bold',
    fontSize: 17,
  },
}); 