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
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { setIsAuthenticated } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

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

  // Simulate login for development when backend is not ready
  const simulateLogin = async () => {
    setLoading(true);
    setTimeout(async () => {
      setIsAuthenticated(true);
      await AsyncStorage.removeItem('hasShownTimeGoal').catch(console.error);
      router.replace('/(drawer)/(tabs)');
      setLoading(false);
    }, 1000); // Simulate network delay
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Error', 'Invalid email address');
      return;
    }

    setLoading(true);

    // Uncomment this block when backend is ready
    // try {
    //   const response = await fetch('http://Localhost:8080/api/auth/login', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ usernameOrEmail: email, password }),
    //   });
    //   const data = await response.json();
    //   if (response.ok && data.token) {
    //     setIsAuthenticated(true);
    //     AsyncStorage.removeItem('hasShownTimeGoal').catch(console.error);
    //     router.replace('/(drawer)/(tabs)'); // Navigate to tabs root (index)
    //   } else {
    //     Alert.alert('Login Failed', data.error || 'Invalid credentials');
    //   }
    // } catch (error) {
    //   Alert.alert('Network Error', 'Please try again later');
    // } finally {
    //   setLoading(false);
    // }

    // Simulate login for now
    simulateLogin();
  };

  const validateEmail = (value: string) => {
    const isValid = /\S+@\S+\.\S+/.test(value);
    setEmailError(isValid ? '' : 'Please enter a valid email address');
  };

  const validatePassword = (value: string) => {
    setPasswordError(value.length >= 6 ? '' : 'Password must be at least 6 characters');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardAvoidingView}
    >
      <SafeAreaView style={styles.safeArea}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{ position: 'absolute', top: 40, left: 10, zIndex: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color="#333" />
        </Pressable>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={styles.scrollView}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.wrapper}>
              <Image source={require('../../assets/images/Logo.png')} style={styles.logo} />

              <View style={styles.container}>
                <Text style={styles.title}>Login</Text>
                

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Firstame"
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor="#aaa"
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={value => {
                      setEmail(value);
                      validateEmail(value);
                    }}
                    placeholderTextColor="#aaa"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                  {emailError ? <Text style={{ color: 'red', marginBottom: 8 }}>{emailError}</Text> : null}
                  <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <TextInput
                      style={[styles.input, { flex: 1, marginBottom: 0 }]}
                      placeholder="Password"
                      value={password}
                      onChangeText={value => {
                        setPassword(value);
                        validatePassword(value);
                      }}
                      secureTextEntry={!showPassword}
                      placeholderTextColor="#aaa"
                      returnKeyType="done"
                    />
                    <TouchableOpacity
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
                    </TouchableOpacity>
                  </View>
                  {passwordError ? <Text style={{ color: 'red', marginBottom: 8 }}>{passwordError}</Text> : null}
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && { opacity: 0.6 }]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Login</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: '#F4F4FF',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F4FF',
  },
  scrollView: {
    flexGrow: 1,
  },
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F4FF',
  },
  container: {
    backgroundColor: '#F4F4FF',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    width: '90%',
    marginTop: -20,
    
  },
  logo: {
    width: 300,
    height: 100,
    marginTop: -120,
    marginBottom: 30,

  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#000',
    fontFamily: 'Montserrat_700Bold',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
  },
});