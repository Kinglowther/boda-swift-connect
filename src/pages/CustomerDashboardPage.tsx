
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import { useOrder } from '@/contexts/OrderContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import OrderItem from '@/components/OrderItem';
import { Bike, MapPin, User, Settings, LogOut, Star, Bell, MapPinIcon } from 'lucide-react';
import RequestRideForm from '@/components/RequestRideForm';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const CustomerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { getOrdersByUserId } = useOrder();

  // New order form visibility
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  const [activeTab, setActiveTab] = useState('current-orders');
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Mock Shujaa points for new customers
  const [shujaaPoints] = useState(250);

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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const requestLocationPermission = async () => {
    if ('geolocation' in navigator) {
      try {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        setLocationEnabled(true);
      } catch (error) {
        alert('Location access denied. Please enable location services in your browser settings.');
      }
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

  const handleLocationToggle = (enabled: boolean) => {
    if (enabled) {
      requestLocationPermission();
    } else {
      setLocationEnabled(false);
    }
  };

  const handleNotificationToggle = (enabled: boolean) => {
    if (enabled) {
      requestNotificationPermission();
    } else {
      setNotificationsEnabled(false);
    }
  };

  return (
    <Layout>
      {user ? (
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <div className="w-80 bg-card shadow-lg border-r border-border flex flex-col">
            {/* User Profile Section */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-boda-600 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              
              {/* Shujaa Points */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium text-yellow-800 dark:text-yellow-200">Shujaa Points</span>
                  </div>
                  <Badge className="bg-yellow-500 text-white">
                    {shujaaPoints}
                  </Badge>
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Worth Ksh. {(shujaaPoints * 0.5).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 p-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('current-orders')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'current-orders' 
                      ? 'bg-boda-100 dark:bg-boda-800/50 text-boda-800 dark:text-boda-200 font-medium' 
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <MapPin className="inline-block h-4 w-4 mr-2" />
                  Current Orders
                </button>
                
                <button
                  onClick={() => setActiveTab('past-orders')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'past-orders' 
                      ? 'bg-boda-100 dark:bg-boda-800/50 text-boda-800 dark:text-boda-200 font-medium' 
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Bike className="inline-block h-4 w-4 mr-2" />
                  Past Orders
                </button>
                
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'settings' 
                      ? 'bg-boda-100 dark:bg-boda-800/50 text-boda-800 dark:text-boda-200 font-medium' 
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Settings className="inline-block h-4 w-4 mr-2" />
                  Settings
                </button>
              </nav>
            </div>

            {/* Logout Button */}
            <div className="p-4 border-t border-border">
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
                  <h1 className="text-2xl font-bold text-foreground">Welcome, {user.name}</h1>
                  <p className="text-muted-foreground">Manage your deliveries and requests</p>
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
                <div className="space-y-6">
                  {/* Current Orders */}
                  {activeTab === 'current-orders' && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4 text-foreground">Current Orders</h2>
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
                            <p className="text-muted-foreground">You don't have any active orders.</p>
                            <Button 
                              className="mt-4 bg-green-500 hover:bg-green-600"
                              onClick={() => setShowNewOrderForm(true)}
                            >
                              Request New Boda
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Past Orders */}
                  {activeTab === 'past-orders' && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4 text-foreground">Past Orders</h2>
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
                            <p className="text-muted-foreground">You don't have any past orders.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Settings */}
                  {activeTab === 'settings' && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4 text-foreground">Settings</h2>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-foreground">App Permissions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label htmlFor="location-access" className="text-base font-medium text-foreground">
                                Location Access
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                Allow the app to access your location for accurate pickup and delivery tracking
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
                              <Label htmlFor="push-notifications" className="text-base font-medium text-foreground">
                                Push Notifications
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                Receive notifications about order status updates and delivery confirmations
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

export default CustomerDashboardPage;
