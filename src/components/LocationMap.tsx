
import React, { useEffect, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
}

interface LocationMapProps {
  pickupLocation?: Location;
  dropoffLocation?: Location;
  riderLocation?: Location;
  isSimulation?: boolean;
}

const LocationMap: React.FC<LocationMapProps> = ({ 
  pickupLocation, 
  dropoffLocation, 
  riderLocation, 
  isSimulation = false 
}) => {
  const [simulatedPosition, setSimulatedPosition] = useState<Location | undefined>(riderLocation);
  
  // For simulation purposes
  useEffect(() => {
    if (!isSimulation || !pickupLocation || !riderLocation || !dropoffLocation) return;
    
    // Create a path from rider to pickup to dropoff
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
      
      if (simulatedPosition) {
        const progress = step / totalSteps;
        const newLat = simulatedPosition.lat + (currentTarget.lat - simulatedPosition.lat) * (progress * 0.1);
        const newLng = simulatedPosition.lng + (currentTarget.lng - simulatedPosition.lng) * (progress * 0.1);
        
        setSimulatedPosition({ lat: newLat, lng: newLng });
      }
      
      step++;
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isSimulation, pickupLocation, dropoffLocation, riderLocation]);
  
  return (
    <div className="w-full h-[300px] bg-boda-50 rounded-lg overflow-hidden relative">
      {/* This would be a real map in a production app */}
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-gray-400">Interactive map would be here</p>
      </div>
      
      {/* Pickup location marker */}
      {pickupLocation && (
        <div className="absolute" style={{ 
          left: `${30 + Math.random() * 20}%`, 
          top: `${20 + Math.random() * 20}%`
        }}>
          <div className="relative">
            <MapPin className="h-6 w-6 text-green-600" />
            <div className="absolute -bottom-1 -left-1 w-8 h-8 bg-green-400 rounded-full opacity-20 animate-pulse-light"></div>
          </div>
        </div>
      )}
      
      {/* Dropoff location marker */}
      {dropoffLocation && (
        <div className="absolute" style={{ 
          left: `${60 + Math.random() * 20}%`, 
          top: `${60 + Math.random() * 20}%` 
        }}>
          <div className="relative">
            <MapPin className="h-6 w-6 text-red-600" />
            <div className="absolute -bottom-1 -left-1 w-8 h-8 bg-red-400 rounded-full opacity-20 animate-pulse-light"></div>
          </div>
        </div>
      )}
      
      {/* Rider location marker */}
      {(riderLocation || simulatedPosition) && (
        <div className="absolute" style={{ 
          left: `${simulatedPosition ? (40 + Math.random() * 5) : (10 + Math.random() * 10)}%`, 
          top: `${simulatedPosition ? (40 + Math.random() * 5) : (40 + Math.random() * 10)}%` 
        }}>
          <div className="relative">
            <Navigation className="h-6 w-6 text-blue-600" />
            <div className="absolute -bottom-1 -left-1 w-8 h-8 bg-blue-400 rounded-full opacity-20 animate-pulse-light"></div>
            <div className="absolute -bottom-1 -left-1 w-12 h-12 bg-blue-300 rounded-full opacity-10 animate-ripple"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationMap;
