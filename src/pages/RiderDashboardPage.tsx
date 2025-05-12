
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
import { MapPin, Navigation, Check, X } from 'lucide-react';

const RiderDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders } = useOrder();
  const { riders, updateRiderStatus } = useRider();
  
  // Find rider by user ID (in real app this would be properly linked)
  const [rider, setRider] = useState(riders.find(r => r.id === '1'));
  
  // Mock orders
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  
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
  
  // Handle rider status toggle
  const handleStatusToggle = () => {
    if (rider) {
      const newStatus = rider.status === 'available' ? 'offline' : 'available';
      updateRiderStatus(rider.id, newStatus);
      setRider({...rider, status: newStatus});
    }
  };
  
  // Handle accept order
  const handleAcceptOrder = (order: Order) => {
    // In a real app, this would make an API call
    console.log('Order accepted:', order);
  };
  
  // Handle decline order
  const handleDeclineOrder = (order: Order) => {
    // In a real app, this would make an API call
    console.log('Order declined:', order);
  };

  return (
    <Layout>
      {user && rider ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Rider Dashboard</h1>
              <p className="text-gray-600">
                Status: {' '}
                <Badge className={rider.status === 'available' ? 'bg-green-500' : 'bg-gray-500'}>
                  {rider.status.charAt(0).toUpperCase() + rider.status.slice(1)}
                </Badge>
              </p>
            </div>
            <Button 
              className={`${
                rider.status === 'available' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
              }`}
              onClick={handleStatusToggle}
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
                          <h3 className="font-semibold mb-2">Order #{order.id.slice(-6)}</h3>
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
                                <p className="text-sm mb-1">
                                  <span className="font-medium">Recipient: </span>
                                  {order.recipientName}
                                  {order.recipientPhone && ` (${order.recipientPhone})`}
                                </p>
                              )}
                            </div>
                            <div className="flex md:justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                className="border-red-500 text-red-500 hover:bg-red-50"
                                onClick={() => handleDeclineOrder(order)}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Decline
                              </Button>
                              <Button 
                                className="bg-green-500 hover:bg-green-600"
                                onClick={() => handleAcceptOrder(order)}
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Accept
                              </Button>
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
                      className="mt-4 bg-green-500 hover:bg-green-600"
                      onClick={handleStatusToggle}
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
            className="mt-4 boda-btn"
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
