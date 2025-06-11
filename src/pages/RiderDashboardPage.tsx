
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import OrderItem from '@/components/OrderItem';
import { Order } from '@/types';
import LocationMap from '@/components/LocationMap';
import { MapPin, Navigation, Check, X, Phone, User, Settings, LogOut, Bike, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const RiderDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { orders, acceptOrder, declineOrder, updateOrderStatus } = useOrder();
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
  
  // Request location permission when rider goes online - always on for riders
  useEffect(() => {
    if (rider && rider.status === 'available') {
      requestLocationPermission();
    }
  }, [rider?.status]);
  
  const requestLocationPermission = async () => {
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          position => {
            toast({
              title: "Location Tracking Active",
              description: "Your location is being tracked for order assignments.",
            });
          },
          error => {
            toast({
              variant: "destructive",
              title: "Location Required",
              description: "Location access is mandatory for riders. Please enable location services.",
            });
            
            if (rider) {
              handleStatusToggle('offline');
            }
          }
        );
      }
    } catch (error) {
      console.error("Error requesting location permission:", error);
    }
  };
  
  // Handle rider status toggle
  const handleStatusToggle = (newStatus?: 'available' | 'offline') => {
    if (rider) {
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

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      if ('Notification' in window) {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            setNotificationsEnabled(true);
            toast({
              title: "Notifications Enabled",
              description: "You will receive notifications for new order requests.",
            });
          } else {
            setNotificationsEnabled(false);
            toast({
              variant: "destructive",
              title: "Notification Permission Denied",
              description: "Please enable notifications in your browser settings.",
            });
          }
        } catch (error) {
          console.error('Notification permission error:', error);
          setNotificationsEnabled(false);
          toast({
            variant: "destructive",
            title: "Notification Error",
            description: "Failed to enable notifications.",
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Notifications Not Supported",
          description: "Your browser doesn't support notifications.",
        });
      }
    } else {
      setNotificationsEnabled(false);
      toast({
        title: "Notifications Disabled",
        description: "You will no longer receive push notifications.",
      });
    }
  };
  
  // Handle accept order
  const handleAcceptOrder = async (order: Order) => {
    setProcessingOrderId(order.id);
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Accept the order and assign to current rider
      const success = await acceptOrder(order.id, user?.id || '');
      
      if (success) {
        // Remove from available orders
        setAvailableOrders(prev => prev.filter(o => o.id !== order.id));
        
        // Add to my orders with updated rider assignment
        const updatedOrder = {
          ...order,
          riderId: user?.id,
          status: [
            ...order.status,
            { status: 'accepted' as const, timestamp: new Date().toISOString() }
          ],
          updatedAt: new Date().toISOString()
        };
        setMyOrders(prev => [...prev, updatedOrder]);
        
        toast({
          title: "Order Accepted",
          description: "You have been assigned to this delivery. Check 'My Orders' section.",
        });
        
        if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
          new Notification("New Delivery Assigned", {
            body: `Pickup from: ${order.pickupLocation}`,
            icon: "/favicon.ico"
          });
        }
        
        // Switch to My Orders tab
        setActiveTab('my-orders');
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
      
      const success = await declineOrder(order.id);
      
      if (success) {
        // Remove from available orders for this rider
        setAvailableOrders(prev => prev.filter(o => o.id !== order.id));
        
        toast({
          title: "Order Declined",
          description: "The order will be assigned to another rider.",
        });
      }
      
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

  // Handle order status updates (ongoing/completed)
  const handleUpdateOrderStatus = async (orderId: string, status: 'in-progress' | 'completed') => {
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const success = await updateOrderStatus(orderId, status);
      
      if (success) {
        // Update local state
        setMyOrders(prev => 
          prev.map(order => 
            order.id === orderId 
              ? {
                  ...order,
                  status: [
                    ...order.status,
                    { status, timestamp: new Date().toISOString() }
                  ],
                  updatedAt: new Date().toISOString()
                }
              : order
          )
        );
        
        toast({
          title: `Order ${status === 'in-progress' ? 'Started' : 'Completed'}`,
          description: status === 'in-progress' 
            ? "Order marked as in progress" 
            : "Order completed successfully",
        });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        variant: "destructive",
        title: "Failed to update order",
        description: "Please try again.",
      });
    } finally {
      setLoading(false);
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
          <div className="w-80 bg-white dark:bg-gray-900 shadow-lg border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* User Profile Section */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user.profileImage} alt={user.name} />
                  <AvatarFallback className="bg-boda-600 text-white">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{user.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
              
              {/* Rider Status */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bike className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-green-800 dark:text-green-200">Status</span>
                  </div>
                  <Badge className={rider.status === 'available' ? 'bg-green-500' : 'bg-gray-500'}>
                    {rider.status.charAt(0).toUpperCase() + rider.status.slice(1)}
                  </Badge>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
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
                      ? 'bg-boda-100 dark:bg-boda-800/50 text-boda-800 dark:text-boda-200 font-medium' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <MapPin className="inline-block h-4 w-4 mr-2" />
                  Available Orders
                </button>
                
                <button
                  onClick={() => setActiveTab('my-orders')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'my-orders' 
                      ? 'bg-boda-100 dark:bg-boda-800/50 text-boda-800 dark:text-boda-200 font-medium' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Bike className="inline-block h-4 w-4 mr-2" />
                  My Orders ({myOrders.length})
                </button>
                
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'settings' 
                      ? 'bg-boda-100 dark:bg-boda-800/50 text-boda-800 dark:text-boda-200 font-medium' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Settings className="inline-block h-4 w-4 mr-2" />
                  Settings
                </button>
              </nav>
            </div>

            {/* Status Toggle and Logout */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
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
                className="w-full justify-start text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
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
                    Location tracking is active (Required for riders)
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
                                  Ksh. {order.price || 200}
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
                  <div className="space-y-4">
                    {myOrders.map(order => {
                      const currentStatus = order.status[order.status.length - 1].status;
                      return (
                        <Card key={order.id} className="overflow-hidden">
                          <div className="p-4">
                            <div className="flex justify-between mb-2">
                              <h3 className="font-semibold">Order #{order.id.slice(-6)}</h3>
                              <div className="flex items-center space-x-2">
                                <Badge className="bg-boda-primary">
                                  Ksh. {order.price || 200}
                                </Badge>
                                <Badge className={
                                  currentStatus === 'accepted' ? 'bg-blue-100 text-blue-800' :
                                  currentStatus === 'in-progress' ? 'bg-purple-100 text-purple-800' :
                                  currentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }>
                                  {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                                </Badge>
                              </div>
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
                                {currentStatus === 'accepted' && (
                                  <Button 
                                    className="bg-purple-600 hover:bg-purple-700"
                                    onClick={() => handleUpdateOrderStatus(order.id, 'in-progress')}
                                    disabled={loading}
                                  >
                                    <Clock className="mr-2 h-4 w-4" />
                                    Mark as Ongoing
                                  </Button>
                                )}
                                {currentStatus === 'in-progress' && (
                                  <Button 
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                                    disabled={loading}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Mark as Completed
                                  </Button>
                                )}
                                {currentStatus === 'completed' && (
                                  <p className="text-green-600 text-sm font-medium">
                                    ✓ Delivery Completed
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
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
                            Location tracking is always enabled for riders (Required for order assignments)
                          </p>
                        </div>
                        <Switch
                          id="location-access"
                          checked={true}
                          disabled={true}
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
