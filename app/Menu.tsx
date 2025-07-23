import { StyleSheet, Text, View, Image } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function MenuScreen() {
  const { user } = useAuth();
  return (
    <View style={styles.container}>
      {user.profileImage ? (
        <Image source={{ uri: user.profileImage }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder} />
      )}
      <Text style={styles.text}>{user.name || 'Menu Page'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 24, fontWeight: 'bold' },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 16 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ccc', marginBottom: 16 },
});
