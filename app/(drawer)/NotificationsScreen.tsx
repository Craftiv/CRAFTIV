import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const NotificationsScreen = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={24} color="#23235B" />
      </TouchableOpacity>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>Manage your notification preferences.</Text>
      {/* Add notification toggles/options here in the future */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center' },
  backButton: { padding: 4, position: 'absolute', top: 24, left: 16, zIndex: 10 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 12, color: '#23235B', marginTop: 48 },
  subtitle: { fontSize: 16, color: '#6366F1' },
});

export default NotificationsScreen; 