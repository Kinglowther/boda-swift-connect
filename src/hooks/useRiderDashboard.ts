
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrder } from '@/contexts/OrderContext';
import { useRider } from '@/contexts/RiderContext';
import { useRiderLocation } from '@/hooks/useRiderLocation';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';

export const useRiderDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { orders, acceptOrder } = useOrder();
  const { riders, updateRiderStatus } = useRider();

  const [activeTab, setActiveTab] = useState('available-orders');
  const [isOnline, setIsOnline] = useState(true);

  const { locationEnabled, handleLocationToggle } = useRiderLocation(setIsOnline);
  const { notificationsEnabled, handleNotificationToggle } = useNotificationPermission();

  // Mock rider stats
  const [riderStats] = useState({
    totalEarnings: 15750,
    completedRides: 127,
    rating: 4.8,
    shujaaPoints: 890
  });

  // Derived state
  const riderLocation = user ? riders.find(r => r.id === user.id)?.location : undefined;
  const riderOrders = user ? orders.filter(order => order.riderId === user.id) : [];
  const availableOrders = orders.filter(order => !order.riderId);

  // Handlers
  const handleAcceptOrder = useCallback((orderId: string) => {
    if (user && isOnline) {
      acceptOrder(orderId, user.id);
    } else if (!isOnline) {
      alert('You need to be online to accept orders');
    }
  }, [user, isOnline, acceptOrder]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  const handleIsOnlineChange = useCallback((online: boolean) => {
    if (online && !locationEnabled) {
      alert('Please enable location access in Settings to go online.');
      setIsOnline(false);
      return;
    }
    setIsOnline(online);
  }, [locationEnabled]);

  // Effects
  useEffect(() => {
    if (user && updateRiderStatus) {
      const currentRider = riders.find(r => r.id === user.id);
      if (currentRider) {
        updateRiderStatus(user.id, isOnline ? 'available' : 'offline');
      }
    }
  }, [isOnline, user, updateRiderStatus, riders]);

  return {
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
    handleLogout
  };
};
