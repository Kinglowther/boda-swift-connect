
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRider } from '@/contexts/RiderContext';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProfileImageUpload from '@/components/ProfileImageUpload';
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
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
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
      <Label className="text-foreground">{label}</Label>
      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors bg-card">
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
              <p className="text-sm font-medium text-green-600 dark:text-green-400">{file?.name}</p>
              <p className="text-xs text-muted-foreground">Click to change</p>
            </div>
          ) : file ? (
            <>
              <Camera className="h-8 w-8 text-green-500 dark:text-green-400" />
              <p className="text-sm font-medium text-green-600 dark:text-green-400">{file.name}</p>
              <p className="text-xs text-muted-foreground">Click to change</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to upload</p>
              <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
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
        description: "Please upload all required documents including your profile photo",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First register the user account
      if (basicInfo) {
        const registerSuccess = await register(name, email, phone, password, 'rider', profilePhoto);
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
        profileImage: profilePhoto,
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
          <h1 className="text-2xl font-bold text-foreground">Become a Boda Rider</h1>
          <p className="text-muted-foreground mt-2">
            Register as a rider to offer delivery services and earn money
          </p>
        </div>
        
        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
              
              {/* Profile Photo Upload */}
              <div className="mb-6">
                <ProfileImageUpload
                  currentImage={profilePhoto || undefined}
                  onImageChange={setProfilePhoto}
                  className="max-w-md"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-background border-border text-foreground"
                    readOnly={!!basicInfo}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground">Phone Number *</Label>
                  <Input
                    id="phone"
                    placeholder="07XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="bg-background border-border text-foreground"
                    readOnly={!!basicInfo}
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Vehicle Information</h3>
              <div className="space-y-2">
                <Label htmlFor="bikeRegNumber" className="text-foreground">Motorcycle Registration Number *</Label>
                <Input
                  id="bikeRegNumber"
                  placeholder="e.g., KAA 123B"
                  value={bikeRegNumber}
                  onChange={(e) => setBikeRegNumber(e.target.value)}
                  required
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>

            {/* Documentation */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Required Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="idNumber" className="text-foreground">National ID Number *</Label>
                  <Input
                    id="idNumber"
                    placeholder="National ID Number"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    required
                    className="bg-background border-border text-foreground"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber" className="text-foreground">Driver's License Number *</Label>
                  <Input
                    id="licenseNumber"
                    placeholder="License Number"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    required
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Photo Uploads */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Document Photos *</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please upload clear, original copies of all required documents. Photos should be well-lit and all text should be clearly readable.
              </p>

              {/* Vehicle Registration */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Vehicle Registration Certificate</h4>
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
                <h4 className="font-medium text-foreground">Driver's License</h4>
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
                <h4 className="font-medium text-foreground">National ID</h4>
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
            
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
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
            <p className="text-sm text-muted-foreground">
              Already registered?{' '}
              <a 
                href="/login" 
                className="text-primary hover:underline"
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
