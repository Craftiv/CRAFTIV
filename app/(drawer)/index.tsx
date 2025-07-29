import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { Link, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_KEYS } from '../../constants/apiKeys';

// Complete any existing auth sessions
WebBrowser.maybeCompleteAuthSession();

const redirectUri = 'https://auth.expo.io/@sackey07/Craftiv';

console.log("Redirect URI:", redirectUri);

type UserInfo = {
  name: string;
  email: string;
};

export default function SignUpScreen() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: API_KEYS.GOOGLE_CLIENT_ID,
    responseType: 'token', // Changed to token to avoid some issues
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
  });

  // Monitor response changes
  useEffect(() => {
    if (response) {
      console.log('=== RESPONSE EFFECT TRIGGERED ===');
      console.log('Response:', response);
      console.log('Response type:', response.type);
      
      if (response.type === 'success') {
        const params = (response as any).params;
        console.log('Response params:', params);
        
        if (params?.access_token) {
          console.log('Found access_token in response effect!');
          // Fetch user info using the access token
          fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${params.access_token}` },
          })
          .then(res => res.json())
          .then(userInfo => {
            console.log('User info from API:', userInfo);
            setUserInfo(userInfo);
            setErrorMsg(null);
            Alert.alert('Success', `Logged in as ${userInfo.name}`);
            router.replace('/(drawer)/(tabs)');
          })
          .catch(error => {
            console.error('Error fetching user info:', error);
            Alert.alert('Error', 'Failed to fetch user information.');
          });
        } else if (params?.id_token) {
          console.log('Found id_token in response effect!');
          try {
            const decoded: UserInfo = jwtDecode(params.id_token);
            console.log('Successfully decoded user info:', decoded);
            setUserInfo(decoded);
            setErrorMsg(null);
            Alert.alert('Success', `Logged in as ${decoded.name}`);
            router.replace('/(drawer)/(tabs)');
          } catch (decodeError) {
            console.error('JWT decode error in effect:', decodeError);
          }
        }
      } else if (response.type === 'error') {
        console.log('Response error:', response);
        Alert.alert('Error', 'Authentication failed. Please try again.');
      }
    }
  }, [response]);

  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    console.log('Starting Google sign-in...');

    try {
      // ======= BACKEND CONNECTION CODE COMMENTED OUT =======
      // const backendUrl = getBackendUrl();
      // const response = await fetch(`${backendUrl}/api/auth/google/url`);
      // const data = await response.json();
      // const authUrl = data.authUrl;
      // const result = await WebBrowser.openAuthSessionAsync(authUrl, `${backendUrl}/api/auth/google/callback`);
      // if (result.type === 'success' && result.url) { ... }
      // else if (result.type === 'cancel') { ... }
      // else { ... }

      // ======= SIMULATE SUCCESSFUL GOOGLE SIGN-IN =======
      setTimeout(() => {
        setUserInfo({ name: 'Demo User', email: 'demo@example.com' });
        setErrorMsg(null);
        Alert.alert('Success', 'Logged in as Demo User');
        router.replace('/(drawer)/(tabs)');
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      // Commented out backend error handling
      // console.error('Google sign-in error:', err);
      // Alert.alert('Error', 'Something went wrong with sign-in. Please try again.');
      setIsLoading(false);
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
        <TouchableOpacity 
          style={[styles.googleButton, isLoading && styles.googleButtonDisabled]} 
          onPress={handleGoogleSignIn}
          disabled={isLoading}
        >
          <Image
            source={require('../../assets/images/google.png')}
            style={styles.googleIcon}
          />
          <Text style={styles.googleButtonText}>
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </Text>
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
  googleButtonDisabled: {
    opacity: 0.7,
    backgroundColor: '#E0E0E0',
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
