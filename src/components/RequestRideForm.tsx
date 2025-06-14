import React, { useState, useEffect, useCallback } from 'react';
import L from 'leaflet';
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
import { MapPin, Navigation, Package, Clock } from 'lucide-react';
import LocationMap from './LocationMap';
import LocationAutocomplete from './LocationAutocomplete';
import LoadingSpinner from './LoadingSpinner';
import { getRouteDetails, geocodeLocation } from '@/services/distanceService';

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
  const [duration, setDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'details' | 'confirm'>('details');
  
  // Location coordinates
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [routePolyline, setRoutePolyline] = useState<L.LatLngExpression[] | undefined>(undefined);
  
  // Calculate distance, price and duration when locations change
  useEffect(() => {
    const calculateRoute = async () => {
      if (pickupCoords && dropoffCoords) {
        setLoading(true);
        try {
          const routeDetails = await getRouteDetails([pickupCoords, dropoffCoords]);
          
          setDistance(routeDetails.distance);
          setDuration(routeDetails.duration);
          setRoutePolyline(routeDetails.polyline);
          
          // Calculate price: Base fare + per km rate
          const baseFare = 100; // KSH
          const perKmRate = 50; // KSH per km
          const calculatedPrice = baseFare + (routeDetails.distance * perKmRate);
          setPrice(Math.ceil(calculatedPrice));
          
          console.log(`Best route found: ${routeDetails.distance}km, ${routeDetails.duration}min`);
        } catch (error) {
          console.error("Error calculating route:", error);
          toast({
            variant: "destructive",
            title: "Could not calculate route",
            description: "Please check your locations and try again.",
          });
        } finally {
          setLoading(false);
        }
      }
    };
    calculateRoute();
  }, [pickupCoords, dropoffCoords, toast]);

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
  }, [useCurrentLocation, toast]);
  
  // Handle pickup location selection from autocomplete
  const handlePickupLocationSelect = useCallback((coords: { lat: number; lng: number }, displayName: string) => {
    setPickupCoords(coords);
    setPickupLocation(displayName);
    console.log('Pickup location selected:', displayName, coords);
  }, []);

  // Handle dropoff location selection from autocomplete
  const handleDropoffLocationSelect = useCallback((coords: { lat: number; lng: number }, displayName: string) => {
    setDropoffCoords(coords);
    setDropoffLocation(displayName);
    console.log('Dropoff location selected:', displayName, coords);
  }, []);
  
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
        nearestRider = await getNearestRider(pickupCoords.lat, pickupCoords.lng);
      } else {
        nearestRider = await getNearestRider(-1.2864, 36.8172); // Nairobi center fallback
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
        price: price ?? 0,
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
          }
        } catch (notificationError) {
          console.warn("Error with notification system:", notificationError);
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
            <LoadingSpinner size="lg" text="Finding best route..." />
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'details' ? (
            <>
              <LocationMap 
                pickupLocation={pickupCoords}
                dropoffLocation={dropoffCoords}
                routePolyline={routePolyline}
                isSimulation={false}
                className="z-0"
                distance={distance}
                duration={duration}
                showRouteInfo={true}
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
                {useCurrentLocation ? (
                  <Input
                    id="pickupLocation"
                    placeholder="Using your current location..."
                    value={pickupLocation}
                    disabled={true}
                    className="boda-input"
                  />
                ) : (
                  <LocationAutocomplete
                    value={pickupLocation}
                    onChange={setPickupLocation}
                    onLocationSelect={handlePickupLocationSelect}
                    placeholder="e.g., Karen, Nairobi"
                    className="boda-input"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dropoffLocation" className="text-foreground">Dropoff Location</Label>
                <LocationAutocomplete
                  value={dropoffLocation}
                  onChange={setDropoffLocation}
                  onLocationSelect={handleDropoffLocationSelect}
                  placeholder="e.g., Kisumu, Kenya"
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
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <span className="font-semibold text-blue-800 dark:text-blue-300">Optimal Route Selected</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      Distance: 
                    </p>
                    <span className="text-foreground font-bold">{distance} km</span>
                  </div>
                  {duration !== null && duration > 0 && (
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Est. Travel Time:
                      </p>
                      <span className="text-foreground flex items-center gap-1 font-bold">
                        <Clock className="h-3 w-3"/>
                        {Math.round(duration)} mins
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      Price (before discount): 
                    </p>
                    <span className="text-foreground">Ksh. {price + discount}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-green-600 dark:text-green-400">
                    <p className="text-sm font-medium">
                      Shujaa Discount:
                    </p>
                    <span>- Ksh. {discount}</span>
                  </div>
                  <hr className="my-2 border-blue-200 dark:border-blue-700" />
                  <div className="flex justify-between items-center font-bold">
                    <p className="text-blue-800 dark:text-blue-300">
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
          ) : (
            <>
              <div className="space-y-4">
                <LocationMap 
                  pickupLocation={pickupCoords}
                  dropoffLocation={dropoffCoords}
                  routePolyline={routePolyline}
                  isSimulation={true}
                  className="z-0"
                  distance={distance}
                  duration={duration}
                  showRouteInfo={true}
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
                          Distance: 
                        </p>
                        <span className="text-foreground font-bold">{distance} km</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">
                          Base Fare: 
                        </p>
                        <span className="text-foreground">Ksh. 100</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">
                          Distance Cost: 
                        </p>
                        <span className="text-foreground">Ksh. {Math.round((price + discount) - 100)}</span>
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
