
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { LogIn } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const success = await login(email, password);
      if (success) {
        // Redirect based on user role in AuthContext
        navigate('/');
      } 
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Login to BodaDispatch</h1>
          <p className="text-gray-600 mt-2">
            Enter your credentials to access your account
          </p>
        </div>
        
        <div className="boda-card py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="boda-input"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-sm text-boda-600 hover:underline">
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a 
                href="/register" 
                className="text-boda-600 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/register');
                }}
              >
                Register now
              </a>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;
