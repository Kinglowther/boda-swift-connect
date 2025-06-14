
import L from 'leaflet';

interface RouteDetails {
  distance: number; // in km
  duration: number; // in minutes
  polyline?: L.LatLngExpression[];
}

const routeCache = new Map<string, RouteDetails>();

const getApiKey = (): string | null => {
  try {
    return localStorage.getItem('openrouteservice_api_key');
  } catch (error) {
    console.error("Could not access localStorage", error);
    return null;
  }
};

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
  
  const apiKey = getApiKey();
  
  if (apiKey) {
    try {
      const response = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}/geojson`, {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
        },
        body: JSON.stringify({ coordinates: waypoints.map(w => [w.lng, w.lat]) })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("ORS API Error:", errorData);
        throw new Error(`ORS API error: ${response.statusText}`);
      }

      const data = await response.json();
      const route = data.features[0];
      const { summary, geometry } = route;
      const distanceInKm = summary.distance / 1000;
      const durationInMinutes = summary.duration / 60;
      const polyline = geometry.coordinates.map((c: number[]) => L.latLng(c[1], c[0]));

      const result = {
        distance: parseFloat(distanceInKm.toFixed(1)),
        duration: parseFloat(durationInMinutes.toFixed(1)),
        polyline,
      };
      routeCache.set(cacheKey, result);
      return result;

    } catch (error) {
      console.error("Failed to fetch from OpenRouteService, falling back to straight-line distance.", error);
    }
  }

  // Fallback to straight-line distance
  const pickupLatLng = L.latLng(waypoints[0].lat, waypoints[0].lng);
  const dropoffLatLng = L.latLng(waypoints[1].lat, waypoints[1].lng);
  const distanceInMeters = pickupLatLng.distanceTo(dropoffLatLng);
  const distanceInKm = distanceInMeters / 1000;

  return { 
    distance: parseFloat(distanceInKm.toFixed(1)), 
    duration: 0 // Cannot estimate duration without routing
  };
};
