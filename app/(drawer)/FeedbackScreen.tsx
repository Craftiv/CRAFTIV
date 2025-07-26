import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const FeedbackScreen = () => {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = () => {
    if (!name || !message) {
      Alert.alert('Please fill in all fields.');
      return;
    }
    // Placeholder for submit logic
    Alert.alert('Thank you for your feedback!');
    setName('');
    setMessage('');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#23235B" />
      </TouchableOpacity>
      <Text style={styles.title}>Send Feedback</Text>
      <Text style={styles.subtitle}>We value your thoughts and suggestions.</Text>
      <TextInput
        style={styles.input}
        placeholder="Your Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Your Message"
        value={message}
        onChangeText={setMessage}
        multiline
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  backButton: { marginBottom: 8, alignSelf: 'flex-start' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 12, color: '#23235B' },
  subtitle: { fontSize: 16, color: '#6366F1', marginBottom: 24 },
  input: { backgroundColor: '#F3F4F6', borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 16, color: '#23235B' },
  button: { backgroundColor: '#6366F1', borderRadius: 10, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default FeedbackScreen; 