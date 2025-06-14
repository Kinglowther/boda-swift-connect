import React, { createContext, useContext, useState, useEffect } from 'react';
import L from 'leaflet';
import { Rider } from '../types';
import { useToast } from '@/components/ui/use-toast';
import { getRouteDetails } from '@/services/distanceService';

interface RiderContextType {
  riders: Rider[];
  activeRiders: Rider[];
  registerRider: (riderData: Partial<Rider>) => Promise<boolean>;
  updateRiderStatus: (riderId: string, status: Rider['status']) => void;
  updateRiderLocation: (riderId: string, lat: number, lng: number) => void;
  getNearestRider: (lat: number, lng: number) => Promise<Rider | null>;
}

const RiderContext = createContext<RiderContextType | undefined>(undefined);

export const useRider = () => {
  const context = useContext(RiderContext);
  if (!context) {
    throw new Error('useRider must be used within a RiderProvider');
  }
  return context;
};

// Mock riders data
const mockRiders: Rider[] = [
  {
    id: '1',
    name: 'Robert Rider',
    phone: '0723456789',
    bikeRegNumber: 'KAA 123B',
    idNumber: '12345678',
    licenseNumber: 'DL001234',
    profileImage: '/placeholder.svg',
    idImage: '/placeholder.svg',
    idBackImage: '/placeholder.svg',
    licenseImage: '/placeholder.svg',
    licenseBackImage: '/placeholder.svg',
    vehicleRegFrontImage: '/placeholder.svg',
    vehicleRegBackImage: '/placeholder.svg',
    status: 'available',
    location: { lat: -1.286389, lng: 36.817223 }
  },
  {
    id: '2',
    name: 'Michael Moto',
    phone: '0734567890',
    bikeRegNumber: 'KBB 456C',
    idNumber: '23456789',
    licenseNumber: 'DL002345',
    profileImage: '/placeholder.svg',
    idImage: '/placeholder.svg',
    idBackImage: '/placeholder.svg',
    licenseImage: '/placeholder.svg',
    licenseBackImage: '/placeholder.svg',
    vehicleRegFrontImage: '/placeholder.svg',
    vehicleRegBackImage: '/placeholder.svg',
    status: 'offline',
    location: { lat: -1.289389, lng: 36.827223 }
  }
];

export const RiderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [riders, setRiders] = useState<Rider[]>(mockRiders);
  const [activeRiders, setActiveRiders] = useState<Rider[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Filter active riders
    setActiveRiders(riders.filter(rider => rider.status === 'available'));

    // Simulate riders moving around (for demo)
    const interval = setInterval(() => {
      setRiders(prevRiders => 
        prevRiders.map(rider => {
          if (rider.status === 'available' && rider.location) {
            // Random small movement
            const lat = rider.location.lat + (Math.random() * 0.002 - 0.001);
            const lng = rider.location.lng + (Math.random() * 0.002 - 0.001);
            return {...rider, location: { lat, lng }};
          }
          return rider;
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [riders]);

  const registerRider = async (riderData: Partial<Rider>): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (!riderData.name || !riderData.phone || !riderData.bikeRegNumber) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "Please fill in all required fields",
      });
      return false;
    }
    
    const newRider: Rider = {
      id: `rider-${Date.now()}`,
      name: riderData.name || '',
      phone: riderData.phone || '',
      bikeRegNumber: riderData.bikeRegNumber || '',
      idNumber: riderData.idNumber || '',
      licenseNumber: riderData.licenseNumber || '',
      profileImage: riderData.profileImage || '/placeholder.svg',
      idImage: riderData.idImage || '/placeholder.svg',
      idBackImage: riderData.idBackImage || '/placeholder.svg',
      licenseImage: riderData.licenseImage || '/placeholder.svg',
      licenseBackImage: riderData.licenseBackImage || '/placeholder.svg',
      vehicleRegFrontImage: riderData.vehicleRegFrontImage || '/placeholder.svg',
      vehicleRegBackImage: riderData.vehicleRegBackImage || '/placeholder.svg',
      status: 'available',
      location: { lat: -1.286389 + Math.random() * 0.01, lng: 36.817223 + Math.random() * 0.01 }
    };
    
    setRiders(prev => [...prev, newRider]);
    
    toast({
      title: "Registration Successful",
      description: "Your rider profile has been created. You can now accept rides.",
    });
    
    return true;
  };

  const updateRiderStatus = (riderId: string, status: Rider['status']) => {
    setRiders(prev => 
      prev.map(rider => 
        rider.id === riderId 
          ? { ...rider, status } 
          : rider
      )
    );
  };

  const updateRiderLocation = (riderId: string, lat: number, lng: number) => {
    setRiders(prev => 
      prev.map(rider => 
        rider.id === riderId 
          ? { ...rider, location: { lat, lng } } 
          : rider
      )
    );
  };

  const getNearestRider = async (lat: number, lng: number): Promise<Rider | null> => {
    if (activeRiders.length === 0) {
      return null;
    }

    const availableRiders = activeRiders.filter(rider => rider.location);
    if (availableRiders.length === 0) return null;

    const riderDistances = await Promise.all(
      availableRiders.map(async (rider) => {
        try {
          const route = await getRouteDetails([
            { lat: rider.location!.lat, lng: rider.location!.lng },
            { lat, lng }
          ], 'cycling-road');
          return { rider, distance: route.distance };
        } catch (error) {
          console.error(`Could not calculate distance for rider ${rider.id}`, error);
          const orderLocation = L.latLng(lat, lng);
          const riderLocation = L.latLng(rider.location!.lat, rider.location!.lng);
          const distance = orderLocation.distanceTo(riderLocation) / 1000; // in km
          return { rider, distance };
        }
      })
    );
    
    const validRiders = riderDistances.filter(rd => rd.distance !== Infinity);

    if (validRiders.length === 0) {
      return null;
    }
    
    validRiders.sort((a, b) => a.distance - b.distance);
    return validRiders[0].rider;
  };

  return (
    <RiderContext.Provider 
      value={{ 
        riders, 
        activeRiders, 
        registerRider, 
        updateRiderStatus, 
        updateRiderLocation, 
        getNearestRider
      }}
    >
      {children}
    </RiderContext.Provider>
  );
};
