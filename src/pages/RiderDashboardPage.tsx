
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
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
import { useRiderDashboard } from '@/hooks/useRiderDashboard';

const RiderDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    activeTab,
    setActiveTab,
    isOnline,
    handleIsOnlineChange,
    locationEnabled,
    handleLocationToggle,
    notificationsEnabled,
    handleNotificationToggle,
    riderStats,
    riderLocation,
    riderOrders,
    availableOrders,
    handleAcceptOrder,
    handleLogout,
  } = useRiderDashboard();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSidebarOpen(false); // Close sidebar on mobile when tab changes
  };

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-foreground">You need to log in to view this page</h2>
          <Button 
            className="mt-4 bg-green-500 hover:bg-green-600"
            onClick={() => navigate('/login')}
          >
            Login
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
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
    </Layout>
  );
};

export default RiderDashboardPage;
