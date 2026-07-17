'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, APIError } from '../lib/api';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  avatarUrl?: string;
  referralCode: string;
  referredBy?: string;
  rewardPoints: number;
  badgeLevel: string;
  emailVerified?: boolean;
  bloodGroup?: string;
  allergies?: string;
  medicalNotes?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyRelationship?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  trekExperience?: string;
  fitnessLevel?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<UserProfile>;
  googleLogin: (credential: string, rememberMe?: boolean) => Promise<UserProfile>;
  register: (details: any) => Promise<UserProfile>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserLocal: (profile: Partial<UserProfile>) => void;
  resendVerification: (email: string) => Promise<void>;
  getSessions: () => Promise<any[]>;
  revokeSession: (id: string) => Promise<void>;
  uploadAvatar: (avatarBase64: string) => Promise<string>;
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
        localStorage.removeItem('tw_refresh');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    // Listen for silent-refresh failure logouts
    const handleLogoutEvent = () => {
      setUser(null);
    };

    window.addEventListener('tw-logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('tw-logout', handleLogoutEvent);
    };
  }, []);

  const login = async (credentials: any): Promise<UserProfile> => {
    setLoading(true);
    try {
      const data = await api.auth.login(credentials);
      localStorage.setItem('tw_token', data.token);
      if (data.refreshToken) {
        localStorage.setItem('tw_refresh', data.refreshToken);
      }
      setUser(data.user);
      return data.user;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (credential: string, rememberMe?: boolean): Promise<UserProfile> => {
    setLoading(true);
    try {
      const data = await api.auth.googleLogin(credential, rememberMe);
      localStorage.setItem('tw_token', data.token);
      if (data.refreshToken) {
        localStorage.setItem('tw_refresh', data.refreshToken);
      }
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
      // Registration returns success message & user info.
      // Do not automatically set user profile to logged in yet since they must verify email first.
      return data.user;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const oldRefreshToken = localStorage.getItem('tw_refresh');
      await api.auth.logout(oldRefreshToken || undefined);
    } catch (err) {
      console.error('Logout API call failed:', err);
    } finally {
      localStorage.removeItem('tw_token');
      localStorage.removeItem('tw_refresh');
      setUser(null);
    }
  };

  const logoutAll = async () => {
    try {
      await api.auth.logoutAll();
    } catch (err) {
      console.error('Logout all API call failed:', err);
    } finally {
      localStorage.removeItem('tw_token');
      localStorage.removeItem('tw_refresh');
      setUser(null);
    }
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

  const resendVerification = async (email: string) => {
    await api.auth.resendVerification(email);
  };

  const getSessions = async (): Promise<any[]> => {
    return await api.auth.getSessions();
  };

  const revokeSession = async (id: string) => {
    await api.auth.revokeSession(id);
  };

  const uploadAvatar = async (avatarBase64: string): Promise<string> => {
    const data = await api.auth.uploadAvatar(avatarBase64);
    if (user) {
      setUser({ ...user, avatarUrl: data.avatarUrl });
    }
    return data.avatarUrl;
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        googleLogin,
        register,
        logout,
        logoutAll,
        refreshUser,
        updateUserLocal,
        resendVerification,
        getSessions,
        revokeSession,
        uploadAvatar
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
