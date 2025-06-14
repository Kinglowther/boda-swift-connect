
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon issue with webpack
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// Create custom icons
const createCustomIcon = (color: string, icon: string) => {
  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      width: 25px;
      height: 25px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="transform: rotate(45deg); color: white; font-size: 12px;">
        ${icon}
      </div>
    </div>`,
    className: 'custom-div-icon',
    iconSize: [25, 25],
    iconAnchor: [12, 25],
    popupAnchor: [0, -25]
  });
};

const pickupIcon = createCustomIcon('#10b981', '📍');
const dropoffIcon = createCustomIcon('#ef4444', '🏁');
const riderIcon = createCustomIcon('#3b82f6', '🚴');
const availableOrderIcon = createCustomIcon('#f59e0b', '📦');

interface Location {
  lat: number;
  lng: number;
}

interface LocationMapProps {
  pickupLocation?: Location | null;
  pickupLocations?: Location[];
  dropoffLocation?: Location | null;
  riderLocation?: Location | null;
  routePolyline?: L.LatLngExpression[];
  isSimulation?: boolean;
  className?: string;
}

// Component to auto-fit map bounds
const RecenterAutomatically: React.FC<{ bounds: L.LatLngBounds | null }> = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [bounds, map]);
  return null;
};

const LocationMap: React.FC<LocationMapProps> = ({ 
  pickupLocation, 
  pickupLocations,
  dropoffLocation, 
  riderLocation,
  routePolyline,
  className = "",
}) => {
  // Calculate bounds for all markers
  const allPoints: L.LatLng[] = [];
  if (pickupLocation) allPoints.push(L.latLng(pickupLocation.lat, pickupLocation.lng));
  if (dropoffLocation) allPoints.push(L.latLng(dropoffLocation.lat, dropoffLocation.lng));
  if (riderLocation) allPoints.push(L.latLng(riderLocation.lat, riderLocation.lng));
  if (pickupLocations) {
    pickupLocations.forEach(loc => allPoints.push(L.latLng(loc.lat, loc.lng)));
  }

  const bounds = allPoints.length > 0 ? new L.LatLngBounds(allPoints) : null;
  const center: L.LatLngTuple = pickupLocation 
    ? [pickupLocation.lat, pickupLocation.lng] 
    : [-1.286389, 36.817223]; // Default to Nairobi CBD

  return (
    <div className={`w-full h-[300px] bg-gray-100 rounded-lg overflow-hidden relative border z-0 ${className}`}>
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height: '100%', width: '100%', position: 'relative', zIndex: 1 }}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {pickupLocation && (
          <Marker position={[pickupLocation.lat, pickupLocation.lng]} icon={pickupIcon}>
            <Popup>
              <div className="font-medium text-green-600">📍 Pickup Location</div>
            </Popup>
          </Marker>
        )}

        {pickupLocations && pickupLocations.map((location, index) => (
          <Marker key={`pickup-loc-${index}`} position={[location.lat, location.lng]} icon={availableOrderIcon}>
             <Popup>
               <div className="font-medium text-yellow-600">📦 Available Order</div>
             </Popup>
          </Marker>
        ))}
      
        {dropoffLocation && (
          <Marker position={[dropoffLocation.lat, dropoffLocation.lng]} icon={dropoffIcon}>
            <Popup>
              <div className="font-medium text-red-600">🏁 Dropoff Location</div>
            </Popup>
          </Marker>
        )}

        {riderLocation && (
          <Marker position={[riderLocation.lat, riderLocation.lng]} icon={riderIcon}>
            <Popup>
              <div className="font-medium text-blue-600">🚴 Rider Location</div>
            </Popup>
          </Marker>
        )}
        
        {/* Draw route polyline with proper styling */}
        {routePolyline && routePolyline.length > 0 && (
          <Polyline 
            positions={routePolyline} 
            color="#3b82f6" 
            weight={4} 
            opacity={0.8}
            dashArray="0"
          />
        )}
        
        {/* Fallback dashed line if no route polyline but have pickup/dropoff */}
        {!routePolyline && pickupLocation && dropoffLocation && (
          <Polyline 
            positions={[[pickupLocation.lat, pickupLocation.lng], [dropoffLocation.lat, dropoffLocation.lng]]} 
            color="#6b7280" 
            weight={2}
            opacity={0.5}
            dashArray="10, 10" 
          />
        )}

        <RecenterAutomatically bounds={bounds} />
      </MapContainer>
    </div>
  );
};

export default LocationMap;
