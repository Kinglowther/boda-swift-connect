
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import OrderItem from '@/components/OrderItem';
import { Order, Rider } from '@/types';
import LocationMap from '@/components/LocationMap';
import { getRouteDetails } from '@/services/distanceService';

interface MyOrdersTabProps {
  riderOrders: Order[];
  riderLocation?: Rider['location'];
}

const MyOrdersTab: React.FC<MyOrdersTabProps> = ({ riderOrders, riderLocation }) => {
  const navigate = useNavigate();
  const [activeRoute, setActiveRoute] = useState<{ polyline?: L.LatLngExpression[] } | null>(null);

  // Find an order that is currently active for map display
  const activeOrder = riderOrders.find(o => {
    const currentStatus = o.status[o.status.length - 1]?.status;
    return currentStatus === 'accepted' || currentStatus === 'in-progress';
  });
  
  const pickupCoords = activeOrder && activeOrder.pickupLat && activeOrder.pickupLng 
    ? { lat: activeOrder.pickupLat, lng: activeOrder.pickupLng } 
    : null;
  const dropoffCoords = activeOrder && activeOrder.dropoffLat && activeOrder.dropoffLng 
    ? { lat: activeOrder.dropoffLat, lng: activeOrder.dropoffLng }
    : null;

  useEffect(() => {
    const fetchRoute = async () => {
      if (pickupCoords && dropoffCoords) {
        const route = await getRouteDetails([pickupCoords, dropoffCoords]);
        setActiveRoute(route);
      }
    };

    if(activeOrder) {
      fetchRoute();
    } else {
      setActiveRoute(null);
    }
  }, [activeOrder, pickupCoords, dropoffCoords]);


  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-foreground">Live Map</h2>

      <div className="mb-6 rounded-lg overflow-hidden shadow-lg border">
        <LocationMap 
          riderLocation={riderLocation}
          pickupLocation={pickupCoords}
          dropoffLocation={dropoffCoords}
          routePolyline={activeRoute?.polyline}
          isSimulation={false}
        />
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-4 text-foreground">My Orders</h2>
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
