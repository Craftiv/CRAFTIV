import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
// Remove import { apiFetch } from '../constants/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

export default function EmailAuth() {
  const router = useRouter();
  const { setIsAuthenticated, setUser } = useAuth();
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.push('/Splash');
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [router])
  );

  const handleSignUp = async () => {
    // 1. Validation
    if (!firstname || !lastname || !email || !password) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Invalid email address');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      Alert.alert(
        'Weak Password',
        'Password must be 8+ characters and include a capital letter, number, and special character'
      );
      return;
    }

    setLoading(true);
    try {
      // Try different URLs based on platform and environment
      let backendUrl;
      backendUrl = 'http://10.132.53.119:8081/api/auth/register';
      console.log('Platform:', Platform.OS);
      console.log('Backend URL:', backendUrl);
      console.log('Attempting to connect to backend...');
      const response = await fetch('http://10.132.53.119:8081/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstname,
          lastname,
          email,
          password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Backend connected: Signup successful response received');
        Alert.alert('Success', 'Account created!');
        setIsAuthenticated(true);
        // Save user info to context
        const username = `${firstname.trim().toLowerCase()}_${lastname.trim().toLowerCase()}`;
        const joined = `Joined ${format(new Date(), 'MMM yyyy')}`;
        setUser({
          name: `${firstname} ${lastname}`.trim(),
          email,
          username,
          joined,
          profileImage: null,
        });
        AsyncStorage.removeItem('hasShownTimeGoal').catch(console.error);
        router.replace('/(drawer)/(tabs)');
      } else {
        Alert.alert('Signup Failed', data.error || 'Something went wrong');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Network Error', 'Could not reach the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.wrapper}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable
        onPress={() => {
          if (router.canGoBack && router.canGoBack()) {
            router.back();
          } else {
            router.push('/Splash');
          }
        }}
        hitSlop={10}
        style={{ position: 'absolute', top: 40, left: 10, zIndex: 10 }}
      >
        <Ionicons name="chevron-back" size={28} color="#333" />
      </Pressable>
      <View><Image source={require('../../assets/images/Logo.png')} style={styles.logo} />
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>Sign Up</Text>

        {/* Inputs */}
        <TextInput
          placeholder="First Name"
          value={firstname}
          onChangeText={setFirstname}
          style={styles.input}
          placeholderTextColor="#999"
          accessibilityLabel="First name input"
          textContentType="givenName"
        />
        <TextInput
          placeholder="Last Name"
          value={lastname}
          onChangeText={setLastname}
          style={styles.input}
          placeholderTextColor="#999"
          accessibilityLabel="Last name input"
          textContentType="familyName"
        />
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholderTextColor="#999"
          keyboardType="email-address"
          accessibilityLabel="Email input"
          textContentType="emailAddress"
        />
        <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholderTextColor="#999"
            secureTextEntry={!showPassword}
            accessibilityLabel="Password input"
            textContentType="password"
          />
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)}
            onPressIn={() => Keyboard.dismiss()}
            hitSlop={10}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={22}
              color="#999"
              style={{ marginLeft: -35, marginRight: 10 }}
            />
          </Pressable>
        </View>

            <Pressable
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </Pressable>


        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Text style={styles.link} onPress={() => router.push('/(auth)/LogIn2')}>
            Login
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexGrow: 1,
    backgroundColor: '#F4F4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    backgroundColor: '#F4F4FF',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    marginTop: -20,
  },
  logo: {
    width: 300,
    height: 100,
    marginTop: -30,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    marginBottom: 15,
    fontSize: 16,
    color: '#000',
  },
  button: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: '#6366F1',
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: 'Montserrat_700Regular',
  },
  footerText: {
    marginTop: 20,
    fontSize: 13,
    color: '#444',
    fontFamily: 'Montserrat_400Regular',
  },
  link: {
    color: '#6366F1',
    fontWeight: '500',
    fontSize: 18,
    fontFamily: 'Montserrat_700Regular',
  },
});
