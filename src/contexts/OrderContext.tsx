
import React, { createContext, useContext, useState } from 'react';
import { Order, Shop } from '../types';
import { useToast } from '@/components/ui/use-toast';

interface OrderContextType {
  orders: Order[];
  activeOrder: Order | null;
  placeOrder: (order: Partial<Order>) => Promise<boolean>;
  cancelOrder: (orderId: string) => Promise<boolean>;
  getOrdersByUserId: (userId: string) => Order[];
  shops: Shop[];
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

// Mock data
const mockShops: Shop[] = [
  {
    id: '1',
    name: 'SuperMart Groceries',
    location: 'Central District, Main Street',
    description: 'General grocery store with fresh produce and household items.',
    image: '/placeholder.svg',
  },
  {
    id: '2',
    name: 'PharmaCare',
    location: 'Westlands, Health Avenue',
    description: '24/7 pharmacy with prescription and over-the-counter medications.',
    image: '/placeholder.svg',
  },
  {
    id: '3',
    name: 'TechZone',
    location: 'Digital Plaza, Innovation Road',
    description: 'Electronics and tech accessories store.',
    image: '/placeholder.svg',
  },
  {
    id: '4',
    name: 'Fresh & Fast Foods',
    location: 'Downtown, Cuisine Street',
    description: 'Ready-to-eat meals and fresh food delivery.',
    image: '/placeholder.svg',
  },
  {
    id: '5',
    name: 'BookWorm Store',
    location: 'Academic Zone, Knowledge Lane',
    description: 'Books, stationery and educational materials.',
    image: '/placeholder.svg',
  },
];

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  const placeOrder = async (orderData: Partial<Order>): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      customerId: orderData.customerId || '',
      pickupLocation: orderData.pickupLocation || '',
      dropoffLocation: orderData.dropoffLocation || '',
      description: orderData.description || '',
      recipientName: orderData.recipientName,
      recipientPhone: orderData.recipientPhone,
      shopId: orderData.shopId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: [{ status: 'pending', timestamp: new Date().toISOString() }],
    };
    
    setOrders(prev => [...prev, newOrder]);
    setActiveOrder(newOrder);
    
    toast({
      title: "Order Placed!",
      description: "Your boda request has been submitted.",
    });
    
    return true;
  };

  const cancelOrder = async (orderId: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId 
          ? {
              ...order,
              status: [
                ...order.status,
                { status: 'cancelled', timestamp: new Date().toISOString() }
              ],
              updatedAt: new Date().toISOString()
            }
          : order
      )
    );
    
    if (activeOrder?.id === orderId) {
      const updatedOrder = {...activeOrder};
      updatedOrder.status = [
        ...updatedOrder.status,
        { status: 'cancelled', timestamp: new Date().toISOString() }
      ];
      updatedOrder.updatedAt = new Date().toISOString();
      setActiveOrder(updatedOrder);
    }
    
    toast({
      title: "Order Cancelled",
      description: "Your boda request has been cancelled.",
    });
    
    return true;
  };

  const getOrdersByUserId = (userId: string): Order[] => {
    return orders.filter(order => order.customerId === userId || order.riderId === userId);
  };

  return (
    <OrderContext.Provider 
      value={{ 
        orders, 
        activeOrder, 
        placeOrder, 
        cancelOrder, 
        getOrdersByUserId, 
        shops: mockShops
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};
