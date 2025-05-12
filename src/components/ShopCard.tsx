
import React from 'react';
import { Shop } from '../types';
import { Button } from './ui/button';

interface ShopCardProps {
  shop: Shop;
  onSelect: (shop: Shop) => void;
}

const ShopCard: React.FC<ShopCardProps> = ({ shop, onSelect }) => {
  return (
    <div className="boda-card animate-fade-in">
      <div className="w-full h-40 bg-boda-100 rounded-lg mb-3 overflow-hidden">
        <img 
          src={shop.image} 
          alt={shop.name} 
          className="w-full h-full object-cover"
        />
      </div>
      <h3 className="font-semibold text-lg mb-1">{shop.name}</h3>
      <p className="text-sm text-gray-600 mb-2">{shop.location}</p>
      <p className="text-sm text-gray-700 mb-3">{shop.description}</p>
      <Button 
        onClick={() => onSelect(shop)} 
        className="w-full bg-boda-600 hover:bg-boda-700"
      >
        Select
      </Button>
    </div>
  );
};

export default ShopCard;
