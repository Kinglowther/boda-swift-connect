import React, { useState, useEffect } from 'react';
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
import RiderSidebar from '@/components/rider-dashboard/RiderSidebar';
import AvailableOrdersTab from '@/components/rider-dashboard/AvailableOrdersTab';
import MyOrdersTab from '@/components/rider-dashboard/MyOrdersTab';
import SettingsTab from '@/components/rider-dashboard/SettingsTab';
import { useRiderLocation } from '@/hooks/useRiderLocation';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';

const RiderDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { orders, acceptOrder } = useOrder();
  const { riders, updateRiderStatus } = useRider();

  const [activeTab, setActiveTab] = useState('available-orders');
  const [isOnline, setIsOnline] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { locationEnabled, handleLocationToggle } = useRiderLocation(setIsOnline);
  const { notificationsEnabled, handleNotificationToggle } = useNotificationPermission();

  // Mock rider stats
  const [riderStats] = useState({
    totalEarnings: 15750,
    completedRides: 127,
    rating: 4.8,
    shujaaPoints: 890
  });

  // Get rider's orders
  const rider = user ? riders.find(r => r.id === user.id) : null;
  const riderLocation = rider?.location;
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

  const handleIsOnlineChange = (online: boolean) => {
    if (online && !locationEnabled) {
      alert('Please enable location access in Settings to go online.');
      setIsOnline(false); // Keep it false if toggled on without permission
      return;
    }
    setIsOnline(online);
  };

  useEffect(() => {
    if (user && updateRiderStatus) {
      // Make sure rider is found before updating status
      const currentRider = riders.find(r => r.id === user.id);
      if (currentRider) {
        updateRiderStatus(user.id, isOnline ? 'available' : 'offline');
      }
    }
  }, [isOnline, user, updateRiderStatus, riders]);

  return (
    <Layout>
      {user ? (
        <div className="flex min-h-screen">
          {/* Desktop Sidebar */}
          <div className="hidden lg:flex w-80 bg-card shadow-lg border-r border-border flex-col">
            <RiderSidebar 
              user={user} 
              riderStats={riderStats} 
              isOnline={isOnline} 
              setIsOnline={handleIsOnlineChange} 
              activeTab={activeTab} 
              handleTabChange={handleTabChange} 
              handleLogout={handleLogout} 
            />
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
                <RiderSidebar 
                  user={user} 
                  riderStats={riderStats} 
                  isOnline={isOnline} 
                  setIsOnline={handleIsOnlineChange} 
                  activeTab={activeTab} 
                  handleTabChange={handleTabChange} 
                  handleLogout={handleLogout} 
                />
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

              {/* Render active tab content using new components */}
              {activeTab === 'available-orders' && (
                <AvailableOrdersTab 
                  isOnline={isOnline}
                  locationEnabled={locationEnabled}
                  availableOrders={availableOrders}
                  handleAcceptOrder={handleAcceptOrder}
                  riderLocation={riderLocation}
                />
              )}

              {activeTab === 'my-orders' && (
                <MyOrdersTab riderOrders={riderOrders} riderLocation={riderLocation} />
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
