
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useOrder } from '@/contexts/OrderContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import OrderItem from '@/components/OrderItem';
import { Bike, MapPin, Settings, LogOut, Star, DollarSign, Package, Menu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const RiderDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { orders, acceptOrder } = useOrder();

  const [activeTab, setActiveTab] = useState('available-orders');
  const [isOnline, setIsOnline] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const SidebarContent = () => (
    <>
      {/* User Profile Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3 mb-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={user?.profileImage} alt={user?.name} />
            <AvatarFallback className="bg-boda-600 text-white">
              {user?.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-foreground">{user?.name}</h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="flex items-center space-x-1 mt-1">
              <Star className="h-3 w-3 text-yellow-500" />
              <span className="text-xs text-muted-foreground">{riderStats.rating}/5.0</span>
            </div>
          </div>
        </div>

        {/* Online Status Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg mb-4">
          <div>
            <span className="font-medium text-foreground">Online Status</span>
            <p className="text-xs text-muted-foreground">
              {isOnline ? 'Available for orders' : 'Offline'}
            </p>
          </div>
          <Switch
            checked={isOnline}
            onCheckedChange={setIsOnline}
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-green-700 dark:text-green-300">Earnings</p>
                <p className="font-semibold text-green-800 dark:text-green-200">
                  Ksh. {riderStats.totalEarnings.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-blue-700 dark:text-blue-300">Completed</p>
                <p className="font-semibold text-blue-800 dark:text-blue-200">
                  {riderStats.completedRides}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <nav className="space-y-2">
          <button
            onClick={() => handleTabChange('available-orders')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'available-orders' 
                ? 'bg-boda-100 dark:bg-boda-800/50 text-boda-800 dark:text-boda-200 font-medium' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <MapPin className="inline-block h-4 w-4 mr-2" />
            Available Orders
          </button>
          
          <button
            onClick={() => handleTabChange('my-orders')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'my-orders' 
                ? 'bg-boda-100 dark:bg-boda-800/50 text-boda-800 dark:text-boda-200 font-medium' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Bike className="inline-block h-4 w-4 mr-2" />
            My Orders
          </button>
          
          <button
            onClick={() => handleTabChange('settings')}
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
    </>
  );

  return (
    <Layout>
      {user ? (
        <div className="flex min-h-screen">
          {/* Desktop Sidebar */}
          <div className="hidden lg:flex w-80 bg-card shadow-lg border-r border-border flex-col">
            <SidebarContent />
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
                <SidebarContent />
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

              {/* Available Orders */}
              {activeTab === 'available-orders' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-foreground">Available Orders</h2>
                  {!isOnline && (
                    <Card className="mb-4 border-orange-200 dark:border-orange-800">
                      <CardContent className="p-4">
                        <p className="text-orange-600 dark:text-orange-400">
                          You're currently offline. Turn on your online status to see and accept available orders.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableOrders.map(order => (
                      <div key={order.id} className="relative">
                        <OrderItem
                          order={order}
                          onClick={(order) => navigate(`/order/${order.id}`)}
                        />
                        {isOnline && (
                          <Button
                            className="absolute top-2 right-2 bg-green-500 hover:bg-green-600 text-white"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptOrder(order.id);
                            }}
                          >
                            Accept
                          </Button>
                        )}
                      </div>
                    ))}
                    {availableOrders.length === 0 && (
                      <div className="col-span-2 p-8 text-center">
                        <p className="text-muted-foreground">No available orders at the moment.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* My Orders */}
              {activeTab === 'my-orders' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-foreground">My Orders</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {riderOrders.map(order => (
                      <OrderItem
                        key={order.id}
                        order={order}
                        onClick={(order) => navigate(`/order/${order.id}`)}
                      />
                    ))}
                    {riderOrders.length === 0 && (
                      <div className="col-span-2 p-8 text-center">
                        <p className="text-muted-foreground">You haven't accepted any orders yet.</p>
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
                            Allow the app to access your location for accurate order tracking
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
                            Receive notifications about new order requests and updates
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
