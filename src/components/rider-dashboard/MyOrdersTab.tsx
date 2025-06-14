
import React from 'react';
import { useNavigate } from 'react-router-dom';
import OrderItem from '@/components/OrderItem';
import { Order } from '@/types';

interface MyOrdersTabProps {
  riderOrders: Order[];
}

const MyOrdersTab: React.FC<MyOrdersTabProps> = ({ riderOrders }) => {
  const navigate = useNavigate();

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-foreground">My Orders</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {riderOrders.map(order => (
          <OrderItem
            key={order.id}
            order={order}
            onClick={(o) => navigate(`/order/${o.id}`)}
          />
        ))}
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
