import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const AboutScreen = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={24} color="#23235B" />
      </TouchableOpacity>
      <Image source={require('../../assets/images/Logo.png')} style={styles.logo} />
      <Text style={styles.title}>About Craftiv</Text>
      <Text style={styles.version}>Version 1.0.0</Text>
      <Text style={styles.description}>
        Craftiv is your all-in-one creative design studio. Effortlessly create, edit, and share stunning visuals, presentations, and more. Powered by AI and inspired by the world’s best design tools, Craftiv helps you bring your ideas to life—anytime, anywhere.
      </Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Features</Text>
        <Text style={styles.sectionItem}>• Craftiv design tools</Text>
        <Text style={styles.sectionItem}>• AI-powered design generation</Text>
        <Text style={styles.sectionItem}>• Craftiv design templates </Text>
        <Text style={styles.sectionItem}>• Rich text document editor</Text>
        <Text style={styles.sectionItem}>• Activity logs, achievements, and timer</Text>
        <Text style={styles.sectionItem}>• Google OAuth & email authentication</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact</Text>
        <Text style={styles.sectionItem}>support@craftiv.com</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', padding: 24, justifyContent: 'center' },
  backButton: { padding: 4, position: 'absolute', top: 24, left: 16, zIndex: 10 },
  logo: { width: 90, height: 90, marginBottom: 18, borderRadius: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#23235B', marginBottom: 4 },
  version: { fontSize: 14, color: '#6366F1', marginBottom: 18 },
  description: { fontSize: 16, color: '#23235B', textAlign: 'center', marginBottom: 24 },
  section: { width: '100%', marginBottom: 18 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#6366F1', marginBottom: 6 },
  sectionItem: { fontSize: 15, color: '#23235B', marginBottom: 2, marginLeft: 8 },
});

export default AboutScreen; 