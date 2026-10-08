import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from '../api/client';

export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  role: Role;
  profileId?: string; // Maps to studentId or teacherId
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        if (token === 'mock-access-token') {
          // Restore mock session
          setUser({
            id: 'mock-teacher-1',
            email: 'teacher@rollsync.com',
            role: 'TEACHER',
            firstName: 'Reema',
            lastName: 'Angelin'
          });
        } else {
          try {
            const response = await apiClient.get('/auth/me');
            setUser(response.data);
          } catch (error) {
            console.error('Failed to restore session:', error);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
