
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import { useOrder } from '@/contexts/OrderContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ShopCard from '@/components/ShopCard';
import OrderItem from '@/components/OrderItem';
import { Shop } from '@/types';
import { Package, Bike, MapPin } from 'lucide-react';

const CustomerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { placeOrder, getOrdersByUserId, shops } = useOrder();

  // Order form state
  const [orderType, setOrderType] = useState<'shop' | 'custom'>('shop');
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [description, setDescription] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  // New order form visibility
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);

  // Get user's orders
  const userOrders = user ? getOrdersByUserId(user.id) : [];

  // Handle shop selection
  const handleSelectShop = (shop: Shop) => {
    setSelectedShop(shop);
    setPickupLocation(shop.location);
  };

  // Handle order submission
  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      navigate('/login');
      return;
    }

    if (!pickupLocation || !dropoffLocation || !description) {
      // Show validation error
      return;
    }

    // Create the order object
    const orderData = {
      customerId: user.id,
      pickupLocation,
      dropoffLocation,
      description,
      recipientName,
      recipientPhone,
      shopId: selectedShop?.id
    };

    // Place the order
    const success = await placeOrder(orderData);
    if (success) {
      // Reset the form
      setOrderType('shop');
      setSelectedShop(null);
      setPickupLocation('');
      setDropoffLocation('');
      setDescription('');
      setRecipientName('');
      setRecipientPhone('');
      setShowNewOrderForm(false);
    }
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
              className="boda-btn"
              onClick={() => setShowNewOrderForm(!showNewOrderForm)}
            >
              {showNewOrderForm ? 'Cancel' : 'Request New Boda'}
            </Button>
          </div>

          {showNewOrderForm ? (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Request a Boda</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleOrderSubmit} className="space-y-4">
                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      variant={orderType === 'shop' ? 'default' : 'outline'}
                      onClick={() => setOrderType('shop')}
                      className={orderType === 'shop' ? 'bg-boda-600 hover:bg-boda-700' : ''}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      Shop Pickup
                    </Button>
                    <Button
                      type="button"
                      variant={orderType === 'custom' ? 'default' : 'outline'}
                      onClick={() => setOrderType('custom')}
                      className={orderType === 'custom' ? 'bg-boda-600 hover:bg-boda-700' : ''}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Custom Location
                    </Button>
                  </div>

                  {orderType === 'shop' && !selectedShop && (
                    <div className="space-y-4">
                      <h3 className="font-medium">Select a Shop</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {shops.map(shop => (
                          <ShopCard 
                            key={shop.id} 
                            shop={shop} 
                            onSelect={handleSelectShop} 
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {(orderType === 'custom' || selectedShop) && (
                    <div className="space-y-4">
                      {selectedShop && (
                        <div className="p-4 bg-boda-50 rounded-lg">
                          <h4 className="font-medium">Selected Shop: {selectedShop.name}</h4>
                          <p className="text-sm text-gray-600">{selectedShop.location}</p>
                          <Button 
                            variant="link" 
                            className="text-boda-600 p-0 h-auto"
                            onClick={() => setSelectedShop(null)}
                          >
                            Change Shop
                          </Button>
                        </div>
                      )}

                      {orderType === 'custom' && (
                        <div className="space-y-2">
                          <Label htmlFor="pickupLocation">Pickup Location</Label>
                          <Input
                            id="pickupLocation"
                            placeholder="e.g., City Center, Main Street"
                            value={pickupLocation}
                            onChange={(e) => setPickupLocation(e.target.value)}
                            required
                            className="boda-input"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="dropoffLocation">Dropoff Location</Label>
                        <Input
                          id="dropoffLocation"
                          placeholder="e.g., Westlands, Apartment 4B"
                          value={dropoffLocation}
                          onChange={(e) => setDropoffLocation(e.target.value)}
                          required
                          className="boda-input"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Item Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe the items to be delivered"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          required
                          className="boda-input"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="recipientName">Recipient Name</Label>
                          <Input
                            id="recipientName"
                            placeholder="Name of person receiving the delivery"
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                            className="boda-input"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="recipientPhone">Recipient Phone</Label>
                          <Input
                            id="recipientPhone"
                            placeholder="Recipient's contact number"
                            value={recipientPhone}
                            onChange={(e) => setRecipientPhone(e.target.value)}
                            className="boda-input"
                          />
                        </div>
                      </div>

                      <Button type="submit" className="w-full boda-btn">
                        <Bike className="mr-2 h-4 w-4" />
                        Request Boda
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
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
                        className="mt-4 boda-btn"
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

export default CustomerDashboardPage;
