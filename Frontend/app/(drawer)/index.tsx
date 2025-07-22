import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as Google from 'expo-auth-session/providers/google';
import { Link, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { jwtDecode } from 'jwt-decode';
import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_KEYS } from '../../constants/apiKeys';

WebBrowser.maybeCompleteAuthSession();
const navigation=useNavigation;

type UserInfo = {
  name: string;
  email: string;
};

export default function SignUpScreen() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: API_KEYS.GOOGLE_CLIENT_ID,
    responseType: 'id_token',
    scopes: ['openid', 'profile', 'email'],
  });

  const handleGoogleSignIn = async () => {
    try {
      const result = await promptAsync();

      if (result.type === 'success' && result.params?.id_token) {
        const idToken = result.params.id_token;

        try {
          // (Optional) decode token if you want to show profile info immediately
          const decoded: UserInfo = jwtDecode(idToken);
          setUserInfo(decoded);
          setErrorMsg(null);

          // Send token to your backend for sign-in/sign-up
          const backendResponse = await fetch('http://10.132.53.119:8080/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });

          if (!backendResponse.ok) {
            const errorData = await backendResponse.json();
            throw new Error(errorData.message || 'Authentication failed');
          }

          const data = await backendResponse.json();
          console.log('✅ Backend connected: Google login successful response received');

          // Save user token from backend
          await AsyncStorage.setItem('userToken', data.token);
          await AsyncStorage.removeItem('hasShownTimeGoal'); // Optional cleanup

          Alert.alert('Success', 'Logged in with Google!');
          router.replace('/(drawer)/(tabs)'); // Redirect to home/dashboard
        } catch (error: any) {
          console.error('Backend auth error:', error);
          Alert.alert('Authentication Failed', error.message);
        }
      } else if (result.type === 'error') {
        Alert.alert('Google Sign-In Error', 'Authentication failed.');
      } else if (result.type === 'cancel') {
        Alert.alert('Cancelled', 'Google sign-in was cancelled.');
      }
    } catch (err) {
      Alert.alert('Google Sign-In Error', 'Popup was blocked or failed to open. Please allow popups and try again.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
       
        <Text style={styles.title}>Sign Up</Text>
      </View>

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Join Craftiv</Text>
        <Text style={styles.welcomeSubtitle}>Create your account to start designing</Text>
      </View>

      {/* Sign Up Options */}
      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
          <Image
            source={require('../../assets/images/google.png')}
            style={styles.googleIcon}
          />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.emailButton} onPress={() => router.replace('/(auth)/SignUpfill')}>
          <Ionicons name="mail-outline" size={24} color="#6366F1" />
          <Text style={styles.emailButtonText}>Continue with Email</Text>
        </TouchableOpacity>
      </View>

      {/* Error Message */}
      {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

      {/* Login Link */}
      <View style={styles.loginSection}>
        <Text style={styles.loginText}>
          Already have an account?{' '}
          <Link href="/(auth)/LogIn2" style={styles.link}>Sign In</Link>
        </Text>
      </View>

      {/* Terms */}
      <View style={styles.termsContainer}>
        <Text style={styles.termsText}>
          By continuing you agree to Craftiv's{' '}
          <Text style={styles.link}>Terms of Use</Text> and{' '}
          <Text style={styles.link}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  welcomeSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 60,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emailButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 12,
  },
  errorText: {
    color: '#E74C3C',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  loginSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  link: {
    color: '#6366F1',
    fontWeight: '600',
  },
  termsContainer: {
    paddingBottom: 40,
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
    lineHeight: 18,
  },
});
