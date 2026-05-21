import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';
import { setAuth, clearAuth, getUserProfile } from '@/utils/storage';

interface User {
  name: string | null;
  email: string | null;
  token: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInUser: (token: string, name: string, email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInUser: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session from storage
    getUserProfile()
      .then((profile) => {
        if (profile.token) {
          setUser(profile);
        }
      })
      .catch((err) => console.error('Failed to load profile:', err))
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const signInUser = async (token: string, name: string, email: string) => {
    await setAuth(token, name, email);
    setUser({ token, name, email });
  };

  const signOut = async () => {
    await clearAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInUser,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
