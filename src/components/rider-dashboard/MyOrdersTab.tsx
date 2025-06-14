
import React from 'react';
import { Order } from '@/types';
import OrderItem from '@/components/OrderItem';
import { useAuth } from '@/contexts/AuthContext';

interface MyOrdersTabProps {
  riderOrders: Order[];
  onOrderItemClick: (order: Order) => void;
}

const MyOrdersTab: React.FC<MyOrdersTabProps> = ({ riderOrders, onOrderItemClick }) => {
  const { getUserById } = useAuth();
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-foreground">My Orders</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {riderOrders.map(order => {
          const customer = order.customerId ? getUserById?.(order.customerId) : undefined;
          return (
            <OrderItem
              key={order.id}
              order={order}
              onClick={() => onOrderItemClick(order)}
              customerName={customer?.name}
              customerPhone={customer?.phone}
            />
          );
        })}
        {riderOrders.length === 0 && (
          <div className="col-span-2 p-8 text-center">
            <p className="text-muted-foreground">You haven't accepted any orders yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrdersTab;

