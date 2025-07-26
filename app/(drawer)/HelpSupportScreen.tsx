import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const HelpSupportScreen = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={24} color="#23235B" />
      </TouchableOpacity>
      <Text style={styles.title}>Help & Support</Text>
      <Text style={styles.subtitle}>Contact support or visit our Help Center.</Text>
      <TouchableOpacity style={styles.button} onPress={() => Linking.openURL('https://craftiv.helpcenter.com')}>
        <Text style={styles.buttonText}>Visit Help Center</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => Linking.openURL('mailto:support@craftiv.com')}>
        <Text style={styles.buttonText}>Contact Support</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center' },
  backButton: { padding: 4, position: 'absolute', top: 24, left: 16, zIndex: 10 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 12, color: '#23235B' },
  subtitle: { fontSize: 16, color: '#6366F1', marginBottom: 24 },
  button: { backgroundColor: '#6366F1', borderRadius: 10, padding: 16, marginBottom: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default HelpSupportScreen; 