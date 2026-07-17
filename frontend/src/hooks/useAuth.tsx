'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, APIError } from '../lib/api';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
  referralCode: string;
  referredBy?: string;
  rewardPoints: number;
  badgeLevel: string;
  bloodGroup?: string;
  allergies?: string;
  medicalNotes?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<UserProfile>;
  register: (details: any) => Promise<UserProfile>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUserLocal: (profile: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize and load user if token exists on mount
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('tw_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profile = await api.auth.getProfile();
        setUser(profile);
      } catch (err) {
        console.error('Failed to restore authentication session:', err);
        // Clear corrupt session
        localStorage.removeItem('tw_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (credentials: any): Promise<UserProfile> => {
    setLoading(true);
    try {
      const data = await api.auth.login(credentials);
      localStorage.setItem('tw_token', data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (details: any): Promise<UserProfile> => {
    setLoading(true);
    try {
      const data = await api.auth.register(details);
      localStorage.setItem('tw_token', data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('tw_token');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const profile = await api.auth.getProfile();
      setUser(profile);
    } catch (err) {
      console.error('Failed to sync profile status:', err);
    }
  };

  const updateUserLocal = (profileUpdates: Partial<UserProfile>) => {
    if (user) {
      setUser({ ...user, ...profileUpdates });
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        refreshUser,
        updateUserLocal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
