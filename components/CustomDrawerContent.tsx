import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function CustomDrawerContent(props: any) {
  const router = useRouter();
  const { isDark } = useTheme();
  const { user } = useAuth();

  // User data (same as Profile.tsx)
  // const userName = 'Mina Torgah';
  // const userUsername = 'mina_torgah';

  // Simple color scheme for both modes
  const backgroundColor = isDark ? '#1a1a1a' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#000000';
  const iconColor = isDark ? '#6366F1' : '#6366F1';
  const dividerColor = isDark ? '#333333' : '#e0e0e0';
  const itemBackgroundColor = isDark ? '#2a2a2a' : '#f8f9fa';
  const headerBackgroundColor = isDark ? '#6366F1' : '#6366F1';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContainer}>
        {/* User Profile Header */}
        <TouchableOpacity style={styles.header} onPress={() => router.push('/(drawer)/Profile')}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {user.profileImage ? (
                <Image source={{ uri: user.profileImage }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={32} color={iconColor} />
                </View>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: textColor }]}>{user.name || 'Your Name'}</Text>
              <Text style={[styles.userUsername, { color: textColor, opacity: 0.7 }]}>@{user.username || 'username'}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: itemBackgroundColor }]} 
            onPress={() => router.push('/(drawer)/(tabs)')}
          >
            <Ionicons name="home" size={20} color={iconColor} />
            <Text style={[styles.menuText, { color: textColor }]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: itemBackgroundColor }]} 
            onPress={() => router.push('/(drawer)/(tabs)/projects')}
          >
            <Ionicons name="folder" size={20} color={iconColor} />
            <Text style={[styles.menuText, { color: textColor }]}>Projects</Text>
        </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: itemBackgroundColor }]} 
            onPress={() => router.push('/(drawer)/AIDesignScreen')}
          >
            <Ionicons name="sparkles" size={20} color={iconColor} />
            <Text style={[styles.menuText, { color: textColor }]}>AI Design Assistant</Text>
        </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: itemBackgroundColor }]}
          >
            <Ionicons name="albums" size={20} color={iconColor} />
            <Text style={[styles.menuText, { color: textColor }]}>Templates</Text>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: itemBackgroundColor }]} 
            onPress={() => router.push('/(drawer)/(tabs)/settings')}
          >
            <Ionicons name="settings" size={20} color={iconColor} />
            <Text style={[styles.menuText, { color: textColor }]}>Settings</Text>
        </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: itemBackgroundColor }]} 
            onPress={() => router.push('/(drawer)/Trash')}
          >
            <Ionicons name="trash" size={20} color={iconColor} />
            <Text style={[styles.menuText, { color: textColor }]}>Trash</Text>
        </TouchableOpacity>
        </View>
      </DrawerContentScrollView>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  profileSection: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    opacity: 0.7,
  },
  menuContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
  },
  divider: {
    height: 1,
    marginVertical: 16,
    marginHorizontal: 8,
  },
}); 