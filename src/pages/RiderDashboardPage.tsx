
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import { useOrder } from '@/contexts/OrderContext';
import { useRider } from '@/contexts/RiderContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import OrderItem from '@/components/OrderItem';
import { Order } from '@/types';
import LocationMap from '@/components/LocationMap';
import { MapPin, Navigation, Check, X, Phone, User, Settings, LogOut, Bike } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const RiderDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { orders } = useOrder();
  const { riders, updateRiderStatus } = useRider();
  const { toast } = useToast();
  
  // Find rider by user ID (in real app this would be properly linked)
  const [rider, setRider] = useState(riders.find(r => r.id === '1'));
  
  // Mock orders
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('available-orders');
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  useEffect(() => {
    // Filter orders
    if (user) {
      setAvailableOrders(orders.filter(order => 
        !order.riderId && 
        order.status.some(s => s.status === 'pending')
      ));
      
      setMyOrders(orders.filter(order => 
        order.riderId === user.id
      ));
    }
  }, [orders, user]);
  
  // Request location permission when rider goes online
  useEffect(() => {
    if (rider && rider.status === 'available') {
      requestLocationPermission();
    }
  }, [rider?.status]);
  
  const requestLocationPermission = async () => {
    try {
      if ('geolocation' in navigator) {
        toast({
          title: "Location Access",
          description: "Requesting access to your location for accurate order matching.",
        });
        
        navigator.geolocation.getCurrentPosition(
          position => {
            toast({
              title: "Location Access Granted",
              description: "Your location will be used to match you with nearby orders.",
            });
            setLocationEnabled(true);
          },
          error => {
            toast({
              variant: "destructive",
              title: "Location Access Denied",
              description: "You need to enable location services to receive nearby orders.",
            });
            
            if (rider) {
              handleStatusToggle('offline');
            }
          }
        );
        
        // Request notification permission
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            toast({
              title: "Notifications Enabled",
              description: "You will receive notifications for new order requests.",
            });
            setNotificationsEnabled(true);
          }
        }
      }
    } catch (error) {
      console.error("Error requesting permissions:", error);
    }
  };
  
  // Handle rider status toggle
  const handleStatusToggle = (newStatus?: 'available' | 'offline') => {
    if (rider) {
      // If newStatus is not provided, toggle between available and offline
      const status = newStatus || (rider.status === 'available' ? 'offline' : 'available');
        
      updateRiderStatus(rider.id, status);
      setRider({...rider, status});
      
      if (status === 'available') {
        requestLocationPermission();
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLocationToggle = (enabled: boolean) => {
    if (enabled) {
      requestLocationPermission();
    } else {
      setLocationEnabled(false);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      if ('Notification' in window) {
        try {
          const permission = await Notification.requestPermission();
          setNotificationsEnabled(permission === 'granted');
        } catch (error) {
          alert('Notification permission denied.');
        }
      }
    } else {
      setNotificationsEnabled(false);
    }
  };
  
  // Handle accept order
  const handleAcceptOrder = async (order: Order) => {
    setProcessingOrderId(order.id);
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Order Accepted",
        description: "You have been assigned to this delivery.",
      });
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification("New Delivery Assigned", {
          body: `Pickup from: ${order.pickupLocation}`,
          icon: "/favicon.ico"
        });
      }
      
      console.log('Order accepted:', order);
    } catch (error) {
      console.error('Error accepting order:', error);
      toast({
        variant: "destructive",
        title: "Failed to accept order",
        description: "Please try again.",
      });
    } finally {
      setLoading(false);
      setProcessingOrderId(null);
    }
  };
  
  // Handle decline order
  const handleDeclineOrder = async (order: Order) => {
    setProcessingOrderId(order.id);
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Order Declined",
        description: "The order will be assigned to another rider.",
      });
      
      console.log('Order declined:', order);
    } catch (error) {
      console.error('Error declining order:', error);
      toast({
        variant: "destructive",
        title: "Failed to decline order",
        description: "Please try again.",
      });
    } finally {
      setLoading(false);
      setProcessingOrderId(null);
    }
  };

  return (
    <Layout>
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <LoadingSpinner size="lg" text="Processing..." />
        </div>
      )}
      
      {user && rider ? (
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
            {/* User Profile Section */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-boda-600 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
              
              {/* Rider Status */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bike className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Status</span>
                  </div>
                  <Badge className={rider.status === 'available' ? 'bg-green-500' : 'bg-gray-500'}>
                    {rider.status.charAt(0).toUpperCase() + rider.status.slice(1)}
                  </Badge>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  ⭐ 4.8/5 rating | 42 completed deliveries
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 p-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('available-orders')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'available-orders' 
                      ? 'bg-boda-100 text-boda-800 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <MapPin className="inline-block h-4 w-4 mr-2" />
                  Available Orders
                </button>
                
                <button
                  onClick={() => setActiveTab('my-orders')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'my-orders' 
                      ? 'bg-boda-100 text-boda-800 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Bike className="inline-block h-4 w-4 mr-2" />
                  My Orders
                </button>
                
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'settings' 
                      ? 'bg-boda-100 text-boda-800 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="inline-block h-4 w-4 mr-2" />
                  Settings
                </button>
              </nav>
            </div>

            {/* Status Toggle and Logout */}
            <div className="p-4 border-t border-gray-200 space-y-3">
              <Button 
                className={`w-full ${
                  rider.status === 'available' ? 'bg-red-500 hover:bg-red-600' : 'bg-boda-primary hover:bg-boda-600'
                }`}
                onClick={() => handleStatusToggle()}
              >
                {rider.status === 'available' ? 'Go Offline' : 'Go Online'}
              </Button>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">Rider Dashboard</h1>
                  <p className="text-gray-600">Manage your deliveries and availability</p>
                </div>
              </div>

              {/* Location Map */}
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle>Your Current Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <LocationMap riderLocation={rider.location} />
                  <p className="mt-3 text-sm text-center">
                    <MapPin className="inline-block h-4 w-4 mr-1" />
                    Location tracking is active
                  </p>
                </CardContent>
              </Card>

              {/* Content based on active tab */}
              {activeTab === 'available-orders' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Available Orders</h2>
                  <div className="space-y-4">
                    {rider.status === 'available' ? (
                      <>
                        {availableOrders.map(order => (
                          <Card key={order.id} className="overflow-hidden">
                            <div className="p-4">
                              <div className="flex justify-between mb-2">
                                <h3 className="font-semibold">Order #{order.id.slice(-6)}</h3>
                                <Badge className="bg-boda-primary">
                                  Ksh. {Math.floor(1000 + Math.random() * 500)}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm mb-1">
                                    <span className="font-medium">From: </span>
                                    {order.pickupLocation}
                                  </p>
                                  <p className="text-sm mb-1">
                                    <span className="font-medium">To: </span>
                                    {order.dropoffLocation}
                                  </p>
                                  <p className="text-sm mb-1">
                                    <span className="font-medium">Items: </span>
                                    {order.description}
                                  </p>
                                  {order.recipientName && (
                                    <div className="mt-3 p-2 bg-boda-secondary rounded-lg">
                                      <p className="text-sm font-medium mb-1">Recipient Details:</p>
                                      <p className="text-sm">{order.recipientName}</p>
                                      {order.recipientPhone && (
                                        <div className="flex items-center mt-1">
                                          <Phone className="h-4 w-4 text-boda-accent mr-1" />
                                          <a href={`tel:${order.recipientPhone}`} className="text-sm text-boda-accent">
                                            {order.recipientPhone}
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col md:justify-end space-y-2">
                                  <div className="text-right mb-2">
                                    <p className="text-sm font-medium">Distance: ~3.2 km</p>
                                    <p className="text-sm text-gray-600">Estimated time: 15 mins</p>
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <Button 
                                      variant="outline" 
                                      className="border-red-500 text-red-500 hover:bg-red-50"
                                      onClick={() => handleDeclineOrder(order)}
                                      disabled={loading && processingOrderId === order.id}
                                    >
                                      <X className="mr-2 h-4 w-4" />
                                      Decline
                                    </Button>
                                    <Button 
                                      className="bg-boda-primary hover:bg-boda-600"
                                      onClick={() => handleAcceptOrder(order)}
                                      disabled={loading && processingOrderId === order.id}
                                    >
                                      <Check className="mr-2 h-4 w-4" />
                                      Accept
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                        {availableOrders.length === 0 && (
                          <div className="p-8 text-center">
                            <p>No available orders at the moment.</p>
                            <p className="text-sm text-gray-600 mt-2">
                              Stay online to receive new order requests
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-8 text-center">
                        <p>You are currently offline.</p>
                        <Button 
                          className="mt-4 bg-boda-primary hover:bg-boda-600"
                          onClick={() => handleStatusToggle('available')}
                        >
                          <Navigation className="mr-2 h-4 w-4" />
                          Go Online
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'my-orders' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">My Orders</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myOrders.map(order => (
                      <OrderItem
                        key={order.id}
                        order={order}
                        onClick={(order) => navigate(`/order/${order.id}`)}
                      />
                    ))}
                    {myOrders.length === 0 && (
                      <div className="col-span-2 p-8 text-center">
                        <p>You haven't accepted any orders yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Settings</h2>
                  <Card>
                    <CardHeader>
                      <CardTitle>App Permissions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="location-access" className="text-base font-medium">
                            Location Access
                          </Label>
                          <p className="text-sm text-gray-600">
                            Allow the app to access your location for accurate order matching and navigation
                          </p>
                        </div>
                        <Switch
                          id="location-access"
                          checked={locationEnabled}
                          onCheckedChange={handleLocationToggle}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="push-notifications" className="text-base font-medium">
                            Push Notifications
                          </Label>
                          <p className="text-sm text-gray-600">
                            Receive notifications for new order requests and important updates
                          </p>
                        </div>
                        <Switch
                          id="push-notifications"
                          checked={notificationsEnabled}
                          onCheckedChange={handleNotificationToggle}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">You need to log in as a rider to view this page</h2>
          <Button 
            className="mt-4 bg-boda-primary hover:bg-boda-600"
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
