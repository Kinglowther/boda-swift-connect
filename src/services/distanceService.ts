
import L from 'leaflet';

interface RouteDetails {
  distance: number; // in km
  duration: number; // in minutes
  polyline?: L.LatLngExpression[];
}

const routeCache = new Map<string, RouteDetails>();

// Using OpenRouteService API for accurate routing
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
    // Convert waypoints to coordinates format expected by ORS (lng, lat)
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
      console.error(`ORS API error: ${response.status} ${response.statusText}`);
      throw new Error(`ORS API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.features || !data.features[0] || !data.features[0].properties) {
      throw new Error("Invalid API response structure");
    }

    const route = data.features[0];
    const properties = route.properties;
    const geometry = route.geometry;
    
    if (!properties.segments || !properties.segments[0]) {
      throw new Error("No route segments found");
    }
    
    const segment = properties.segments[0];
    const distanceInKm = segment.distance / 1000; // Convert meters to km
    const durationInMinutes = segment.duration / 60; // Convert seconds to minutes
    
    // Convert geometry coordinates to Leaflet LatLng format
    const polyline = geometry.coordinates.map((coord: number[]) => 
      L.latLng(coord[1], coord[0]) // ORS returns [lng, lat], Leaflet expects [lat, lng]
    );

    const result = {
      distance: parseFloat(distanceInKm.toFixed(1)),
      duration: parseFloat(durationInMinutes.toFixed(1)),
      polyline,
    };
    
    routeCache.set(cacheKey, result);
    console.log(`Route calculated: ${result.distance}km, ${result.duration}min`);
    return result;

  } catch (error) {
    console.error("Error fetching route from OpenRouteService:", error);
    
    // Fallback to straight-line distance calculation
    const pickupLatLng = L.latLng(waypoints[0].lat, waypoints[0].lng);
    const dropoffLatLng = L.latLng(waypoints[waypoints.length - 1].lat, waypoints[waypoints.length - 1].lng);
    const distanceInMeters = pickupLatLng.distanceTo(dropoffLatLng);
    const distanceInKm = distanceInMeters / 1000;
    
    // For fallback, estimate duration based on average speed
    const estimatedDuration = Math.max(5, Math.round(distanceInKm * 1.5)); // ~40km/h average
    
    console.log(`Using fallback calculation: ${distanceInKm.toFixed(1)}km`);
    
    return { 
      distance: parseFloat(distanceInKm.toFixed(1)), 
      duration: estimatedDuration
    };
  }
};

// Geocoding function to convert place names to coordinates
export const geocodeLocation = async (locationName: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    // Using OpenRouteService Geocoding API
    const response = await fetch(`https://api.openrouteservice.org/geocode/search?api_key=${API_KEY}&text=${encodeURIComponent(locationName)}&boundary.country=KE&size=1`);
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const coordinates = data.features[0].geometry.coordinates;
      return {
        lat: coordinates[1],
        lng: coordinates[0]
      };
    }
    
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};
