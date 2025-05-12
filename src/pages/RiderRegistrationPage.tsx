
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRider } from '@/contexts/RiderContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Bike } from 'lucide-react';

const RiderRegistrationPage: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bikeRegNumber, setBikeRegNumber] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { registerRider } = useRider();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      const success = await registerRider({
        name,
        phone,
        bikeRegNumber,
        idNumber,
        licenseNumber,
        profileImage: '/placeholder.svg',
        idImage: '/placeholder.svg',
        licenseImage: '/placeholder.svg',
      });
      
      if (success) {
        navigate('/login');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto mt-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Become a BodaDispatch Rider</h1>
          <p className="text-gray-600 mt-2">
            Register as a rider to offer delivery services and earn money
          </p>
        </div>
        
        <div className="boda-card py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bikeRegNumber">Motorcycle Registration Number</Label>
              <Input
                id="bikeRegNumber"
                placeholder="e.g., KAA 123B"
                value={bikeRegNumber}
                onChange={(e) => setBikeRegNumber(e.target.value)}
                required
                className="boda-input"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="idNumber">ID Number</Label>
                <Input
                  id="idNumber"
                  placeholder="National ID Number"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  required
                  className="boda-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">Driver's License Number</Label>
                <Input
                  id="licenseNumber"
                  placeholder="License Number"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  required
                  className="boda-input"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profilePhoto">Profile Photo</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500">
                    Click to upload<br />(Demo: Auto-added)
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="idPhoto">ID Photo</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500">
                    Click to upload<br />(Demo: Auto-added)
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="licensePhoto">License Photo</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500">
                    Click to upload<br />(Demo: Auto-added)
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> All rider registrations require verification before you can start accepting deliveries. We will review your documents and notify you when approved.
              </p>
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
                  <Bike className="mr-2 h-4 w-4" />
                  Register as Rider
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already registered?{' '}
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

export default RiderRegistrationPage;
