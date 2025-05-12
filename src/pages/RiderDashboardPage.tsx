
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
import { MapPin, Navigation, Check, X, Phone } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

const RiderDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
            
            // In a real app, this would update the rider's location in the backend
          },
          error => {
            toast({
              variant: "destructive",
              title: "Location Access Denied",
              description: "You need to enable location services to receive nearby orders.",
            });
            
            // If location access is denied, set rider offline
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
          }
        }
      }
    } catch (error) {
      console.error("Error requesting permissions:", error);
    }
  };
  
  // Handle rider status toggle
  const handleStatusToggle = (newStatus: 'available' | 'offline' = 'auto') => {
    if (rider) {
      // If auto, toggle the current status
      const status = newStatus === 'auto' 
        ? (rider.status === 'available' ? 'offline' : 'available')
        : newStatus;
        
      updateRiderStatus(rider.id, status);
      setRider({...rider, status});
      
      if (status === 'available') {
        requestLocationPermission();
      }
    }
  };
  
  // Handle accept order
  const handleAcceptOrder = async (order: Order) => {
    setProcessingOrderId(order.id);
    setLoading(true);
    
    // In a real app, this would make an API call
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Order Accepted",
        description: "You have been assigned to this delivery.",
      });
      
      // Try to show a notification
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
    
    // In a real app, this would make an API call
    try {
      // Simulate API call
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
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Rider Dashboard</h1>
              <p className="text-gray-600">
                Status: {' '}
                <Badge className={rider.status === 'available' ? 'bg-boda-primary' : 'bg-gray-500'}>
                  {rider.status.charAt(0).toUpperCase() + rider.status.slice(1)}
                </Badge>
              </p>
            </div>
            <Button 
              className={`${
                rider.status === 'available' ? 'bg-red-500 hover:bg-red-600' : 'bg-boda-primary hover:bg-boda-600'
              }`}
              onClick={() => handleStatusToggle()}
            >
              {rider.status === 'available' ? 'Go Offline' : 'Go Online'}
            </Button>
          </div>
          
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
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
                <p className="text-sm text-green-800">
                  <span className="font-semibold">Rider Performance: </span>
                  <span className="ml-1">⭐ 4.8/5 rating | 42 completed deliveries</span>
                </p>
                <p className="text-sm text-green-800 mt-1">
                  <span className="font-semibold">Loyalty Points: </span>
                  <span className="ml-1">215 points (Worth Ksh. 107.50)</span>
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="available" className="w-full">
            <TabsList>
              <TabsTrigger value="available">Available Orders</TabsTrigger>
              <TabsTrigger value="my">My Orders</TabsTrigger>
            </TabsList>
            <TabsContent value="available" className="mt-4">
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
            </TabsContent>
            <TabsContent value="my" className="mt-4">
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
            </TabsContent>
          </Tabs>
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
