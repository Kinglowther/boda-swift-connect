
import React, { useEffect, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
}

interface LocationMapProps {
  pickupLocation?: Location | null;
  dropoffLocation?: Location | null;
  riderLocation?: Location | null;
  isSimulation?: boolean;
}

const LocationMap: React.FC<LocationMapProps> = ({ 
  pickupLocation, 
  dropoffLocation, 
  riderLocation, 
  isSimulation = false 
}) => {
  const [simulatedRiderPosition, setSimulatedRiderPosition] = useState<Location | undefined>();
  
  // For simulation purposes
  useEffect(() => {
    if (!isSimulation || !pickupLocation || !dropoffLocation) {
      setSimulatedRiderPosition(undefined); // Clear simulation if not active
      return;
    }
    
    // Create a path from origin to pickup to dropoff
    let step = 0;
    const totalSteps = 20;
    let currentTarget = pickupLocation;
    let reachedPickup = false;
    let currentPosition = riderLocation || { lat: -1.28 + Math.random() * 0.05, lng: 36.81 + Math.random() * 0.05 };
    
    const interval = setInterval(() => {
      if (step >= totalSteps) {
        if (!reachedPickup) {
          reachedPickup = true;
          step = 0;
          currentPosition = pickupLocation;
          currentTarget = dropoffLocation;
        } else {
          clearInterval(interval);
          return;
        }
      }
      
      const progress = step / totalSteps;
      const newLat = currentPosition.lat + (currentTarget.lat - currentPosition.lat) * (progress * 0.2);
      const newLng = currentPosition.lng + (currentTarget.lng - currentPosition.lng) * (progress * 0.2);
      
      setSimulatedRiderPosition({ lat: newLat, lng: newLng });
      
      step++;
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isSimulation, pickupLocation, dropoffLocation, riderLocation]);

  const displayRiderLocation = isSimulation ? simulatedRiderPosition : riderLocation;
  
  // Calculate relative positions for the markers based on coordinates
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
  
  // Check if we have coordinates to show
  const hasCoordinates = pickupLocation || dropoffLocation || displayRiderLocation;
  
  return (
    <div className="w-full h-[300px] bg-gray-100 rounded-lg overflow-hidden relative">
      {!hasCoordinates && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-400">Map waiting for location data...</p>
        </div>
      )}
      
      {/* Map background with subtle grid */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)', 
          backgroundSize: '20px 20px'
        }}></div>
      </div>
      
      {/* Pickup location marker */}
      {pickupLocation && (
        <div className="absolute transform -translate-x-1/2 -translate-y-1/2" style={getRelativePosition(pickupLocation)}>
          <div className="relative">
            <MapPin className="h-6 w-6 text-green-600" />
            <div className="absolute -bottom-1 -left-1 w-8 h-8 bg-green-400 rounded-full opacity-20 animate-pulse"></div>
          </div>
          <div className="absolute left-3 top-5 text-xs bg-white px-1 rounded shadow">Pickup</div>
        </div>
      )}
      
      {/* Dropoff location marker */}
      {dropoffLocation && (
        <div className="absolute transform -translate-x-1/2 -translate-y-1/2" style={getRelativePosition(dropoffLocation)}>
          <div className="relative">
            <MapPin className="h-6 w-6 text-red-600" />
            <div className="absolute -bottom-1 -left-1 w-8 h-8 bg-red-400 rounded-full opacity-20 animate-pulse"></div>
          </div>
          <div className="absolute left-3 top-5 text-xs bg-white px-1 rounded shadow">Dropoff</div>
        </div>
      )}
      
      {/* Rider location marker */}
      {displayRiderLocation && (
        <div className="absolute transform -translate-x-1/2 -translate-y-1/2" style={getRelativePosition(displayRiderLocation)}>
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
      
      {/* Map attribution */}
      <div className="absolute bottom-1 right-1 text-xs text-gray-500 bg-white/80 px-1 rounded">
        Interactive Map Preview
      </div>
    </div>
  );
};

export default LocationMap;
