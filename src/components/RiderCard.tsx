
import React from 'react';
import { Rider } from '../types';
import { Badge } from './ui/badge';

interface RiderCardProps {
  rider: Rider;
}

const RiderCard: React.FC<RiderCardProps> = ({ rider }) => {
  const statusColors = {
    'available': 'bg-green-100 text-green-800',
    'busy': 'bg-orange-100 text-orange-800',
    'offline': 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="boda-card flex flex-col md:flex-row gap-4 animate-fade-in">
      <div className="flex-shrink-0">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100">
          <img 
            src={rider.profileImage} 
            alt={rider.name} 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{rider.name}</h3>
            <p className="text-sm text-gray-600">{rider.phone}</p>
          </div>
          <Badge className={`${statusColors[rider.status]}`}>
            {rider.status.charAt(0).toUpperCase() + rider.status.slice(1)}
          </Badge>
        </div>
        <div className="mt-2">
          <p className="text-sm">
            <span className="font-medium">Bike: </span>
            {rider.bikeRegNumber}
          </p>
          <p className="text-sm">
            <span className="font-medium">License: </span>
            {rider.licenseNumber}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RiderCard;
