
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';

// Fix for default marker icon issue with webpack
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

interface Location {
  lat: number;
  lng: number;
}

interface LocationMapProps {
  pickupLocation?: Location | null;
  pickupLocations?: Location[];
  dropoffLocation?: Location | null;
  riderLocation?: Location | null;
  isSimulation?: boolean; // isSimulation is no longer used but kept for prop compatibility
}

const createDivIcon = (icon: React.ReactNode, className: string) => {
    // This is a workaround to use React components as markers.
    // In a real app, you might use a library or a more robust solution.
    const markerHtmlStyles = `
      background-color: white;
      width: 2rem;
      height: 2rem;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 1px solid #555;`
    const iconHtml = `<div style="${markerHtmlStyles}">${new L.DivIcon()
        .createIcon(icon as unknown as HTMLElement)
        .innerHTML}</div>`;

    return L.divIcon({
        html: iconHtml,
        className: `leaflet-div-icon ${className}`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

const pickupIcon = createDivIcon(<MapPin className="text-green-600 transform rotate-45" />, 'pickup-icon');
const dropoffIcon = createDivIcon(<MapPin className="text-red-600 transform rotate-45" />, 'dropoff-icon');
const riderIcon = createDivIcon(<Navigation className="text-blue-600" />, 'rider-icon');
const availableOrderIcon = createDivIcon(<MapPin className="text-yellow-500 transform rotate-45" />, 'available-order-icon');

// Component to auto-fit map bounds
const RecenterAutomatically: React.FC<{ bounds: L.LatLngBounds | null }> = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
};

const LocationMap: React.FC<LocationMapProps> = ({ 
  pickupLocation, 
  pickupLocations,
  dropoffLocation, 
  riderLocation
}) => {
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
    <div className="w-full h-[300px] bg-gray-100 rounded-lg overflow-hidden relative border">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {pickupLocation && (
          <Marker position={[pickupLocation.lat, pickupLocation.lng]} icon={pickupIcon}>
            <Popup>Pickup Location</Popup>
          </Marker>
        )}

        {pickupLocations && pickupLocations.map((location, index) => (
          <Marker key={`pickup-loc-${index}`} position={[location.lat, location.lng]} icon={availableOrderIcon}>
             <Popup>Available Order Pickup</Popup>
          </Marker>
        ))}
      
        {dropoffLocation && (
          <Marker position={[dropoffLocation.lat, dropoffLocation.lng]} icon={dropoffIcon}>
            <Popup>Dropoff Location</Popup>
          </Marker>
        )}

        {riderLocation && (
          <Marker position={[riderLocation.lat, riderLocation.lng]} icon={riderIcon}>
            <Popup>Rider's Location</Popup>
          </Marker>
        )}
        
        {pickupLocation && dropoffLocation && (
          <Polyline 
            positions={[[pickupLocation.lat, pickupLocation.lng], [dropoffLocation.lat, dropoffLocation.lng]]} 
            color="grey" 
            dashArray="5, 10" 
          />
        )}

        <RecenterAutomatically bounds={bounds} />
      </MapContainer>
    </div>
  );
};

export default LocationMap;
