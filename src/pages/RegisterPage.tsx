
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProfileImageUpload from '@/components/ProfileImageUpload';
import { UserPlus, User, Bike } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [role, setRole] = useState<'customer' | 'rider'>('customer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleRoleChange = (newRole: 'customer' | 'rider') => {
    setRole(newRole);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please ensure both passwords match.",
      });
      return;
    }
    
    // For rider role, redirect to the rider registration page
    if (role === 'rider') {
      // Store basic info in session storage temporarily
      sessionStorage.setItem('riderBasicInfo', JSON.stringify({
        name,
        email,
        phone,
        password,
        profileImage
      }));
      
      // Redirect to rider registration page
      navigate('/rider-registration');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Only register customers here, riders will be registered after document submission
      const success = await register(name, email, phone, password, role, profileImage);
      if (success) {
        // For customers, give them Shujaa points
        toast({
          title: "Congratulations!",
          description: "You've earned 100 Shujaa points for signing up!",
        });
        navigate('/customer-dashboard');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto mt-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Create an Account</h1>
          <p className="text-gray-600 mt-2">
            Join Boda for fast and reliable delivery services
          </p>
        </div>
        
        <div className="boda-card py-6">
          {/* Role Selection */}
          <div className="flex justify-center mb-6 gap-4">
            <Button
              type="button"
              variant={role === 'customer' ? 'default' : 'outline'}
              className={`flex-1 ${role === 'customer' ? 'boda-btn' : ''}`}
              onClick={() => handleRoleChange('customer')}
            >
              <User className="mr-2 h-4 w-4" />
              Register as Customer
            </Button>
            <Button
              type="button"
              variant={role === 'rider' ? 'default' : 'outline'}
              className={`flex-1 ${role === 'rider' ? 'boda-btn' : ''}`}
              onClick={() => handleRoleChange('rider')}
            >
              <Bike className="mr-2 h-4 w-4" />
              Register as Rider
            </Button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <ProfileImageUpload
              currentImage={profileImage || undefined}
              onImageChange={setProfileImage}
            />
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="boda-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="boda-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="07XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="boda-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="boda-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="boda-input"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full boda-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {role === 'customer' ? 'Create Account' : 'Continue to Document Upload'}
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a 
                href="/login" 
                className="text-boda-600 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/login');
                }}
              >
                Login here
              </a>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;
