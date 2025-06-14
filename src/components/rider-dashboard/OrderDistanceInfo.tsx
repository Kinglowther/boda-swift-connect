
import React, { useState, useEffect } from 'react';
import { getRouteDetails } from '@/services/distanceService';
import { Rider, Order } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bike, Clock } from 'lucide-react';

interface OrderDistanceInfoProps {
  riderLocation?: Rider['location'];
  order: Order;
}

const OrderDistanceInfo: React.FC<OrderDistanceInfoProps> = ({ riderLocation, order }) => {
  const [info, setInfo] = useState<{ distance: number | null; duration: number | null }>({ distance: null, duration: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDistance = async () => {
      if (riderLocation && order.pickupLat && order.pickupLng) {
        setLoading(true);
        try {
          const routeDetails = await getRouteDetails(
            [riderLocation, { lat: order.pickupLat, lng: order.pickupLng }],
            'cycling-road'
          );
          setInfo({ distance: routeDetails.distance, duration: routeDetails.duration });
        } catch (error) {
          console.error("Failed to fetch order distance", error);
          setInfo({ distance: null, duration: null });
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchDistance();
  }, [riderLocation, order.pickupLat, order.pickupLng]);

  if (!riderLocation || (!loading && info.distance === null)) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2 mt-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 mt-2">
      <Badge variant="secondary" className="flex items-center gap-1">
        <Bike className="h-3 w-3" />
        {info.distance} km
      </Badge>
      {info.duration > 0 && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          ~{Math.round(info.duration)} min
        </Badge>
      )}
    </div>
  );
};

export default OrderDistanceInfo;
