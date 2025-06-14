
import L from 'leaflet';

interface RouteDetails {
  distance: number; // in km
  duration: number; // in minutes
  polyline?: L.LatLngExpression[];
}

const routeCache = new Map<string, RouteDetails>();
const API_KEY = '5b3ce3597851110001cf6248d4425c73420e41c49b16f7f75c9175f6';

export const getRouteDetails = async (
  waypoints: { lat: number; lng: number }[],
  profile: 'driving-car' | 'cycling-road' = 'driving-car'
): Promise<RouteDetails> => {
  if (waypoints.length < 2) {
    return { distance: 0, duration: 0 };
  }
  
  const cacheKey = JSON.stringify({ waypoints, profile });
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }
  
  try {
    const coordinates = waypoints.map(w => [w.lng, w.lat]);
    
    const response = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}`, {
      method: 'POST',
      headers: {
        'Authorization': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
      },
      body: JSON.stringify({ 
        coordinates,
        format: 'geojson'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("ORS API Error Response:", errorText);
      throw new Error(`ORS API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("ORS API Response:", data);
    
    if (!data.features || !data.features[0] || !data.features[0].properties) {
      console.error("Invalid API response structure:", data);
      throw new Error("Invalid API response structure");
    }

    const route = data.features[0];
    const properties = route.properties;
    const geometry = route.geometry;
    
    if (!properties.segments || !properties.segments[0]) {
      console.error("No route segments found:", properties);
      throw new Error("No route segments found");
    }
    
    const segment = properties.segments[0];
    const distanceInKm = segment.distance / 1000;
    const durationInMinutes = segment.duration / 60;
    
    // Convert geometry coordinates to Leaflet LatLng format
    const polyline = geometry.coordinates.map((coord: number[]) => 
      L.latLng(coord[1], coord[0])
    );

    const result = {
      distance: parseFloat(distanceInKm.toFixed(1)),
      duration: parseFloat(durationInMinutes.toFixed(1)),
      polyline,
    };
    
    routeCache.set(cacheKey, result);
    console.log("Route calculated successfully:", result);
    return result;

  } catch (error) {
    console.error("Error fetching from OpenRouteService:", error);
    
    // Fallback to straight-line distance
    const pickupLatLng = L.latLng(waypoints[0].lat, waypoints[0].lng);
    const dropoffLatLng = L.latLng(waypoints[waypoints.length - 1].lat, waypoints[waypoints.length - 1].lng);
    const distanceInMeters = pickupLatLng.distanceTo(dropoffLatLng);
    const distanceInKm = distanceInMeters / 1000;

    console.log("Using fallback straight-line distance:", distanceInKm);
    
    return { 
      distance: parseFloat(distanceInKm.toFixed(1)), 
      duration: Math.max(1, Math.round(distanceInKm * 2)) // Rough estimate: 2 minutes per km
    };
  }
};
