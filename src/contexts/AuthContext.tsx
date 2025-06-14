import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types'; // Ensure User is imported from types
import { useToast } from "@/components/ui/use-toast"; // Correct path for useToast
import { useNavigate } from 'react-router-dom';

// Mock users data - adjust as needed, ensure some match potential customerIds
const mockAllUsers: User[] = [
  { id: 'customer-1', name: 'Alice Customer', email: 'alice@example.com', role: 'customer', phone: '0712345670' },
  { id: 'customer-2', name: 'Bob Client', email: 'bob@example.com', role: 'customer', phone: '0712345671' },
  { id: 'rider-1', name: 'Charlie Rider', email: 'charlie@example.com', role: 'rider', phone: '0712345672', profileImage: '/placeholder.svg' },
];

// Define a type for registration payload
export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password?: string; // Password for the registration process
  role: UserRole;    // Role is essential for registration
  profileImage?: string | null;
}

interface AuthContextType {
  user: User | null;
  users: User[]; // Keep existing users array if it serves a purpose, or merge logic
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: RegisterPayload) => Promise<boolean>; // Updated type here
  loading: boolean;
  getUserById: (userId: string) => User | undefined; // New function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // Initialize with mockAllUsers or merge with existing users logic
  const [users, setUsers] = useState<User[]>(() => {
    // Example: Load from localStorage or start with mock
    const storedUser = localStorage.getItem('loggedInUser');
    const initialUsers = [...mockAllUsers];
    if (storedUser) {
        try {
            const parsedUser = JSON.parse(storedUser) as User;
            // Avoid duplicates if loggedInUser is already in mockAllUsers
            if (!initialUsers.find(u => u.id === parsedUser.id)) {
                initialUsers.push(parsedUser);
            }
        } catch (e) {
            console.error("Failed to parse stored user", e);
        }
    }
    return initialUsers;
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there's a logged-in user in localStorage
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);
        // Ensure the logged-in user is also in the 'users' list if not already
        setUsers(prevUsers => {
            if (!prevUsers.find(u => u.id === parsedUser.id)) {
                return [...prevUsers, parsedUser];
            }
            return prevUsers;
        });
      } catch (e) {
        console.error("Failed to parse stored user from localStorage:", e);
        localStorage.removeItem('loggedInUser'); // Clear corrupted data
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Basic validation - in a real app, this would hit a backend
    // For now, let's check against our mock users or a predefined test user
    let foundUser = users.find(u => u.email === email); // Check against all users for login

    // If not found, and for demo purposes, let's allow login with a generic test user if not in list
    if (!foundUser && email === "test@example.com" && pass === "password") {
        foundUser = {
            id: `user-${Date.now()}`, // ensure unique ID for demo
            name: 'Test User',
            email: 'test@example.com',
            role: 'customer', // Default role or determine based on email
            phone: '0712345000', // Default phone
        };
        setUsers(prev => [...prev, foundUser!]); // Add to users list if newly created for demo
    } else if (!foundUser && email === "rider@example.com" && pass === "password") {
        foundUser = {
            id: `rider-${Date.now()}`,
            name: 'Demo Rider',
            email: 'rider@example.com',
            role: 'rider',
            phone: '0712345001',
        };
        setUsers(prev => [...prev, foundUser!]);
    }


    if (foundUser) { // Assuming password check is 'password' for any demo user
      setUser(foundUser);
      localStorage.setItem('loggedInUser', JSON.stringify(foundUser));
      toast({ title: "Login Successful", description: `Welcome back, ${foundUser.name}!` });
      setLoading(false);
      if (foundUser.role === 'rider') navigate('/rider-dashboard');
      else if (foundUser.role === 'customer') navigate('/customer-dashboard');
      else navigate('/');
      return true;
    } else {
      toast({ variant: "destructive", title: "Login Failed", description: "Invalid email or password." });
      setLoading(false);
      return false;
    }
  };

  const register = async (userData: RegisterPayload): Promise<boolean> => { // Updated type here
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!userData.email || !userData.name || !userData.phone || !userData.password) { // Password check added
        toast({ variant: "destructive", title: "Registration Failed", description: "Please fill all required fields including password." });
        setLoading(false);
        return false;
    }

    if (users.find(u => u.email === userData.email)) {
        toast({ variant: "destructive", title: "Registration Failed", description: "Email already exists." });
        setLoading(false);
        return false;
    }
    
    // Determine role based on some logic, e.g., a flag in userData or default to 'customer'
    // For this example, default to 'customer'. If it's rider registration, that flow should set role to 'rider'.
    const role: UserRole = (userData as any).isRider ? 'rider' : 'customer';

    const newUser: User = {
        id: `user-${Date.now()}`,
        name: userData.name!,
        email: userData.email!,
        phone: userData.phone!,
        profileImage: userData.profileImage || '/placeholder.svg',
        role: role, // Default to customer, RiderRegistration should override
    };

    setUsers(prev => [...prev, newUser]);
    setUser(newUser); // Auto-login the new user
    localStorage.setItem('loggedInUser', JSON.stringify(newUser)); // Persist login
    
    toast({ title: "Registration Successful", description: `Welcome, ${newUser.name}!` });
    setLoading(false);

    // Redirect based on role
    if (newUser.role === 'rider') {
        navigate('/rider-dashboard');
    } else if (newUser.role === 'customer') {
        navigate('/customer-dashboard');
    } else {
        navigate('/'); // Fallback, though should not happen with defined roles
    }
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('loggedInUser');
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    navigate('/'); // Redirect to home or login page after logout
  };

  const getUserById = (userId: string): User | undefined => {
    console.log("AuthContext: Searching for user ID:", userId, "in users list:", users);
    return users.find(u => u.id === userId);
  };

  return (
    <AuthContext.Provider value={{ user, users, login, logout, register, loading, getUserById }}>
      {children}
    </AuthContext.Provider>
  );
};
