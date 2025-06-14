
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import OrderItem from '@/components/OrderItem';
import { Order } from '@/types';

interface AvailableOrdersTabProps {
  isOnline: boolean;
  locationEnabled: boolean;
  availableOrders: Order[];
  handleAcceptOrder: (orderId: string) => void;
}

const AvailableOrdersTab: React.FC<AvailableOrdersTabProps> = ({
  isOnline,
  locationEnabled,
  availableOrders,
  handleAcceptOrder,
}) => {
  const navigate = useNavigate();

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-foreground">Available Orders</h2>
      {!isOnline && (
        <Card className="mb-4 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <p className="text-orange-600 dark:text-orange-400">
              You're currently offline. Turn on your online status to see and accept available orders.
              {!locationEnabled && " Location access is also required to go online."}
            </p>
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableOrders.map(order => (
          <div key={order.id} className="relative">
            <OrderItem
              order={order}
              onClick={(o) => navigate(`/order/${o.id}`)}
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
        {availableOrders.length === 0 && isOnline && (
          <div className="col-span-2 p-8 text-center">
            <p className="text-muted-foreground">No available orders at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailableOrdersTab;
