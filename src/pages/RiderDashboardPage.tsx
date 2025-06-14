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

// Import new components
import RiderSidebar from '@/components/rider-dashboard/RiderSidebar';
import AvailableOrdersTab from '@/components/rider-dashboard/AvailableOrdersTab';
import MyOrdersTab from '@/components/rider-dashboard/MyOrdersTab';
import SettingsTab from '@/components/rider-dashboard/SettingsTab';

const RiderDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { orders, acceptOrder } = useOrder();
  const { updateRiderLocation } = useRider();

  const [activeTab, setActiveTab] = useState('available-orders');
  const [isOnline, setIsOnline] = useState(false);
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
  const riderOrders = user ? orders.filter(order => order.riderId === user.id) : [];
  const availableOrders = orders.filter(order => !order.riderId);

  const handleAcceptOrder = (orderId: string) => {
    if (user && isOnline) {
      acceptOrder(orderId, user.id);
      // Potentially add a toast notification here for success
    } else if (!isOnline) {
      alert('You need to be online to accept orders');
    }
  };

  const handleLogout = () => {
    logout();
    // Navigation is handled by AuthContext logout now
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
          navigator.geolocation.getCurrentPosition(
            () => { 
              setLocationEnabled(true);
            },
            (err) => { 
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
        }
      );
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationsEnabled(permission === 'granted');
        if (permission !== 'granted') {
            alert('Push notifications permission was not granted.');
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        alert('Could not request notification permission.');
      }
    } else {
        alert('This browser does not support desktop notification');
    }
  };

  const handleLocationToggle = (enabled: boolean) => {
    if (enabled) {
      requestLocationPermission();
    } else {
      setLocationEnabled(false);
      // If turning off location, also turn rider offline as location is crucial
      setIsOnline(false); 
    }
  };

  const handleNotificationToggle = (enabled: boolean) => {
    if (enabled) {
      requestNotificationPermission();
    } else {
      setNotificationsEnabled(false);
    }
  };

  useEffect(() => {
    if (locationEnabled && user && 'geolocation' in navigator && isOnline) { // Added isOnline check
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
            alert('Location access was denied. Please enable it in your browser/OS settings. You have been set to Offline.');
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
  }, [locationEnabled, user, updateRiderLocation, setIsOnline, isOnline]); // Added isOnline to dependencies


  // Effect to go offline if location is disabled
  useEffect(() => {
    if (!locationEnabled && isOnline) {
      setIsOnline(false);
      alert("You've been set to offline because location access is disabled or was denied.");
    }
  }, [locationEnabled, isOnline, setIsOnline]);


  const sidebarProps = {
    user,
    riderStats,
    isOnline,
    setIsOnline,
    activeTab,
    handleTabChange,
    handleLogout,
  };

  if (!user) { // Handle case where user might not be loaded yet
      return (
          <Layout>
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-foreground">Loading user data or not logged in...</h2>
                <Button 
                  className="mt-4 bg-green-500 hover:bg-green-600"
                  onClick={() => navigate('/login')}
                >
                  Login
                </Button>
              </div>
          </Layout>
      );
  }

  return (
    <Layout>
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex w-80 bg-card shadow-lg border-r border-border flex-col">
          <RiderSidebar {...sidebarProps} />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden fixed top-20 left-4 z-50 bg-background shadow-lg" // Adjusted top to avoid overlap with potential header
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <div className="flex flex-col h-full bg-card">
              <RiderSidebar {...sidebarProps} />
            </div>
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-6">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="lg:ml-0 ml-12"> {/* Adjust margin for mobile menu button */}
                <h1 className="text-2xl font-bold text-foreground">Rider Dashboard</h1>
                <p className="text-muted-foreground">
                  Status: <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </p>
              </div>
              <Badge 
                variant={isOnline ? "default" : "secondary"}
                className={`${isOnline ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`} // Explicit colors for offline
              >
                {isOnline ? 'Available' : 'Offline'}
              </Badge>
            </div>

            {activeTab === 'available-orders' && (
              <AvailableOrdersTab
                availableOrders={availableOrders}
                isOnline={isOnline}
                locationEnabled={locationEnabled}
                handleAcceptOrder={handleAcceptOrder}
                onOrderItemClick={(order) => navigate(`/order/${order.id}`)}
              />
            )}

            {activeTab === 'my-orders' && (
              <MyOrdersTab
                riderOrders={riderOrders}
                onOrderItemClick={(order) => navigate(`/order/${order.id}`)}
              />
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
    </Layout>
  );
};

export default RiderDashboardPage;
