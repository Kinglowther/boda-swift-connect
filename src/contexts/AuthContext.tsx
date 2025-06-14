
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'rider';
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, phone: string, password: string, role: 'customer' | 'rider', profileImage?: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock users data
const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Customer',
    email: 'customer@example.com',
    phone: '0712345678',
    role: 'customer',
    profileImage: '/placeholder.svg'
  },
  {
    id: '2',
    name: 'Robert Rider',
    email: 'rider@example.com', 
    phone: '0723456789',
    role: 'rider',
    profileImage: '/placeholder.svg'
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const { toast } = useToast();

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = users.find(u => u.email === email);
    
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('currentUser', JSON.stringify(foundUser));
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${foundUser.name}!`,
      });
      
      return true;
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid email or password",
      });
      return false;
    }
  };

  const register = async (name: string, email: string, phone: string, password: string, role: 'customer' | 'rider', profileImage?: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "User with this email already exists",
      });
      return false;
    }
    
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      phone,
      role,
      profileImage: profileImage || '/placeholder.svg'
    };
    
    setUsers(prev => [...prev, newUser]);
    setUser(newUser);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    toast({
      title: "Registration Successful",
      description: `Welcome to Boda, ${name}!`,
    });
    
    return true;
  };

  const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    // Update in users list as well
    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully.",
    });
    
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
