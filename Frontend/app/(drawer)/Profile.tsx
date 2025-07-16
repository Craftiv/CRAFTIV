import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function Profile() {
  const { setIsAuthenticated, setProfileImage, profileImage } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();
  const [name, setName] = useState('Mina Torgah');
  const [username] = useState('mina_torgah');
  const [joined] = useState('Joined Jan 2024');
  const [email, setEmail] = useState('torgahdelamino@gmail.com');
  const [editingField, setEditingField] = useState<'name' | 'email' | null>(null); // 'name' or 'email'
  const [tempValue, setTempValue] = useState('');
  const [logoutPressed, setLogoutPressed] = useState(false);
  const [notifications, setNotifications] = useState(true);

  // Example stats
  const stats = [
    { label: 'Projects', value: 12 },
    { label: 'Time Spent', value: '18h' },
    { label: 'Achievements', value: 5 },
  ];

  const startEdit = (field: 'name' | 'email') => {
    setEditingField(field);
    setTempValue(field === 'name' ? name : email);
  };

  const saveEdit = () => {
    if (editingField === 'name') setName(tempValue);
    if (editingField === 'email') setEmail(tempValue);
    setEditingField(null);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      "You're doing a good job! Are you sure you want to log out?",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            setIsAuthenticated(false);
            router.replace('/(auth)/LogIn');
          },
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={isDark ? ['#23235B', '#6366F1'] : ['#A78BFA', '#F7F4FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBg}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        {/* Back Button and Title */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Your Profile</Text>
        </View>
        {/* Avatar and Edit Photo */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary, shadowColor: colors.text }]}> 
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImg} />
            ) : (
              <Ionicons name="person" size={54} color="#fff" />
            )}
            <TouchableOpacity style={styles.avatarEditOverlay} onPress={pickImage}>
              <Ionicons name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        {/* Name, Username, Joined */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, shadowColor: colors.text }]}> 
          <View style={styles.infoRow2}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Name</Text>
            {editingField === 'name' ? (
              <TextInput
                style={[styles.infoValue, { color: colors.text }]}
                value={tempValue}
                onChangeText={setTempValue}
                onBlur={saveEdit}
                autoFocus
              />
            ) : (
              <Text style={[styles.infoValue, { color: colors.text }]}>{name}</Text>
            )}
            <TouchableOpacity style={styles.editBtn} onPress={() => startEdit('name')}>
              <Ionicons name="pencil" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow2}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Username</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{username}</Text>
          </View>
          <View style={styles.infoRow2}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Joined</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{joined}</Text>
          </View>
        </View>
        {/* Email Row */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, shadowColor: colors.text }]}> 
          <View style={styles.infoRow2}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email address</Text>
            {editingField === 'email' ? (
              <TextInput
                style={[styles.infoValue, { color: colors.text }]}
                value={tempValue}
                onChangeText={setTempValue}
                onBlur={saveEdit}
                autoFocus
                keyboardType="email-address"
              />
            ) : (
              <Text style={[styles.infoValue, { color: colors.text }]}>{email}</Text>
            )}
            <TouchableOpacity style={styles.editBtn} onPress={() => startEdit('email')}>
              <Ionicons name="pencil" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        {/* Stats Row */}
        <View style={styles.statsRow}>
          {stats.map((stat, i) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.surface, shadowColor: colors.text }]}> 
              <Text style={[styles.statValue, { color: colors.primary }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>
        {/* Settings Card (only notifications) */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, shadowColor: colors.text }]}> 
          <View style={styles.settingsRow}>
            <Ionicons name="notifications" size={20} color={colors.primary} style={{ marginRight: 10 }} />
            <Text style={[styles.settingsLabel, { color: colors.text }]}>Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              thumbColor={notifications ? colors.primary : '#ccc'}
              trackColor={{ true: colors.secondary, false: '#ccc' }}
              style={{ marginLeft: 'auto' }}
            />
          </View>
        </View>
        {/* Logout Button at the bottom */}
        <View style={styles.logoutContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.logoutBtn,
              { backgroundColor: pressed || logoutPressed ? colors.primary : colors.surface, borderColor: colors.primary },
            ]}
            onPress={handleLogout}
            onPressIn={() => setLogoutPressed(true)}
            onPressOut={() => setLogoutPressed(false)}
          >
            <Ionicons name="log-out-outline" size={18} color={logoutPressed ? '#fff' : colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.logoutText, logoutPressed ? { color: '#fff' } : { color: colors.primary }]}>Logout</Text>
          </Pressable>
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
  },
  container: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 30,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(100,100,100,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 36, // to balance the back button
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
  },
  avatarImg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    resizeMode: 'cover',
  },
  avatarEditOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: '#6366F1',
    borderRadius: 14,
    padding: 4,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 2,
  },
  editPhotoBtn: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 8,
  },
  editPhotoText: {
    color: '#222',
    fontSize: 14,
  },
  infoCard: {
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 13,
    marginRight: 10,
    minWidth: 80,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    minWidth: 120,
    flex: 1,
  },
  editBtn: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginHorizontal: 0,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 14,
    gap: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  settingsLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 