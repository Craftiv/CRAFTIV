import { AntDesign, FontAwesome, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as Google from 'expo-auth-session/providers/google';
import { useFocusEffect, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { jwtDecode } from 'jwt-decode';
import { useCallback, useState } from 'react';
import { Alert, BackHandler, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_KEYS } from '../../constants/apiKeys';

WebBrowser.maybeCompleteAuthSession();
const navigation=useNavigation;

type UserInfo = {
  name: string;
  email: string;
};


export default function () {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: API_KEYS.GOOGLE_CLIENT_ID, // Use imported client ID
    responseType: 'id_token',
    scopes: ['openid', 'profile', 'email'],
  });
   const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    const result = await promptAsync();
    if (result.type === 'success' && result.params?.id_token) {
      try {
        const idToken = result.params.id_token;
        const decoded: UserInfo = jwtDecode(idToken);
        setUserInfo(decoded);
        // Send the id_token to your backend
        await sendIdTokenToBackend(idToken);
      } catch (err) {
        console.error('Token decode error:', err);
        setErrorMsg('Failed to decode token');
        Alert.alert('Google Sign-In Error', 'Failed to decode ID token.');
      }
    } else if (result.type === 'cancel') {
      setErrorMsg('Sign-in cancelled.');
      Alert.alert('Google Sign-In', 'Sign-in cancelled.');
    } else if (result.type === 'error') {
      setErrorMsg('Authentication failed');
      Alert.alert('Google Sign-In Error', 'Authentication failed.');
    }
  };

  const sendIdTokenToBackend = async (idToken: string) => {
    try {
      const backendResponse = await fetch('http://Localhost:8081/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (!backendResponse.ok) {
        const errorData = await backendResponse.json();
        throw new Error(errorData.message || 'Failed to authenticate with backend');
      }
      const data = await backendResponse.json();
      await AsyncStorage.setItem('userToken', data.token);
      // Clear the time goal popup flag so it shows after login
      await AsyncStorage.removeItem('hasShownTimeGoal');
      Alert.alert('Success', 'Logged in with Google!');
      router.replace('/(drawer)/(tabs)');
    } catch (error: any) {
      console.error('Backend authentication error:', error);
      setErrorMsg(error.message);
      Alert.alert('Authentication Failed', error.message);
    }
  };

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

  return (
    <View style={styles.container}>
      <View style={{display: 'flex' , flexDirection: 'row' , top:30}}>
        <TouchableOpacity onPress={()=> router.back()}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Continue to sign in for free</Text>
        
      </View>
      

      <TouchableOpacity style={styles.button} onPress={()=> Alert.alert("Comming soon", "apple sig-in is coming soon")}>
        <AntDesign name="apple1" size={24} color="black" />
        <Text style={styles.buttonText}>Continue with Apple</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleGoogleSignIn}>
  <Image
    source={require('../../assets/images/google.png')} // place the image in your assets folder
    style={{ width: 28, height: 28, marginRight: 8 }}
  />
  <Text style={styles.buttonText}>Continue with Google</Text>
</TouchableOpacity>

      

      {userInfo && (
        <Text style={{ marginTop: 20 }}>
          Welcome, {userInfo.name} ({userInfo.email})
        </Text>
      )}

      {errorMsg && <Text style={{ color: 'red' }}>{errorMsg}</Text>}
   
  

      

      <TouchableOpacity style={styles.button} onPress={()=> Alert.alert("Coming soon", "Facebook sign-in is coming soon")}>
        <FontAwesome name="facebook" size={24} color="#1877F2" />
        <Text style={styles.buttonText}>Continue with Facebook</Text>
      </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={() => router.push('/(auth)/LogIn')}>
        <Ionicons name="mail-outline" size={24} color="black" />
        <Text style={styles.buttonText}>Continue with email</Text>
      </TouchableOpacity>

      

      <Text style={styles.terms}>
        By continuing you agree to Craftiv's <Text style={styles.link}>Terms of Use</Text>. Read our{" "}
        <Text style={styles.link}>Privacy Policy</Text>
      </Text>
    </View>

    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    paddingTop: 50,
    
  },
  title: {
    fontSize: 18,
    marginBottom: 30,
    fontWeight: 'bold',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    borderRadius: 8,
    marginVertical: 8,
    justifyContent: 'flex-start',
   gap: '10%',
  },
  buttonText: {
    marginLeft: 10,
    fontSize: 16,
  },
  loginText: {
    marginTop: 30,
    textAlign: 'center',
    fontSize: 14,
  },
  link: {
    color: '#6366F1',
    fontFamily: 'Montserrat_700Bold',
  },
  terms: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 15,
    color: '#555',
  },
});
