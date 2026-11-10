import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from '../api/client';
import { supabase } from '../lib/supabase';

export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';
export interface User {
  id: string;
  authUserId: string;
  email: string;
  role: Role;
  profileId?: string;
  firstName?: string;
  lastName?: string;
}
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const restore = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const response = await apiClient.get<User>('/auth/me');
          if (response.data.role !== 'TEACHER') {
            await supabase.auth.signOut();
            throw new Error('This portal is available to teacher accounts only.');
          }
          if (mounted) setUser(response.data);
        }
      } catch (error) {
        console.error('Failed to restore RollSync session:', error);
        await supabase.auth.signOut();
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void restore();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      // Avoid awaiting network work inside Supabase's auth event callback.
      window.setTimeout(() => {
        void apiClient.get<User>('/auth/me')
          .then(async response => {
            if (response.data.role !== 'TEACHER') {
              await supabase.auth.signOut();
              throw new Error('This portal is available to teacher accounts only.');
            }
            if (mounted) setUser(response.data);
          })
          .catch(async error => {
            console.error('Unable to load RollSync profile:', error);
            await supabase.auth.signOut();
            if (mounted) setUser(null);
          })
          .finally(() => { if (mounted) setIsLoading(false); });
      }, 0);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(), password,
    });
    if (error) throw error;
    if (!data.session) throw new Error('No active Supabase session was returned.');
    try {
      const response = await apiClient.get<User>('/auth/me');
      if (response.data.role !== 'TEACHER') {
        await supabase.auth.signOut();
        throw new Error('This portal is available to teacher accounts only.');
      }
      setUser(response.data);
      return response.data;
    } catch (error) {
      await supabase.auth.signOut();
      throw error;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.assign('/login');
  };

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
