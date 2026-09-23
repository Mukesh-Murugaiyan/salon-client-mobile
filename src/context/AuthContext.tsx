import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types/auth';
import { AuthService } from '../services/authService';
import { StorageService } from '../services/storage';
import { setUnauthorizedCallback } from '../services/apiClient';
import { setApiBaseUrl } from '../config/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleLogout = async () => {
    try {
      await AuthService.logout();
    } catch {} finally {
      await StorageService.clearSession();
      setUser(null);
      setToken(null);
    }
  };

  useEffect(() => {
    setUnauthorizedCallback(() => {
      setUser(null);
      setToken(null);
    });

    const initializeAuth = async () => {
      try {
        const savedApiUrl = await StorageService.getCustomApiUrl();
        if (savedApiUrl) {
          setApiBaseUrl(savedApiUrl);
        }

        const savedToken = await StorageService.getAuthToken();
        const savedUser = await StorageService.getUserData();

        if (savedToken) {
          setToken(savedToken);
          if (savedUser) {
            setUser(savedUser);
          }

          try {
            const verifiedUser = await AuthService.getMe();
            setUser(verifiedUser);
            await StorageService.saveUserData(verifiedUser);
          } catch (err: any) {
            if (err?.statusCode === 401) {
              await StorageService.clearSession();
              setUser(null);
              setToken(null);
            }
          }
        }
      } catch (error) {
        console.warn('[AuthContext] Failed to load stored session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const data = await AuthService.login(email, password);
    setToken(data.token);
    setUser(data.user);
    await StorageService.saveAuthToken(data.token);
    await StorageService.saveUserData(data.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
