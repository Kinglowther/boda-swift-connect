
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

// Create enhanced custom icons with better visibility
const createCustomIcon = (color: string, icon: string, size: number = 35) => {
  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    ">
      <div style="
        transform: rotate(45deg); 
        color: white; 
        font-size: ${size * 0.4}px;
        font-weight: bold;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
      ">
        ${icon}
      </div>
    </div>`,
    className: 'custom-div-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  });
};

// Enhanced icons for better visibility
const pickupIcon = createCustomIcon('#3b82f6', '🚩', 40);
const dropoffIcon = createCustomIcon('#10b981', '🎯', 40);
const riderIcon = createCustomIcon('#f59e0b', '🚴', 35);
const availableOrderIcon = createCustomIcon('#ef4444', '📦', 32);

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
  distance?: number;
  duration?: number;
  showRouteInfo?: boolean;
}

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

// Component to add route info overlay
const RouteInfoOverlay: React.FC<{ 
  duration: number; 
  pickupLocation: Location; 
  map: L.Map 
}> = ({ duration, pickupLocation, map }) => {
  useEffect(() => {
    if (!map || !pickupLocation) return;

    // Create custom control for route info
    const routeInfoControl = L.control({ position: 'topright' });
    
    routeInfoControl.onAdd = () => {
      const div = L.DomUtil.create('div', 'route-info-control');
      div.innerHTML = `
        <div style="
          background: #3b82f6;
          color: white;
          padding: 8px 12px;
          border-radius: 20px;
          font-weight: bold;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
        ">
          <span style="
            background: #10b981;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            font-weight: bold;
          ">${Math.round(duration)}</span>
          <span>min</span>
        </div>
      `;
      return div;
    };

    routeInfoControl.addTo(map);

    return () => {
      map.removeControl(routeInfoControl);
    };
  }, [map, pickupLocation, duration]);

  return null;
};

const LocationMap: React.FC<LocationMapProps> = ({ 
  pickupLocation, 
  pickupLocations,
  dropoffLocation, 
  riderLocation,
  routePolyline,
  className = "",
  distance,
  duration,
  showRouteInfo = false
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
    <div className={`w-full h-[400px] bg-gray-100 rounded-lg overflow-hidden relative border shadow-md ${className}`}>
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
              <div className="font-medium text-blue-600 text-center">
                <div className="text-lg">🚩</div>
                <div>Pickup Location</div>
                {distance && <div className="text-sm text-gray-600">Distance: {distance} km</div>}
              </div>
            </Popup>
          </Marker>
        )}

        {pickupLocations && pickupLocations.map((location, index) => (
          <Marker key={`pickup-loc-${index}`} position={[location.lat, location.lng]} icon={availableOrderIcon}>
             <Popup>
               <div className="font-medium text-red-600 text-center">
                 <div className="text-lg">📦</div>
                 <div>Available Order</div>
               </div>
             </Popup>
          </Marker>
        ))}
      
        {dropoffLocation && (
          <Marker position={[dropoffLocation.lat, dropoffLocation.lng]} icon={dropoffIcon}>
            <Popup>
              <div className="font-medium text-green-600 text-center">
                <div className="text-lg">🎯</div>
                <div>Destination</div>
                {duration && <div className="text-sm text-gray-600">ETA: {Math.round(duration)} mins</div>}
              </div>
            </Popup>
          </Marker>
        )}

        {riderLocation && (
          <Marker position={[riderLocation.lat, riderLocation.lng]} icon={riderIcon}>
            <Popup>
              <div className="font-medium text-yellow-600 text-center">
                <div className="text-lg">🚴</div>
                <div>Rider Location</div>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Enhanced route polyline - Main route in blue */}
        {routePolyline && routePolyline.length > 0 && (
          <>
            {/* Shadow/outline for better visibility */}
            <Polyline 
              positions={routePolyline} 
              color="#1e40af" 
              weight={8} 
              opacity={0.3}
            />
            {/* Main route line */}
            <Polyline 
              positions={routePolyline} 
              color="#3b82f6" 
              weight={6} 
              opacity={0.9}
              dashArray="0"
            />
          </>
        )}
        
        {/* Fallback dashed line if no route polyline but have pickup/dropoff */}
        {!routePolyline && pickupLocation && dropoffLocation && (
          <Polyline 
            positions={[[pickupLocation.lat, pickupLocation.lng], [dropoffLocation.lat, dropoffLocation.lng]]} 
            color="#6b7280" 
            weight={3}
            opacity={0.6}
            dashArray="10, 10" 
          />
        )}

        <RecenterAutomatically bounds={bounds} />
        
        {/* Add route info overlay if requested */}
        {showRouteInfo && duration && pickupLocation && (
          <RouteInfoOverlay duration={duration} pickupLocation={pickupLocation} map={null as any} />
        )}
      </MapContainer>
    </div>
  );
};

export default LocationMap;
