import React, { useState, useEffect, useCallback } from 'react';
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
  
  // Calculate distance and price when locations change
  const calculateDistance = useCallback((pickup: {lat: number, lng: number}, dropoff: {lat: number, lng: number}) => {
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
  }, [setDistance, setPrice]);

  // Get current location
  useEffect(() => {
    if (useCurrentLocation) {
      setLoading(true);
      
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          position => {
            const { latitude, longitude } = position.coords;
            const currentPickupCoords = { lat: latitude, lng: longitude };
            setPickupCoords(currentPickupCoords);
            setPickupLocation('Your Current Location');
            setLoading(false);
            
            if (dropoffCoords) {
              calculateDistance(currentPickupCoords, dropoffCoords);
            }
          },
          error => {
            toast({
              variant: "destructive",
              title: "Location Access Denied",
              description: "Please enable location services or enter your pickup location manually.",
            });
            setUseCurrentLocation(false);
            setLoading(false);
          },
          { enableHighAccuracy: true }
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
  }, [useCurrentLocation, toast, dropoffCoords, calculateDistance]); // Added dropoffCoords and calculateDistance
  
  // Simulate geocoding for demo purposes
  const simulateGeocoding = useCallback((address: string, isPickup: boolean) => {
    setLoading(true);
    
    setTimeout(() => {
      const baseLat = -1.286389;
      const baseLng = 36.817223;
      const jitter = 0.02 * (Math.random() - 0.5); 
      
      const coords = {
        lat: baseLat + jitter,
        lng: baseLng + jitter + (isPickup ? -0.01 : 0.01) 
      };
      
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
    }, 1000);
  }, [pickupCoords, dropoffCoords, calculateDistance, setLoading, setPickupCoords, setDropoffCoords]);
  
  const handlePickupLocationChange = useCallback((location: string) => {
    setPickupLocation(location);
    if (location.trim() && !useCurrentLocation) {
      simulateGeocoding(location, true);
    }
  }, [simulateGeocoding, useCurrentLocation, setPickupLocation]);
  
  const handleDropoffLocationChange = useCallback((location: string) => {
    setDropoffLocation(location);
    if (location.trim()) {
      simulateGeocoding(location, false);
    }
  }, [simulateGeocoding, setDropoffLocation]);
  
  // Toggle current location button
  const handleToggleCurrentLocation = () => {
    setUseCurrentLocation(prev => !prev);
    if (!useCurrentLocation) { // If turning on
      // Clear manual pickup location if switching to current location
      setPickupLocation(''); 
      setPickupCoords(null);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 'details') {
      if (!pickupLocation || !dropoffLocation || !description) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please fill in all required fields.",
        });
        return;
      }
      if (!pickupCoords || !dropoffCoords) {
        toast({
          variant: "destructive",
          title: "Location Not Set",
          description: "Please ensure both pickup and dropoff locations are set on the map.",
        });
        // Optionally, trigger geocoding again if addresses are filled but coords are missing
        if (pickupLocation && !pickupCoords && !useCurrentLocation) simulateGeocoding(pickupLocation, true);
        if (dropoffLocation && !dropoffCoords) simulateGeocoding(dropoffLocation, false);
        return;
      }
      setStep('confirm');
      return;
    }
    
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
      let nearestRider = null;
      if (pickupCoords && pickupCoords.lat && pickupCoords.lng) {
        nearestRider = getNearestRider(pickupCoords.lat, pickupCoords.lng);
      } else {
        nearestRider = getNearestRider(-1.2864, 36.8172); // Nairobi center fallback
      }

      const orderData = {
        customerId: user.id,
        pickupLocation,
        dropoffLocation,
        description,
        recipientName,
        recipientPhone,
        pickupLat: pickupCoords?.lat,
        pickupLng: pickupCoords?.lng,
        dropoffLat: dropoffCoords?.lat,
        dropoffLng: dropoffCoords?.lng,
        price: price ?? 0, // Send calculated price
      };

      const success = await placeOrder(orderData);

      if (success) {
        toast({
          title: "Ride Requested!",
          description: nearestRider 
            ? `Finding a rider near ${pickupLocation}...` 
            : "Looking for available riders in your area...",
        });

        try {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification("Ride Requested", {
              body: "We're looking for a rider nearby.",
              icon: "/favicon.ico"
            });
          } else if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
              if (permission === "granted") {
                new Notification("Ride Requested", {
                  body: "We're looking for a rider nearby (permission granted).",
                  icon: "/favicon.ico"
                });
              }
            }).catch(notificationError => {
              console.warn("Notification permission request failed:", notificationError);
            });
          }
        } catch (notificationError) {
          console.warn("Error with notification system:", notificationError);
        }

        onSuccess();
      } else {
        // This case implies placeOrder resolved to false without throwing an error.
        // The current mock implementation of placeOrder always returns true or would let an internal error propagate.
        // Adding a toast here for completeness if placeOrder's behavior changes.
        toast({
            variant: "destructive",
            title: "Order Not Confirmed",
            description: "The ride request could not be confirmed. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error placing order in handleSubmit:", error);
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
              <LocationMap 
                pickupLocation={pickupCoords}
                dropoffLocation={dropoffCoords}
                isSimulation={false}
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pickupLocation" className="text-foreground">Pickup Location</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={useCurrentLocation ? "bg-green-500 text-white hover:bg-green-600" : "hover:bg-muted"}
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
                  onChange={(e) => handlePickupLocationChange(e.target.value)}
                  disabled={useCurrentLocation}
                  required
                  className="boda-input"
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
                  className="boda-input"
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
                  className="boda-input"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientName" className="text-foreground">Recipient Name</Label>
                  <Input
                    id="recipientName"
                    placeholder="Name of person receiving the delivery"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="boda-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipientPhone" className="text-foreground">Recipient Phone</Label>
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
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                      Estimated Distance: 
                    </p>
                    <span className="text-foreground">{distance} km</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                      Estimated Price (before discount): 
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
                  className="bg-green-500 hover:bg-green-600 text-white"
                  disabled={!pickupLocation || !dropoffLocation || !description || !pickupCoords || !dropoffCoords || price === null}
                >
                  <Navigation className="mr-2 h-4 w-4" />
                  Continue
                </Button>
              </div>
            </>
          ) : ( // Confirmation Step
            <>
              <div className="space-y-4">
                <LocationMap 
                  pickupLocation={pickupCoords}
                  dropoffLocation={dropoffCoords}
                  isSimulation={true} // Keep simulation true to show route line
                />
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium text-foreground">Pickup:</p>
                    <p className="text-sm text-muted-foreground">{pickupLocation}</p>
                  </div>
                  
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium text-foreground">Dropoff:</p>
                    <p className="text-sm text-muted-foreground">{dropoffLocation}</p>
                  </div>
                </div>
                
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium text-foreground">Items:</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                
                {(recipientName || recipientPhone) && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium text-foreground">Recipient:</p>
                    {recipientName && <p className="text-sm text-muted-foreground">{recipientName}</p>}
                    {recipientPhone && <p className="text-sm text-muted-foreground">{recipientPhone}</p>}
                  </div>
                )}
                
                {price !== null && (
                  <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">
                          Base Fare: 
                        </p>
                        <span className="text-foreground">Ksh. 100</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">
                          Distance Cost ({distance ?? 0} km): 
                        </p>
                        <span className="text-foreground">Ksh. {Math.round((price + discount) - 100 - discount)}</span>
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
                        <Badge className="bg-green-500 text-white text-lg py-1">
                          Ksh. {price}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
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
                  className="bg-green-500 hover:bg-green-600 text-white"
                  disabled={loading}
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
