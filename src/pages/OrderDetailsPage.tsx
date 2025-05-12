
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useOrder } from '@/contexts/OrderContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import LocationMap from '@/components/LocationMap';
import { format } from 'date-fns';
import { MapPin, Phone, Clock, X } from 'lucide-react';

const OrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders, cancelOrder } = useOrder();
  
  // Find the order
  const order = orders.find(o => o.id === id);
  
  // Simulate tracking location
  const [dummyLocation, setDummyLocation] = useState({ lat: -1.286389, lng: 36.817223 });
  
  useEffect(() => {
    if (!user || !order) {
      return;
    }
    
    // Only for active orders
    const isActive = order.status.some(s => 
      s.status !== 'completed' && s.status !== 'cancelled'
    );
    
    if (!isActive) {
      return;
    }
    
    // Simulate rider location updates
    const interval = setInterval(() => {
      setDummyLocation(prev => ({
        lat: prev.lat + (Math.random() * 0.002 - 0.001),
        lng: prev.lng + (Math.random() * 0.002 - 0.001),
      }));
    }, 5000);
    
    return () => clearInterval(interval);
  }, [order, user]);
  
  // Get the current status
  const currentStatus = order?.status[order.status.length - 1].status;
  
  // Status colors
  const statusColors = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'accepted': 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-purple-100 text-purple-800',
    'completed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800'
  };
  
  // Format the date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };
  
  // Handle order cancellation
  const handleCancelOrder = async () => {
    if (order) {
      const success = await cancelOrder(order.id);
      if (success) {
        navigate(`/${user?.role}-dashboard`);
      }
    }
  };
  
  if (!user) {
    navigate('/login');
    return null;
  }
  
  if (!order) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Order not found</h2>
          <Button 
            className="mt-4 boda-btn"
            onClick={() => navigate(`/${user.role}-dashboard`)}
          >
            Back to Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Order #{order.id.slice(-6)}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={statusColors[currentStatus]}>
                {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
              </Badge>
              <span className="text-sm text-gray-600">
                Created on {formatDate(order.createdAt)}
              </span>
            </div>
          </div>
          
          {currentStatus === 'pending' && order.customerId === user.id && (
            <Button 
              variant="outline" 
              className="border-red-500 text-red-500 hover:bg-red-50"
              onClick={handleCancelOrder}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel Order
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Locations</h3>
                <div className="flex items-start space-x-2">
                  <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Pickup Location</p>
                    <p className="text-gray-600">{order.pickupLocation}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2 mt-3">
                  <MapPin className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Dropoff Location</p>
                    <p className="text-gray-600">{order.dropoffLocation}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Item Details</h3>
                <p>{order.description}</p>
              </div>
              
              {order.recipientName && (
                <div>
                  <h3 className="font-medium mb-2">Recipient Information</h3>
                  <p>{order.recipientName}</p>
                  {order.recipientPhone && (
                    <div className="flex items-center mt-1">
                      <Phone className="h-4 w-4 mr-2 text-gray-600" />
                      <a 
                        href={`tel:${order.recipientPhone}`} 
                        className="text-boda-600 hover:underline"
                      >
                        {order.recipientPhone}
                      </a>
                    </div>
                  )}
                </div>
              )}
              
              <div>
                <h3 className="font-medium mb-2">Status Timeline</h3>
                <div className="space-y-3">
                  {order.status.map((status, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="relative">
                        <div className="h-6 w-6 rounded-full bg-boda-100 flex items-center justify-center">
                          <Clock className="h-3 w-3 text-boda-600" />
                        </div>
                        {index !== order.status.length - 1 && (
                          <div className="absolute top-6 left-3 w-0.5 h-6 bg-gray-200"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(status.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Live Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <LocationMap 
                pickupLocation={{ lat: -1.286389, lng: 36.817223 }}
                dropoffLocation={{ lat: -1.289389, lng: 36.827223 }}
                riderLocation={dummyLocation}
                isSimulation={currentStatus === 'in-progress'}
              />
              
              <div className="mt-4">
                <h3 className="font-medium mb-2">Estimated Times</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Pickup:</span>
                    <span className="font-medium">~5 mins</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery:</span>
                    <span className="font-medium">~15 mins</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-boda-50 rounded-lg">
                <p className="text-sm text-boda-800">
                  <strong>Note:</strong> This is a demo application. In a real app, this would show the actual live location of the rider and accurate time estimates.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default OrderDetailsPage;
