import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../../types';
import { getCurrentUser, setCurrentUser as setApiCurrentUser, listUsers } from '../api';
import { supabase } from '../supabase/client';
import { isSupabaseConfigured } from '../api/supabaseApi';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  switchUser: (userId: string) => Promise<void>;
  allUsers: User[];
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  switchUser: async () => {},
  allUsers: [],
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      const usersList = await listUsers();
      setCurrentUser(user);
      setAllUsers(usersList);
    } catch (err) {
      console.error('Failed to load auth user', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();

    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, _session) => {
        const user = await getCurrentUser();
        const usersList = await listUsers();
        setCurrentUser(user);
        setAllUsers(usersList);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const switchUser = async (userId: string) => {
    setLoading(true);
    try {
      const user = await setApiCurrentUser(userId);
      setCurrentUser(user);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    const user = await getCurrentUser();
    const usersList = await listUsers();
    setCurrentUser(user);
    setAllUsers(usersList);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, switchUser, allUsers, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
