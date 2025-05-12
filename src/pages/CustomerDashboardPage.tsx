
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import { useOrder } from '@/contexts/OrderContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import OrderItem from '@/components/OrderItem';
import { Bike, MapPin } from 'lucide-react';
import RequestRideForm from '@/components/RequestRideForm';

const CustomerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getOrdersByUserId } = useOrder();

  // New order form visibility
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);

  // Get user's orders
  const userOrders = user ? getOrdersByUserId(user.id) : [];

  // Handle order form cancel
  const handleCancelOrderForm = () => {
    setShowNewOrderForm(false);
  };

  // Handle order success
  const handleOrderSuccess = () => {
    setShowNewOrderForm(false);
  };

  return (
    <Layout>
      {user ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
              <p className="text-gray-600">Manage your deliveries and requests</p>
            </div>
            <Button 
              className="bg-green-500 hover:bg-green-600 text-white"
              onClick={() => setShowNewOrderForm(!showNewOrderForm)}
            >
              {showNewOrderForm ? 'Cancel' : 'Request New Boda'}
            </Button>
          </div>

          {showNewOrderForm ? (
            <RequestRideForm 
              onCancel={handleCancelOrderForm} 
              onSuccess={handleOrderSuccess}
            />
          ) : (
            <Tabs defaultValue="active" className="w-full">
              <TabsList>
                <TabsTrigger value="active">Active Orders</TabsTrigger>
                <TabsTrigger value="past">Past Orders</TabsTrigger>
              </TabsList>
              <TabsContent value="active" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userOrders.filter(order => 
                    !order.status.some(s => s.status === 'completed' || s.status === 'cancelled')
                  ).map(order => (
                    <OrderItem
                      key={order.id}
                      order={order}
                      onClick={(order) => navigate(`/order/${order.id}`)}
                    />
                  ))}
                  {userOrders.filter(order => 
                    !order.status.some(s => s.status === 'completed' || s.status === 'cancelled')
                  ).length === 0 && (
                    <div className="col-span-2 p-8 text-center">
                      <p>You don't have any active orders.</p>
                      <Button 
                        className="mt-4 bg-green-500 hover:bg-green-600"
                        onClick={() => setShowNewOrderForm(true)}
                      >
                        Request New Boda
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="past" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userOrders.filter(order => 
                    order.status.some(s => s.status === 'completed' || s.status === 'cancelled')
                  ).map(order => (
                    <OrderItem
                      key={order.id}
                      order={order}
                      onClick={(order) => navigate(`/order/${order.id}`)}
                    />
                  ))}
                  {userOrders.filter(order => 
                    order.status.some(s => s.status === 'completed' || s.status === 'cancelled')
                  ).length === 0 && (
                    <div className="col-span-2 p-8 text-center">
                      <p>You don't have any past orders.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">You need to log in to view this page</h2>
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

export default CustomerDashboardPage;
