
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
    'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
    'accepted': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
    'in-progress': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
    'completed': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
    'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
  };
  
  // Format the date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, h:mm a');
  };

  return (
    <div 
      className={`bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all p-4 cursor-pointer ${onClick ? 'hover:shadow-md' : ''}`}
      onClick={() => onClick && onClick(order)}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-foreground">Order #{order.id.slice(-6)}</h3>
        <Badge className={statusColors[currentStatus]}>
          {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
        </Badge>
      </div>
      
      <div className="space-y-1 mb-3">
        <p className="text-sm text-foreground">
          <span className="font-medium">From: </span>
          <span className="text-muted-foreground">{order.pickupLocation}</span>
        </p>
        <p className="text-sm text-foreground">
          <span className="font-medium">To: </span>
          <span className="text-muted-foreground">{order.dropoffLocation}</span>
        </p>
        {order.description && (
          <p className="text-sm text-foreground">
            <span className="font-medium">Items: </span>
            <span className="text-muted-foreground">{order.description}</span>
          </p>
        )}
        {order.recipientName && (
          <p className="text-sm text-foreground">
            <span className="font-medium">Recipient: </span>
            <span className="text-muted-foreground">
              {order.recipientName}
              {order.recipientPhone && ` (${order.recipientPhone})`}
            </span>
          </p>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground">
        {formatDate(order.createdAt)}
      </div>
    </div>
  );
};

export default OrderItem;
