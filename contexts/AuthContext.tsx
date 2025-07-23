import { createContext, ReactNode, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserInfo {
  name: string;
  email: string;
  username: string;
  joined: string;
  profileImage: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (v: boolean) => void;
  user: UserInfo;
  setUser: (user: UserInfo) => void;
}

const defaultUser: UserInfo = {
  name: '',
  email: '',
  username: '',
  joined: '',
  profileImage: null,
};

const USER_STORAGE_KEY = 'auth_user';

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  setIsAuthenticated: () => {},
  user: defaultUser,
  setUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUserState] = useState<UserInfo>(defaultUser);

  // Load user from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (stored) {
          setUserState(JSON.parse(stored));
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Persist user to AsyncStorage whenever setUser is called
  const setUser = useCallback((user: UserInfo) => {
    setUserState(user);
    AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user)).catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 