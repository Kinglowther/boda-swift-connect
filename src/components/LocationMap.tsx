
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from './LoadingSpinner';

interface Location {
  lat: number;
  lng: number;
}

interface LocationMapProps {
  pickupLocation?: Location | null;
  dropoffLocation?: Location | null;
  riderLocation?: Location;
  isSimulation?: boolean;
}

const LocationMap: React.FC<LocationMapProps> = ({
  pickupLocation,
  dropoffLocation,
  riderLocation,
  isSimulation = false
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const { toast } = useToast();
  
  // Markers refs
  const pickupMarkerRef = useRef<google.maps.Marker | null>(null);
  const dropoffMarkerRef = useRef<google.maps.Marker | null>(null);
  const riderMarkerRef = useRef<google.maps.Marker | null>(null);
  const pathRef = useRef<google.maps.Polyline | null>(null);

  // For simulation purposes
  const [simulatedPosition, setSimulatedPosition] = useState<Location | undefined>(riderLocation);
  
  // Load Google Maps API
  useEffect(() => {
    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    // Load Google Maps API script
    const existingScript = document.getElementById('google-maps-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      script.onerror = () => {
        setMapError(true);
        toast({
          variant: "destructive",
          title: "Map Error",
          description: "Failed to load Google Maps. Using fallback display.",
        });
      };
      document.head.appendChild(script);
    }

    return () => {
      // Cleanup - no need to remove the script as it can be reused
    };
  }, [toast]);

  // Initialize map once API is loaded
  const initializeMap = () => {
    if (!mapRef.current) return;
    
    try {
      // Default to Nairobi coordinates if no locations provided
      const defaultLocation = { lat: -1.286389, lng: 36.817223 };
      const mapCenter = pickupLocation || dropoffLocation || defaultLocation;
      
      const mapOptions: google.maps.MapOptions = {
        center: mapCenter,
        zoom: 15,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      };
      
      // Create new map
      googleMapRef.current = new google.maps.Map(mapRef.current, mapOptions);
      
      // Add navigation controls
      googleMapRef.current.controls[google.maps.ControlPosition.TOP_RIGHT].push(
        document.createElement('div')
      );
      
      setMapLoaded(true);
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError(true);
    }
  };

  // Update markers and path when locations change
  useEffect(() => {
    if (!mapLoaded || !googleMapRef.current) return;
    
    // Clear existing markers
    if (pickupMarkerRef.current) pickupMarkerRef.current.setMap(null);
    if (dropoffMarkerRef.current) dropoffMarkerRef.current.setMap(null);
    if (pathRef.current) pathRef.current.setMap(null);
    
    // Adjust map bounds to include all markers
    if (pickupLocation || dropoffLocation) {
      const bounds = new google.maps.LatLngBounds();
      
      // Add pickup marker
      if (pickupLocation) {
        pickupMarkerRef.current = new google.maps.Marker({
          position: pickupLocation,
          map: googleMapRef.current,
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
            scaledSize: new google.maps.Size(40, 40)
          },
          title: 'Pickup Location'
        });
        bounds.extend(pickupLocation);
      }
      
      // Add dropoff marker
      if (dropoffLocation) {
        dropoffMarkerRef.current = new google.maps.Marker({
          position: dropoffLocation,
          map: googleMapRef.current,
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(40, 40)
          },
          title: 'Dropoff Location'
        });
        bounds.extend(dropoffLocation);
      }
      
      // Draw path between pickup and dropoff
      if (pickupLocation && dropoffLocation) {
        pathRef.current = new google.maps.Polyline({
          path: [pickupLocation, dropoffLocation],
          geodesic: true,
          strokeColor: '#4B5563',
          strokeOpacity: 0.7,
          strokeWeight: 3,
          map: googleMapRef.current
        });
        
        // Calculate and display distance
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
          new google.maps.LatLng(pickupLocation.lat, pickupLocation.lng),
          new google.maps.LatLng(dropoffLocation.lat, dropoffLocation.lng)
        );
        
        console.log(`Distance: ${distance / 1000} km`);
      }
      
      // Fit map to markers
      googleMapRef.current.fitBounds(bounds);
      googleMapRef.current.setZoom(googleMapRef.current.getZoom() - 1);
    }
  }, [pickupLocation, dropoffLocation, mapLoaded]);

  // Handle rider marker
  useEffect(() => {
    if (!mapLoaded || !googleMapRef.current) return;
    
    // Use either real rider location or simulated position
    const currentRiderPos = riderLocation || simulatedPosition;
    
    if (currentRiderPos) {
      // Clear previous marker
      if (riderMarkerRef.current) riderMarkerRef.current.setMap(null);
      
      // Create rider marker
      riderMarkerRef.current = new google.maps.Marker({
        position: currentRiderPos,
        map: googleMapRef.current,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          scaledSize: new google.maps.Size(40, 40)
        },
        title: 'Rider',
        animation: google.maps.Animation.DROP
      });
    }
  }, [riderLocation, simulatedPosition, mapLoaded]);

  // For simulation purposes
  useEffect(() => {
    if (!isSimulation || !pickupLocation || !dropoffLocation || !mapLoaded) return;
    
    // Create a path from origin to pickup to dropoff
    let step = 0;
    const totalSteps = 20;
    let currentTarget = pickupLocation;
    let reachedPickup = false;
    
    const interval = setInterval(() => {
      if (step >= totalSteps) {
        if (!reachedPickup) {
          reachedPickup = true;
          step = 0;
          currentTarget = dropoffLocation;
        } else {
          clearInterval(interval);
        }
      }
      
      // Generate a simulated rider position moving toward target
      const originLat = -1.28 + Math.random() * 0.05;
      const originLng = 36.81 + Math.random() * 0.05;
      
      const initialPosition = simulatedPosition || { lat: originLat, lng: originLng };
      
      const progress = step / totalSteps;
      const newLat = initialPosition.lat + (currentTarget.lat - initialPosition.lat) * (progress * 0.2);
      const newLng = initialPosition.lng + (currentTarget.lng - initialPosition.lng) * (progress * 0.2);
      
      setSimulatedPosition({ lat: newLat, lng: newLng });
      
      step++;
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isSimulation, pickupLocation, dropoffLocation, mapLoaded]);

  // Fallback UI when no map or error
  const renderFallbackMap = () => {
    // Check if we have coordinates to show
    const hasCoordinates = pickupLocation || dropoffLocation || simulatedPosition;

    return (
      <>
        {/* Map background with subtle grid */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50">
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)', 
            backgroundSize: '20px 20px'
          }}></div>
        </div>
        
        {!hasCoordinates && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-400">Enter locations to see the map</p>
          </div>
        )}
        
        {/* Pickup location marker */}
        {pickupLocation && (
          <div className="absolute transform -translate-x-1/2 -translate-y-1/2" 
               style={getRelativePosition(pickupLocation)}>
            <div className="relative">
              <MapPin className="h-6 w-6 text-green-600" />
              <div className="absolute -bottom-1 -left-1 w-8 h-8 bg-green-400 rounded-full opacity-20 animate-pulse"></div>
            </div>
            <div className="absolute left-3 top-5 text-xs bg-white px-1 rounded shadow">Pickup</div>
          </div>
        )}
        
        {/* Dropoff location marker */}
        {dropoffLocation && (
          <div className="absolute transform -translate-x-1/2 -translate-y-1/2" 
               style={getRelativePosition(dropoffLocation)}>
            <div className="relative">
              <MapPin className="h-6 w-6 text-red-600" />
              <div className="absolute -bottom-1 -left-1 w-8 h-8 bg-red-400 rounded-full opacity-20 animate-pulse"></div>
            </div>
            <div className="absolute left-3 top-5 text-xs bg-white px-1 rounded shadow">Dropoff</div>
          </div>
        )}
        
        {/* Rider location marker */}
        {(riderLocation || simulatedPosition) && (
          <div className="absolute transform -translate-x-1/2 -translate-y-1/2" 
               style={getRelativePosition(simulatedPosition || riderLocation)}>
            <div className="relative">
              <Navigation className="h-6 w-6 text-blue-600" />
              <div className="absolute -bottom-1 -left-1 w-8 h-8 bg-blue-400 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-1 -left-1 w-12 h-12 bg-blue-300 rounded-full opacity-10 animate-ping"></div>
            </div>
            <div className="absolute left-3 top-5 text-xs bg-white px-1 rounded shadow">Rider</div>
          </div>
        )}
        
        {/* Connection lines between points */}
        {pickupLocation && dropoffLocation && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
            <line 
              x1={`${getRelativePosition(pickupLocation).left}`}
              y1={`${getRelativePosition(pickupLocation).top}`}
              x2={`${getRelativePosition(dropoffLocation).left}`}
              y2={`${getRelativePosition(dropoffLocation).top}`}
              stroke="#4B5563"
              strokeWidth="2"
              strokeDasharray="5,5"
              strokeLinecap="round"
            />
          </svg>
        )}
      </>
    );
  };

  // Calculate relative positions for fallback map
  const getRelativePosition = (location: Location | null | undefined) => {
    if (!location) return { left: "50%", top: "50%" };
    
    // Define a center point and bounds for our pseudo-map
    const centerLat = -1.286;
    const centerLng = 36.817;
    const latRange = 0.1;
    const lngRange = 0.1;
    
    // Calculate percentage within view
    const leftPercent = ((location.lng - (centerLng - lngRange/2)) / lngRange) * 90;
    const topPercent = ((location.lat - (centerLat - latRange/2)) / latRange) * 90;
    
    // Clamp values to stay within our container
    const left = Math.min(Math.max(leftPercent, 5), 95);
    const top = Math.min(Math.max(topPercent, 5), 95);
    
    return { left: `${left}%`, top: `${top}%` };
  };
  
  return (
    <div className="w-full h-[300px] bg-gray-100 rounded-lg overflow-hidden relative">
      {/* Google Maps container */}
      <div ref={mapRef} className="absolute inset-0"></div>
      
      {/* Display loading spinner while map loads */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <LoadingSpinner size="md" text="Loading map..." />
        </div>
      )}
      
      {/* Fallback display when there's an error */}
      {mapError && renderFallbackMap()}
      
      {/* Map attribution */}
      <div className="absolute bottom-1 right-1 text-xs text-gray-500 bg-white/80 px-1 rounded z-10">
        {mapError ? 'Map Preview' : 'Google Maps'}
      </div>
    </div>
  );
};

export default LocationMap;
