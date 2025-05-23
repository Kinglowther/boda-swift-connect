
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRider } from '@/contexts/RiderContext';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Bike, Upload, Camera } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const RiderRegistrationPage: React.FC = () => {
  // Get basic info from session storage if available
  const [basicInfo, setBasicInfo] = useState<any>(null);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bikeRegNumber, setBikeRegNumber] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [vehicleRegFront, setVehicleRegFront] = useState<File | null>(null);
  const [vehicleRegFrontPreview, setVehicleRegFrontPreview] = useState<string | null>(null);
  const [vehicleRegBack, setVehicleRegBack] = useState<File | null>(null);
  const [vehicleRegBackPreview, setVehicleRegBackPreview] = useState<string | null>(null);
  const [licenseFront, setLicenseFront] = useState<File | null>(null);
  const [licenseFrontPreview, setLicenseFrontPreview] = useState<string | null>(null);
  const [licenseBack, setLicenseBack] = useState<File | null>(null);
  const [licenseBackPreview, setLicenseBackPreview] = useState<string | null>(null);
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { registerRider } = useRider();
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    // Retrieve basic info from session storage
    const storedInfo = sessionStorage.getItem('riderBasicInfo');
    if (storedInfo) {
      const parsedInfo = JSON.parse(storedInfo);
      setBasicInfo(parsedInfo);
      setName(parsedInfo.name || '');
      setEmail(parsedInfo.email || '');
      setPhone(parsedInfo.phone || '');
      setPassword(parsedInfo.password || '');
    }
  }, []);
  
  const handleFileChange = (file: File | null, setter: React.Dispatch<React.SetStateAction<File | null>>, previewSetter: React.Dispatch<React.SetStateAction<string | null>>) => {
    setter(file);
    
    // Create and set preview URL
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        previewSetter(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      previewSetter(null);
    }
  };

  const FileUploadField = ({ 
    label, 
    file, 
    preview,
    setFile,
    setPreview,
    accept = "image/*" 
  }: { 
    label: string; 
    file: File | null;
    preview: string | null;
    setFile: React.Dispatch<React.SetStateAction<File | null>>;
    setPreview: React.Dispatch<React.SetStateAction<string | null>>;
    accept?: string;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-boda-400 transition-colors">
        <input
          type="file"
          accept={accept}
          onChange={(e) => {
            const selectedFile = e.target.files?.[0] || null;
            if (selectedFile) {
              handleFileChange(selectedFile, setFile, setPreview);
            }
          }}
          className="hidden"
          id={label.replace(/\s+/g, '-').toLowerCase()}
        />
        <label 
          htmlFor={label.replace(/\s+/g, '-').toLowerCase()}
          className="cursor-pointer flex flex-col items-center space-y-2"
        >
          {preview ? (
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 overflow-hidden rounded-md mb-2">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <p className="text-sm font-medium text-green-600">{file?.name}</p>
              <p className="text-xs text-gray-500">Click to change</p>
            </div>
          ) : file ? (
            <>
              <Camera className="h-8 w-8 text-green-500" />
              <p className="text-sm font-medium text-green-600">{file.name}</p>
              <p className="text-xs text-gray-500">Click to change</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-500">Click to upload</p>
              <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
            </>
          )}
        </label>
      </div>
    </div>
  );
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!profilePhoto || !vehicleRegFront || !vehicleRegBack || 
        !licenseFront || !licenseBack || !idFront || !idBack) {
      toast({
        variant: "destructive",
        title: "Missing Documents",
        description: "Please upload all required documents",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First register the user account
      let userId;
      if (basicInfo) {
        const registerSuccess = await register(name, email, phone, password, 'rider');
        if (!registerSuccess) {
          toast({
            variant: "destructive",
            title: "Registration Failed",
            description: "Could not create rider account",
          });
          return;
        }
      }
      
      // Convert file objects to data URLs for the mock API
      const profileImageUrl = profilePhotoPreview || '';
      const idFrontUrl = idFrontPreview || '';
      const idBackUrl = idBackPreview || '';
      const licenseFrontUrl = licenseFrontPreview || '';
      const licenseBackUrl = licenseBackPreview || '';
      const vehicleRegFrontUrl = vehicleRegFrontPreview || '';
      const vehicleRegBackUrl = vehicleRegBackPreview || '';
      
      // Then register the rider with all their documents
      const success = await registerRider({
        name,
        phone,
        bikeRegNumber,
        idNumber,
        licenseNumber,
        profileImage: profileImageUrl,
        idImage: idFrontUrl,
        idBackImage: idBackUrl,
        licenseImage: licenseFrontUrl,
        licenseBackImage: licenseBackUrl,
        vehicleRegFrontImage: vehicleRegFrontUrl,
        vehicleRegBackImage: vehicleRegBackUrl
      });
      
      if (success) {
        // Clear session storage
        sessionStorage.removeItem('riderBasicInfo');
        
        toast({
          title: "Registration Successful",
          description: "Your rider account has been created. You can now accept deliveries.",
        });
        
        // Navigate to rider dashboard
        navigate('/rider-dashboard');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        variant: "destructive",
        title: "Registration Error",
        description: "An error occurred during registration",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto mt-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Become a Boda Rider</h1>
          <p className="text-gray-600 mt-2">
            Register as a rider to offer delivery services and earn money
          </p>
        </div>
        
        <div className="boda-card py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-boda-800">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="boda-input"
                    readOnly={!!basicInfo}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    placeholder="07XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="boda-input"
                    readOnly={!!basicInfo}
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-boda-800">Vehicle Information</h3>
              <div className="space-y-2">
                <Label htmlFor="bikeRegNumber">Motorcycle Registration Number *</Label>
                <Input
                  id="bikeRegNumber"
                  placeholder="e.g., KAA 123B"
                  value={bikeRegNumber}
                  onChange={(e) => setBikeRegNumber(e.target.value)}
                  required
                  className="boda-input"
                />
              </div>
            </div>

            {/* Documentation */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-boda-800">Required Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="idNumber">National ID Number *</Label>
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
                  <Label htmlFor="licenseNumber">Driver's License Number *</Label>
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
            </div>

            {/* Photo Uploads */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-boda-800">Photo Documentation *</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please upload clear, original copies of all required documents. Photos should be well-lit and all text should be clearly readable.
              </p>
              
              {/* Profile Photo */}
              <div className="grid grid-cols-1 gap-4 mb-6">
                <FileUploadField
                  label="Profile Photo *"
                  file={profilePhoto}
                  preview={profilePhotoPreview}
                  setFile={setProfilePhoto}
                  setPreview={setProfilePhotoPreview}
                />
              </div>

              {/* Vehicle Registration */}
              <div className="space-y-4">
                <h4 className="font-medium text-boda-700">Vehicle Registration Certificate</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FileUploadField
                    label="Registration Front *"
                    file={vehicleRegFront}
                    preview={vehicleRegFrontPreview}
                    setFile={setVehicleRegFront}
                    setPreview={setVehicleRegFrontPreview}
                  />
                  <FileUploadField
                    label="Registration Back *"
                    file={vehicleRegBack}
                    preview={vehicleRegBackPreview}
                    setFile={setVehicleRegBack}
                    setPreview={setVehicleRegBackPreview}
                  />
                </div>
              </div>

              {/* Driver's License */}
              <div className="space-y-4">
                <h4 className="font-medium text-boda-700">Driver's License</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FileUploadField
                    label="License Front *"
                    file={licenseFront}
                    preview={licenseFrontPreview}
                    setFile={setLicenseFront}
                    setPreview={setLicenseFrontPreview}
                  />
                  <FileUploadField
                    label="License Back *"
                    file={licenseBack}
                    preview={licenseBackPreview}
                    setFile={setLicenseBack}
                    setPreview={setLicenseBackPreview}
                  />
                </div>
              </div>

              {/* National ID */}
              <div className="space-y-4">
                <h4 className="font-medium text-boda-700">National ID</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FileUploadField
                    label="ID Front *"
                    file={idFront}
                    preview={idFrontPreview}
                    setFile={setIdFront}
                    setPreview={setIdFrontPreview}
                  />
                  <FileUploadField
                    label="ID Back *"
                    file={idBack}
                    preview={idBackPreview}
                    setFile={setIdBack}
                    setPreview={setIdBackPreview}
                  />
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> All rider registrations require verification before you can start accepting deliveries. We will review your documents and notify you when approved. Processing time is typically 24-48 hours.
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
                  Submit Registration
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
