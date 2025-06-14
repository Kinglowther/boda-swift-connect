
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRider } from '@/contexts/RiderContext';

export const useRiderLocation = (
  setIsOnline: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { user } = useAuth();
  const { updateRiderLocation } = useRider();
  const [locationEnabled, setLocationEnabled] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const requestLocationPermission = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser.');
      setLocationEnabled(false);
      return;
    }
  
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
  
      const handlePermissionState = (state: PermissionState) => {
        if (state === 'granted') {
          setLocationEnabled(true);
        } else if (state === 'denied') {
          alert('Location access has been denied. Please enable it in your browser/OS settings.');
          setLocationEnabled(false);
          setIsOnline(false);
        } else { // prompt
          navigator.geolocation.getCurrentPosition(
            () => { // Success after prompt
              setLocationEnabled(true);
            },
            (err) => { // Error after prompt
              if (err.code === err.PERMISSION_DENIED) {
                alert('Location access denied. Please enable location services in your browser/OS settings.');
              } else {
                alert(`Could not get location: ${err.message}`);
              }
              setLocationEnabled(false);
              setIsOnline(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        }
      };
      
      handlePermissionState(permissionStatus.state);
  
      permissionStatus.onchange = () => {
        handlePermissionState(permissionStatus.state);
      };
  
    } catch (error) {
      console.error("Error handling location permission:", error);
      navigator.geolocation.getCurrentPosition(
        () => setLocationEnabled(true),
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            alert('Location access denied. Please enable location services in your browser/OS settings.');
          } else {
            alert('Could not determine location permission status or an error occurred.');
          }
          setLocationEnabled(false);
          setIsOnline(false);
        }
      );
    }
  }, [setIsOnline]);

  useEffect(() => {
    requestLocationPermission();
  }, [requestLocationPermission]);

  const handleLocationToggle = (enabled: boolean) => {
    if (enabled) {
      requestLocationPermission();
    } else {
      setLocationEnabled(false);
      setIsOnline(false); // Rider can't be online without location
    }
  };

  useEffect(() => {
    if (locationEnabled && user && 'geolocation' in navigator) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log(`Rider ${user.id} new location: ${latitude}, ${longitude}`);
          updateRiderLocation(user.id, latitude, longitude);
        },
        (error) => {
          console.error(`Error watching location for rider ${user.id}:`, error.message);
          if (error.code === error.PERMISSION_DENIED) {
            alert('Location access was denied. Please enable it in your browser/OS settings to use this feature. You have been set to Offline.');
            setLocationEnabled(false);
            setIsOnline(false);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        }
      );
    } else {
      if (watchIdRef.current !== null) {
        console.log(`Stopping location watch for rider ${user?.id}`);
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (watchIdRef.current !== null) {
        console.log(`Cleaning up location watch for rider ${user?.id}`);
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [locationEnabled, user, updateRiderLocation, setIsOnline]);

  return { locationEnabled, handleLocationToggle };
};
