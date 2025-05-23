
export type UserRole = 'customer' | 'rider' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  profileImage?: string;
}

export interface Shop {
  id: string;
  name: string;
  location: string;
  description: string;
  image: string;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  bikeRegNumber: string;
  idNumber: string;
  licenseNumber: string;
  profileImage: string;
  idImage: string;
  idBackImage: string;
  licenseImage: string;
  licenseBackImage: string;
  vehicleRegFrontImage: string;
  vehicleRegBackImage: string;
  status: 'available' | 'busy' | 'offline';
  location?: {
    lat: number;
    lng: number;
  }
}

export interface OrderStatus {
  status: 'pending' | 'accepted' | 'in-progress' | 'completed' | 'cancelled';
  timestamp: string;
}

export interface Order {
  id: string;
  customerId: string;
  riderId?: string;
  pickupLocation: string;
  dropoffLocation: string;
  recipientName?: string;
  recipientPhone?: string;
  description: string;
  price?: number;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus[];
  shopId?: string;
}
