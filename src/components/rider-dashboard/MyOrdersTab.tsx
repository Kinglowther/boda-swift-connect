
import React from 'react';
import { useNavigate } from 'react-router-dom';
import OrderItem from '@/components/OrderItem';
import { Order, Rider } from '@/types';
import LocationMap from '@/components/LocationMap';

interface MyOrdersTabProps {
  riderOrders: Order[];
  riderLocation?: Rider['location'];
}

const MyOrdersTab: React.FC<MyOrdersTabProps> = ({ riderOrders, riderLocation }) => {
  const navigate = useNavigate();

  // Find an order that is currently active for map display
  const activeOrder = riderOrders.find(o => {
    const currentStatus = o.status[o.status.length - 1]?.status;
    return currentStatus === 'accepted' || currentStatus === 'in-progress';
  });

  // Mock coordinates since order data doesn't have them yet.
  const pickupCoords = activeOrder ? { lat: -1.286389, lng: 36.817223 } : null; // Nairobi CBD
  const dropoffCoords = activeOrder ? { lat: -1.2995, lng: 36.7819 } : null; // Kilimani area

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-foreground">My Orders</h2>

      {activeOrder && (
        <div className="mb-6 rounded-lg overflow-hidden shadow-lg border">
          <LocationMap 
            riderLocation={riderLocation}
            pickupLocation={pickupCoords}
            dropoffLocation={dropoffCoords}
            isSimulation={false}
          />
        </div>
      )}

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
