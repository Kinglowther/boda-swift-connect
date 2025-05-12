
import React, { useState, useEffect } from 'react';
import { useOrder } from '@/contexts/OrderContext';
import { useRider } from '@/contexts/RiderContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Package } from 'lucide-react';
import LocationMap from './LocationMap';
import LoadingSpinner from './LoadingSpinner';

interface RequestRideFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const RequestRideForm: React.FC<RequestRideFormProps> = ({ onCancel, onSuccess }) => {
  const { placeOrder } = useOrder();
  const { user } = useAuth();
  const { getNearestRider } = useRider();
  const { toast } = useToast();
  
  // Form state
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [description, setDescription] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const [discount, setDiscount] = useState(200); // Shujaa discount in KSH
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'details' | 'confirm'>('details');
  
  // Get current location
  useEffect(() => {
    if (useCurrentLocation) {
      setLoading(true);
      
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          position => {
            // In a real app, this would convert coordinates to an address
            setPickupLocation('Your Current Location');
            setLoading(false);
            
            // Calculate a mock distance
            if (dropoffLocation) {
              calculateDistance();
            }
          },
          error => {
            toast({
              variant: "destructive",
              title: "Location Access Denied",
              description: "Please enter your pickup location manually.",
            });
            setUseCurrentLocation(false);
            setLoading(false);
          }
        );
      } else {
        toast({
          variant: "destructive",
          title: "Location Not Available",
          description: "Geolocation is not supported by your browser.",
        });
        setUseCurrentLocation(false);
        setLoading(false);
      }
    }
  }, [useCurrentLocation, toast]);
  
  // Calculate distance and price when locations change
  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      calculateDistance();
    }
  }, [pickupLocation, dropoffLocation]);
  
  const calculateDistance = () => {
    // In a real app, this would use Google Maps Distance Matrix API
    // For now, generate a random distance between 1-10 km
    const mockDistance = 1 + Math.random() * 9;
    setDistance(parseFloat(mockDistance.toFixed(1)));
    
    // Calculate price: Base fare + per km rate
    const baseFare = 100; // KSH
    const perKmRate = 50; // KSH per km
    const calculatedPrice = baseFare + (mockDistance * perKmRate);
    setPrice(Math.ceil(calculatedPrice));
  };
  
  const handleToggleCurrentLocation = () => {
    setUseCurrentLocation(prev => !prev);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 'details') {
      // Validate form
      if (!pickupLocation || !dropoffLocation || !description) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please fill in all required fields.",
        });
        return;
      }
      
      // Move to confirmation step
      setStep('confirm');
      return;
    }
    
    // For confirm step, submit the order
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to request a ride.",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Find nearest rider
      const nearestRider = getNearestRider(-1.2864, 36.8172); // Mock coordinates
      
      // Create the order object
      const orderData = {
        customerId: user.id,
        pickupLocation,
        dropoffLocation,
        description,
        recipientName,
        recipientPhone,
      };
      
      // Place the order
      const success = await placeOrder(orderData);
      
      if (success) {
        toast({
          title: "Ride Requested!",
          description: nearestRider 
            ? `Finding a rider near ${pickupLocation}...` 
            : "Looking for available riders in your area...",
        });
        
        // Try to show a browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification("Ride Requested", {
            body: "We're looking for a rider nearby",
            icon: "/favicon.ico"
          });
        }
        
        onSuccess();
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: "Unable to request a ride. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="animate-fade-in w-full">
      <CardHeader>
        <CardTitle>{step === 'details' ? 'Request a Ride' : 'Confirm Your Request'}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-xl">
            <LoadingSpinner size="lg" text="Processing..." />
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'details' ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pickupLocation">Pickup Location</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={useCurrentLocation ? "bg-boda-primary text-white" : ""}
                    onClick={handleToggleCurrentLocation}
                  >
                    <MapPin className="mr-2 h-3 w-3" /> 
                    {useCurrentLocation ? "Using Current Location" : "Use My Location"}
                  </Button>
                </div>
                <Input
                  id="pickupLocation"
                  placeholder="e.g., City Center, Main Street"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  disabled={useCurrentLocation}
                  required
                  className="boda-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dropoffLocation">Dropoff Location</Label>
                <Input
                  id="dropoffLocation"
                  placeholder="e.g., Westlands, Apartment 4B"
                  value={dropoffLocation}
                  onChange={(e) => setDropoffLocation(e.target.value)}
                  required
                  className="boda-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Item Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the items to be delivered"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="boda-input"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientName">Recipient Name</Label>
                  <Input
                    id="recipientName"
                    placeholder="Name of person receiving the delivery"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="boda-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipientPhone">Recipient Phone</Label>
                  <Input
                    id="recipientPhone"
                    placeholder="Recipient's contact number"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="boda-input"
                  />
                </div>
              </div>
              
              {distance !== null && price !== null && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-green-800">
                      Estimated Distance: 
                    </p>
                    <span>{distance} km</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm font-medium text-green-800">
                      Estimated Price: 
                    </p>
                    <span>Ksh. {price + discount}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-green-600">
                    <p className="text-sm font-medium">
                      Shujaa Discount:
                    </p>
                    <span>- Ksh. {discount}</span>
                  </div>
                  <hr className="my-2 border-green-200" />
                  <div className="flex justify-between items-center font-bold">
                    <p className="text-green-800">
                      Final Price:
                    </p>
                    <span className="text-lg">Ksh. {price}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-boda-primary hover:bg-boda-600"
                  disabled={!pickupLocation || !dropoffLocation || !description}
                >
                  <Navigation className="mr-2 h-4 w-4" />
                  Continue
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <LocationMap 
                  pickupLocation={{ lat: -1.286389, lng: 36.817223 }}
                  dropoffLocation={{ lat: -1.299389, lng: 36.827223 }}
                />
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Pickup:</p>
                    <p className="text-sm">{pickupLocation}</p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Dropoff:</p>
                    <p className="text-sm">{dropoffLocation}</p>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Items:</p>
                  <p className="text-sm">{description}</p>
                </div>
                
                {(recipientName || recipientPhone) && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Recipient:</p>
                    {recipientName && <p className="text-sm">{recipientName}</p>}
                    {recipientPhone && <p className="text-sm">{recipientPhone}</p>}
                  </div>
                )}
                
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-green-800">
                        Base Fare: 
                      </p>
                      <span>Ksh. 100</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-sm font-medium text-green-800">
                        Distance Cost ({distance} km): 
                      </p>
                      <span>Ksh. {Math.round((price || 0) - 100)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1 text-green-600">
                      <p className="text-sm font-medium">
                        Shujaa Discount:
                      </p>
                      <span>- Ksh. {discount}</span>
                    </div>
                    <hr className="my-2 border-green-200" />
                    <div className="flex justify-between items-center font-bold">
                      <p className="text-green-800">
                        Final Price:
                      </p>
                      <Badge className="bg-boda-primary text-white text-lg py-1">
                        Ksh. {price}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between space-x-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep('details')}
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  className="bg-boda-primary hover:bg-boda-600"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Request Boda (Ksh. {price})
                </Button>
              </div>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default RequestRideForm;
