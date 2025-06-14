import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useOrder } from '@/contexts/OrderContext';
import { useRider } from '@/contexts/RiderContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import RiderSidebar from '@/components/rider-dashboard/RiderSidebar';
import AvailableOrdersTab from '@/components/rider-dashboard/AvailableOrdersTab';
import MyOrdersTab from '@/components/rider-dashboard/MyOrdersTab';
import SettingsTab from '@/components/rider-dashboard/SettingsTab';

const RiderDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { orders, acceptOrder } = useOrder();
  const { riders, updateRiderLocation, updateRiderStatus } = useRider();

  const [activeTab, setActiveTab] = useState('available-orders');
  const [isOnline, setIsOnline] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Mock rider stats
  const [riderStats] = useState({
    totalEarnings: 15750,
    completedRides: 127,
    rating: 4.8,
    shujaaPoints: 890
  });

  // Get rider's orders
  const rider = user ? riders.find(r => r.id === user.id) : null;
  const riderLocation = rider?.location;
  const riderOrders = user ? orders.filter(order => order.riderId === user.id) : [];
  const availableOrders = orders.filter(order => !order.riderId);

  const handleAcceptOrder = (orderId: string) => {
    if (user && isOnline) {
      acceptOrder(orderId, user.id);
    } else if (!isOnline) {
      alert('You need to be online to accept orders');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSidebarOpen(false); // Close sidebar on mobile when tab changes
  };

  const requestLocationPermission = async () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser.');
      setLocationEnabled(false); // Ensure switch reflects reality
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
        } else { // prompt
          // For 'prompt', we need to actively request it to show the dialog
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
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        }
      };
      
      // Set initial state based on current permission
      handlePermissionState(permissionStatus.state);
  
      // Listen for changes in permission status (e.g., user changes it in browser settings)
      permissionStatus.onchange = () => {
        handlePermissionState(permissionStatus.state);
      };
  
    } catch (error) {
      console.error("Error handling location permission:", error);
      // Fallback for browsers that might not support navigator.permissions.query well for geolocation
      // or other unexpected errors. Attempt a direct getCurrentPosition.
      navigator.geolocation.getCurrentPosition(
        () => setLocationEnabled(true),
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            alert('Location access denied. Please enable location services in your browser/OS settings.');
          } else {
            alert('Could not determine location permission status or an error occurred.');
          }
          setLocationEnabled(false);
        }
      );
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationsEnabled(permission === 'granted');
      } catch (error) {
        alert('Notification permission denied.');
      }
    }
  };

  useEffect(() => {
    requestLocationPermission();
    requestNotificationPermission();
  }, []);

  const handleLocationToggle = (enabled: boolean) => {
    if (enabled) {
      requestLocationPermission();
    } else {
      setLocationEnabled(false);
      setIsOnline(false); // Rider can't be online without location
    }
  };

  const handleNotificationToggle = (enabled: boolean) => {
    if (enabled) {
      requestNotificationPermission();
    } else {
      setNotificationsEnabled(false);
    }
  };

  const handleIsOnlineChange = (online: boolean) => {
    if (online && !locationEnabled) {
      alert('Please enable location access in Settings to go online.');
      setIsOnline(false); // Keep it false if toggled on without permission
      return;
    }
    setIsOnline(online);
  };

  useEffect(() => {
    if (user && updateRiderStatus) {
      // Make sure rider is found before updating status
      const currentRider = riders.find(r => r.id === user.id);
      if (currentRider) {
        updateRiderStatus(user.id, isOnline ? 'available' : 'offline');
      }
    }
  }, [isOnline, user, updateRiderStatus, riders]);

  useEffect(() => {
    if (locationEnabled && user && 'geolocation' in navigator) {
      // Clear any existing watch before starting a new one
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
            setLocationEnabled(false); // Turn off the switch
            setIsOnline(false); // Rider can't be online without location
          }
          // Other errors (TIMEOUT, POSITION_UNAVAILABLE) might be transient.
        },
        {
          enableHighAccuracy: true,
          timeout: 20000, // 20 seconds timeout for getting a position
          maximumAge: 0, // Do not use a cached position
        }
      );
    } else {
      // If location is disabled or user logs out, clear the watch
      if (watchIdRef.current !== null) {
        console.log(`Stopping location watch for rider ${user?.id}`);
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    // Cleanup function to clear watch on component unmount or when dependencies change
    return () => {
      if (watchIdRef.current !== null) {
        console.log(`Cleaning up location watch for rider ${user?.id}`);
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null; // Ensure ref is cleared
      }
    };
  }, [locationEnabled, user, updateRiderLocation, setLocationEnabled, setIsOnline]);

  return (
    <Layout>
      {user ? (
        <div className="flex min-h-screen">
          {/* Desktop Sidebar */}
          <div className="hidden lg:flex w-80 bg-card shadow-lg border-r border-border flex-col">
            <RiderSidebar 
              user={user} 
              riderStats={riderStats} 
              isOnline={isOnline} 
              setIsOnline={handleIsOnlineChange} 
              activeTab={activeTab} 
              handleTabChange={handleTabChange} 
              handleLogout={handleLogout} 
            />
          </div>

          {/* Mobile Sidebar */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden fixed top-20 left-4 z-50 bg-background shadow-lg"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="flex flex-col h-full bg-card">
                <RiderSidebar 
                  user={user} 
                  riderStats={riderStats} 
                  isOnline={isOnline} 
                  setIsOnline={handleIsOnlineChange} 
                  activeTab={activeTab} 
                  handleTabChange={handleTabChange} 
                  handleLogout={handleLogout} 
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Main Content */}
          <div className="flex-1 p-4 lg:p-6">
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="lg:ml-0 ml-12">
                  <h1 className="text-2xl font-bold text-foreground">Rider Dashboard</h1>
                  <p className="text-muted-foreground">
                    Status: <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </p>
                </div>
                <Badge 
                  variant={isOnline ? "default" : "secondary"}
                  className={isOnline ? "bg-green-500" : ""}
                >
                  {isOnline ? 'Available' : 'Offline'}
                </Badge>
              </div>

              {/* Render active tab content using new components */}
              {activeTab === 'available-orders' && (
                <AvailableOrdersTab 
                  isOnline={isOnline}
                  locationEnabled={locationEnabled}
                  availableOrders={availableOrders}
                  handleAcceptOrder={handleAcceptOrder}
                  riderLocation={riderLocation}
                />
              )}

              {activeTab === 'my-orders' && (
                <MyOrdersTab riderOrders={riderOrders} riderLocation={riderLocation} />
              )}

              {activeTab === 'settings' && (
                <SettingsTab 
                  locationEnabled={locationEnabled}
                  handleLocationToggle={handleLocationToggle}
                  notificationsEnabled={notificationsEnabled}
                  handleNotificationToggle={handleNotificationToggle}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-foreground">You need to log in to view this page</h2>
          <Button 
            className="mt-4 bg-green-500 hover:bg-green-600"
            onClick={() => navigate('/login')}
          >
            Login
          </Button>
        </div>
      )}
    </Layout>
  );
};

export default RiderDashboardPage;
