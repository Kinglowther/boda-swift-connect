
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, phone: string, password: string, role: UserRole) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock data for demo purposes
const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Customer',
    email: 'customer@example.com',
    role: 'customer',
    phone: '0712345678',
    profileImage: '/placeholder.svg'
  },
  {
    id: '2',
    name: 'Robert Rider',
    email: 'rider@example.com',
    role: 'rider',
    phone: '0723456789',
    profileImage: '/placeholder.svg'
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check localStorage for saved user
    const savedUser = localStorage.getItem('bodaUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('bodaUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = mockUsers.find(u => u.email === email);
    
    if (foundUser && password === '123456') { // In a real app, you'd check hashed passwords
      setUser(foundUser);
      localStorage.setItem('bodaUser', JSON.stringify(foundUser));
      toast({
        title: "Login Successful",
        description: `Welcome back, ${foundUser.name}!`,
      });
      setIsLoading(false);
      return true;
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid email or password",
      });
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bodaUser');
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
  };

  const register = async (name: string, email: string, phone: string, password: string, role: UserRole): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if email already exists
    if (mockUsers.some(u => u.email === email)) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "Email already in use",
      });
      setIsLoading(false);
      return false;
    }

    const newUser: User = {
      id: `${mockUsers.length + 1}`,
      name,
      email,
      role,
      phone,
      profileImage: '/placeholder.svg'
    };
    
    // In a real app, you'd send this to your backend
    mockUsers.push(newUser);
    
    setUser(newUser);
    localStorage.setItem('bodaUser', JSON.stringify(newUser));
    
    toast({
      title: "Registration Successful",
      description: `Welcome, ${name}!`,
    });
    
    setIsLoading(false);
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
