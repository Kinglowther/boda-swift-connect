
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, phone: string, password: string, role: UserRole, profileImage?: string | null) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const { toast } = useToast();

  const isAuthenticated = !!user;

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For demo purposes, we'll check against stored users or use default credentials
    const storedUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const foundUser = storedUsers.find((u: User) => u.email === email);

    if (foundUser || (email === 'user@example.com' && password === 'password')) {
      const loggedInUser = foundUser || {
        id: '1',
        name: 'Demo User',
        email: 'user@example.com',
        role: 'customer' as UserRole,
        phone: '+254700000000'
      };

      setUser(loggedInUser);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      return true;
    }

    toast({
      variant: "destructive",
      title: "Login Failed",
      description: "Invalid email or password.",
    });
    return false;
  };

  const register = async (
    name: string, 
    email: string, 
    phone: string, 
    password: string, 
    role: UserRole,
    profileImage?: string | null
  ): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Check if user already exists
      const storedUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      if (storedUsers.find((u: User) => u.email === email)) {
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: "User with this email already exists.",
        });
        return false;
      }

      const newUser: User = {
        id: Date.now().toString(),
        name,
        email,
        phone,
        role,
        profileImage: profileImage || undefined
      };

      // Store user in localStorage for demo
      storedUsers.push(newUser);
      localStorage.setItem('registeredUsers', JSON.stringify(storedUsers));

      // Auto-login the user
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));

      toast({
        title: "Registration Successful",
        description: "Welcome to Boda!",
      });

      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "Something went wrong. Please try again.",
      });
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
