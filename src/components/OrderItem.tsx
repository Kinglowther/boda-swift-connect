
import React from 'react';
import { Order } from '../types';
import { Badge } from './ui/badge';
import { format } from 'date-fns';

interface OrderItemProps {
  order: Order;
  onClick?: (order: Order) => void;
}

const OrderItem: React.FC<OrderItemProps> = ({ order, onClick }) => {
  // Get the latest status
  const currentStatus = order.status[order.status.length - 1].status;
  
  // Status colors
  const statusColors = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'accepted': 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-purple-100 text-purple-800',
    'completed': 'bg-green-100 text-green-800',
    'cancelled': 'bg-red-100 text-red-800'
  };
  
  // Format the date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, h:mm a');
  };

  return (
    <div 
      className={`boda-card cursor-pointer transition-all ${onClick ? 'hover:shadow-md' : ''}`}
      onClick={() => onClick && onClick(order)}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold">Order #{order.id.slice(-6)}</h3>
        <Badge className={statusColors[currentStatus]}>
          {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
        </Badge>
      </div>
      
      <div className="space-y-1 mb-3">
        <p className="text-sm">
          <span className="font-medium">From: </span>
          {order.pickupLocation}
        </p>
        <p className="text-sm">
          <span className="font-medium">To: </span>
          {order.dropoffLocation}
        </p>
        {order.description && (
          <p className="text-sm">
            <span className="font-medium">Items: </span>
            {order.description}
          </p>
        )}
        {order.recipientName && (
          <p className="text-sm">
            <span className="font-medium">Recipient: </span>
            {order.recipientName}
            {order.recipientPhone && ` (${order.recipientPhone})`}
          </p>
        )}
      </div>
      
      <div className="text-xs text-gray-500">
        {formatDate(order.createdAt)}
      </div>
    </div>
  );
};

export default OrderItem;
