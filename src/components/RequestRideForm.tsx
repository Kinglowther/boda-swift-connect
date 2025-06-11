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
  
  // Location coordinates
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  // Get current location
  useEffect(() => {
    if (useCurrentLocation) {
      setLoading(true);
      
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          position => {
            const { latitude, longitude } = position.coords;
            setPickupCoords({ lat: latitude, lng: longitude });
            setPickupLocation('Your Current Location');
            setLoading(false);
            
            console.log('Location obtained:', { latitude, longitude });
            
            // Calculate distance if dropoff location is set
            if (dropoffCoords) {
              calculateDistance(
                { lat: latitude, lng: longitude },
                dropoffCoords
              );
            }
          },
          error => {
            console.error('Geolocation error:', error);
            toast({
              variant: "destructive",
              title: "Location Access Denied",
              description: "Please enter your pickup location manually.",
            });
            setUseCurrentLocation(false);
            setLoading(false);
          },
          { 
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          }
        );
      } else {
        console.error('Geolocation not supported');
        toast({
          variant: "destructive",
          title: "Location Not Available",
          description: "Geolocation is not supported by your browser.",
        });
        setUseCurrentLocation(false);
        setLoading(false);
      }
    }
  }, [useCurrentLocation, toast, dropoffCoords]);
  
  // Calculate distance and price when locations change
  const calculateDistance = (pickup: {lat: number, lng: number}, dropoff: {lat: number, lng: number}) => {
    // In a real app, this would use Google Maps Distance Matrix API
    // For now, we'll calculate a rough distance using the Haversine formula
    
    const R = 6371; // Radius of the Earth in km
    const dLat = (dropoff.lat - pickup.lat) * Math.PI / 180;
    const dLon = (dropoff.lng - pickup.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(pickup.lat * Math.PI / 180) * Math.cos(dropoff.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const calculatedDistance = R * c;
    
    setDistance(parseFloat(calculatedDistance.toFixed(1)));
    
    // Calculate price: Base fare + per km rate
    const baseFare = 100; // KSH
    const perKmRate = 50; // KSH per km
    const calculatedPrice = baseFare + (calculatedDistance * perKmRate);
    setPrice(Math.ceil(calculatedPrice));
  };
  
  // Simulate geocoding for demo purposes
  const simulateGeocoding = (address: string, isPickup: boolean) => {
    setLoading(true);
    
    console.log('Simulating geocoding for:', address, 'isPickup:', isPickup);
    
    // In a real app, this would use a geocoding API
    // For now, generate random coordinates near Nairobi as an example
    setTimeout(() => {
      try {
        // Generate a random point near Nairobi (approximate coordinates: -1.286389, 36.817223)
        const baseLat = -1.286389;
        const baseLng = 36.817223;
        const jitter = 0.02 * (Math.random() - 0.5); // Add some randomness
        
        const coords = {
          lat: baseLat + jitter,
          lng: baseLng + jitter + (isPickup ? -0.01 : 0.01) // Separate pickup and dropoff slightly
        };
        
        console.log('Generated coordinates:', coords, 'for', isPickup ? 'pickup' : 'dropoff');
        
        if (isPickup) {
          setPickupCoords(coords);
          if (dropoffCoords) {
            calculateDistance(coords, dropoffCoords);
          }
        } else {
          setDropoffCoords(coords);
          if (pickupCoords) {
            calculateDistance(pickupCoords, coords);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error in simulateGeocoding:', error);
        setLoading(false);
        toast({
          variant: "destructive",
          title: "Location Error",
          description: "Unable to process location. Please try again.",
        });
      }
    }, 1000);
  };
  
  const handlePickupLocationChange = (location: string) => {
    setPickupLocation(location);
    if (location.trim() && !useCurrentLocation) {
      simulateGeocoding(location, true);
    }
  };
  
  const handleDropoffLocationChange = (location: string) => {
    setDropoffLocation(location);
    if (location.trim()) {
      simulateGeocoding(location, false);
    }
  };
  
  const handleToggleCurrentLocation = () => {
    setUseCurrentLocation(prev => !prev);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted, step:', step);
    
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
      console.error('No user found');
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to request a ride.",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Placing order with data:', {
        customerId: user.id,
        pickupLocation,
        dropoffLocation,
        description,
        recipientName,
        recipientPhone,
        pickupCoords,
        dropoffCoords
      });
      
      // Use actual pickup coordinates if available for nearest rider search
      let nearestRider = null;
      if (pickupCoords && pickupCoords.lat && pickupCoords.lng) {
        nearestRider = getNearestRider(pickupCoords.lat, pickupCoords.lng);
      } else {
        // fallback to Nairobi center if coords missing
        nearestRider = getNearestRider(-1.2864, 36.8172);
      }

      console.log('Nearest rider found:', nearestRider);

      // Include pickup/dropoff coordinates in orderData if available
      const orderData = {
        customerId: user.id,
        pickupLocation,
        dropoffLocation,
        description,
        recipientName,
        recipientPhone,
        // add coordinates for backend/rider assignment if needed
        pickupLat: pickupCoords?.lat,
        pickupLng: pickupCoords?.lng,
        dropoffLat: dropoffCoords?.lat,
        dropoffLng: dropoffCoords?.lng,
      };

      console.log('Order data:', orderData);

      // Place the order
      const success = await placeOrder(orderData);

      console.log('Order placement result:', success);

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
        } else if ('Notification' in window && Notification.permission !== 'denied') {
          // Request permission for notifications
          Notification.requestPermission();
        }

        onSuccess();
      } else {
        throw new Error('Order placement failed');
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: "Unable to request a ride. Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-card border border-border rounded-xl shadow-sm animate-fade-in">
        <div className="p-4 sm:p-6 border-b border-border">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">
            {step === 'details' ? 'Request a Ride' : 'Confirm Your Request'}
          </h2>
        </div>
        
        <div className="p-4 sm:p-6 relative">
          {loading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 rounded-xl">
              <LoadingSpinner size="lg" text="Processing..." />
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {step === 'details' ? (
              <>
                <div className="w-full h-48 sm:h-64 mb-4 sm:mb-6">
                  <LocationMap 
                    pickupLocation={pickupCoords}
                    dropoffLocation={dropoffCoords}
                    isSimulation={false}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <Label htmlFor="pickupLocation" className="text-foreground">Pickup Location</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={`text-xs sm:text-sm w-full sm:w-auto ${useCurrentLocation ? "bg-green-500 text-white" : ""}`}
                      onClick={handleToggleCurrentLocation}
                    >
                      <MapPin className="mr-1 sm:mr-2 h-3 w-3" /> 
                      {useCurrentLocation ? "Using Current Location" : "Use My Location"}
                    </Button>
                  </div>
                  <Input
                    id="pickupLocation"
                    placeholder="e.g., City Center, Main Street"
                    value={pickupLocation}
                    onChange={(e) => handlePickupLocationChange(e.target.value)}
                    disabled={useCurrentLocation}
                    required
                    className="boda-input bg-background text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dropoffLocation" className="text-foreground">Dropoff Location</Label>
                  <Input
                    id="dropoffLocation"
                    placeholder="e.g., Westlands, Apartment 4B"
                    value={dropoffLocation}
                    onChange={(e) => handleDropoffLocationChange(e.target.value)}
                    required
                    className="boda-input bg-background text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-foreground">Item Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the items to be delivered"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="boda-input bg-background text-foreground min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipientName" className="text-foreground">Recipient Name</Label>
                    <Input
                      id="recipientName"
                      placeholder="Name of person receiving the delivery"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="boda-input bg-background text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipientPhone" className="text-foreground">Recipient Phone</Label>
                    <Input
                      id="recipientPhone"
                      placeholder="Recipient's contact number"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="boda-input bg-background text-foreground"
                    />
                  </div>
                </div>
                
                {distance !== null && price !== null && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">
                        Estimated Distance: 
                      </p>
                      <span className="text-foreground">{distance} km</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">
                        Estimated Price: 
                      </p>
                      <span className="text-foreground">Ksh. {price + discount}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1 text-green-600 dark:text-green-400">
                      <p className="text-sm font-medium">
                        Shujaa Discount:
                      </p>
                      <span>- Ksh. {discount}</span>
                    </div>
                    <hr className="my-2 border-green-200 dark:border-green-700" />
                    <div className="flex justify-between items-center font-bold">
                      <p className="text-green-800 dark:text-green-300">
                        Final Price:
                      </p>
                      <span className="text-lg text-foreground">Ksh. {price}</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onCancel}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-green-500 hover:bg-green-600 w-full sm:w-auto"
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
                  <div className="w-full h-48 sm:h-64 mb-4">
                    <LocationMap 
                      pickupLocation={pickupCoords}
                      dropoffLocation={dropoffCoords}
                      isSimulation={true}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium text-foreground">Pickup:</p>
                      <p className="text-sm text-muted-foreground break-words">{pickupLocation}</p>
                    </div>
                    
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium text-foreground">Dropoff:</p>
                      <p className="text-sm text-muted-foreground break-words">{dropoffLocation}</p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium text-foreground">Items:</p>
                    <p className="text-sm text-muted-foreground break-words">{description}</p>
                  </div>
                  
                  {(recipientName || recipientPhone) && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium text-foreground">Recipient:</p>
                      {recipientName && <p className="text-sm text-muted-foreground">{recipientName}</p>}
                      {recipientPhone && <p className="text-sm text-muted-foreground">{recipientPhone}</p>}
                    </div>
                  )}
                  
                  <div className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">
                          Base Fare: 
                        </p>
                        <span className="text-foreground">Ksh. 100</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">
                          Distance Cost ({distance} km): 
                        </p>
                        <span className="text-foreground">Ksh. {Math.round((price || 0) - 100)}</span>
                      </div>
                      <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                        <p className="text-sm font-medium">
                          Shujaa Discount:
                        </p>
                        <span>- Ksh. {discount}</span>
                      </div>
                      <hr className="border-green-200 dark:border-green-700" />
                      <div className="flex justify-between items-center font-bold">
                        <p className="text-green-800 dark:text-green-300">
                          Final Price:
                        </p>
                        <Badge className="bg-green-500 text-white text-lg py-1">
                          Ksh. {price}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep('details')}
                    className="w-full sm:w-auto"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-green-500 hover:bg-green-600 w-full sm:w-auto"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Request Boda (Ksh. {price})
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestRideForm;

</edits_to_apply>
