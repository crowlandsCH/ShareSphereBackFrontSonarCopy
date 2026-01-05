import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, register as apiRegister, getToken, removeToken } from '../api/auth';

import { jwtDecode } from 'jwt-decode';

export function decodeJWT(token:  string): any {
  try {
    return jwtDecode(token);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}


interface User {
  id: string;
  username: string;
  displayName: string;
  shareholderId?:  number;  // Optional: Only users have this!
  roles: string[];
  token: string;
  isAdmin: boolean;
  isUser:  boolean;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register:  (username: string, displayName:  string, password: string, email: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }:  { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);  // ⭐ Here setUser is defined!
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        const decoded = decodeJWT(token);
        
        if (decoded) {
          const roles = decoded.role 
            ?  (Array.isArray(decoded.role) ? decoded.role : [decoded. role]) 
            : [];
          
          const userData: User = {
            id: decoded.sub,
            username: decoded.unique_name || decoded.nameid || 'User',
            displayName: decoded. displayName || decoded.unique_name || 'User',
            shareholderId: decoded.shareholderId ?  parseInt(decoded.shareholderId) : undefined,
            roles:  roles,
            token,
            isAdmin: roles.includes('admin'),
            isUser:  roles.includes('user')
          };
          
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        removeToken();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const token = await apiLogin(username, password);
    
    // ⭐ JWT dekodieren
    const decoded = decodeJWT(token);
    
    if (! decoded) {
      throw new Error('Invalid token received');
    }
    
    const roles = decoded.role 
      ? (Array.isArray(decoded.role) ? decoded.role : [decoded.role]) 
      : [];
    
    const userData: User = {
      id:  decoded.sub,
      username: decoded.unique_name || decoded. nameid,
      displayName: decoded.displayName || decoded.unique_name,
      shareholderId: decoded. shareholderId ? parseInt(decoded. shareholderId) : undefined,
      roles: roles,
      token,
      isAdmin: roles.includes('admin'),
      isUser: roles.includes('user')
    };
    
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON. stringify(userData));
    setUser(userData);  // ⭐ setUser is now available!
  };

  const register = async (username: string, displayName: string, password: string, email: string) => {
    const token = await apiRegister(username, displayName, password, email);
    
    const decoded = decodeJWT(token);
    
    if (!decoded) {
      throw new Error('Invalid token received');
    }
    
    const roles = decoded. role 
      ? (Array. isArray(decoded.role) ? decoded.role : [decoded.role]) 
      : [];
    
    const userData: User = {
      id: decoded.sub,
      username: decoded.unique_name || username,
      displayName: decoded.displayName || displayName,
      shareholderId: decoded.shareholderId ? parseInt(decoded.shareholderId) : undefined,
      roles: roles,
      token,
      isAdmin: roles.includes('admin'),
      isUser: roles.includes('user')
    };
    
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    removeToken();
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        register,
        logout, 
        isAuthenticated: !!user,
        isLoading
      }}
    >
      {children}
    </AuthContext. Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
 
 return context;
}