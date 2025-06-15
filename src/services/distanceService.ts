
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
  console.log('🚀 Starting route calculation with waypoints:', waypoints);
  
  if (waypoints.length < 2) {
    console.warn('⚠️ Not enough waypoints for route calculation');
    return { distance: 0, duration: 0 };
  }
  
  const cacheKey = JSON.stringify({ waypoints, profile });
  if (routeCache.has(cacheKey)) {
    console.log('✅ Using cached route');
    return routeCache.get(cacheKey)!;
  }
  
  try {
    // Convert waypoints to coordinates format expected by ORS (lng, lat)
    const coordinates = waypoints.map(w => [w.lng, w.lat]);
    console.log('📍 Converted coordinates for ORS:', coordinates);
    
    const requestBody = { 
      coordinates,
      format: 'geojson'
    };
    console.log('📤 Sending request to ORS:', requestBody);
    
    const response = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}`, {
      method: 'POST',
      headers: {
        'Authorization': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('📥 ORS Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ORS API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`ORS API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📊 Full ORS response data:', JSON.stringify(data, null, 2));
    
    if (!data.features || !data.features[0]) {
      console.error('❌ Invalid API response structure - no features found');
      throw new Error("No route features found in API response");
    }

    const route = data.features[0];
    console.log('🛣️ Route feature:', route);
    
    if (!route.properties || !route.properties.segments || !route.properties.segments[0]) {
      console.error('❌ Invalid route structure - no segments found');
      throw new Error("No route segments found in API response");
    }
    
    const segment = route.properties.segments[0];
    const geometry = route.geometry;
    
    console.log('📏 Route segment properties:', segment);
    console.log('🗺️ Route geometry:', geometry);
    
    const distanceInKm = segment.distance / 1000; // Convert meters to km
    const durationInMinutes = segment.duration / 60; // Convert seconds to minutes
    
    console.log(`📊 Calculated distance: ${distanceInKm}km, duration: ${durationInMinutes}min`);
    
    // Convert geometry coordinates to Leaflet LatLng format
    let polyline: L.LatLngExpression[] = [];
    
    if (geometry && geometry.coordinates && Array.isArray(geometry.coordinates)) {
      polyline = geometry.coordinates.map((coord: number[]) => {
        // ORS returns [lng, lat], Leaflet expects [lat, lng]
        const latLng = L.latLng(coord[1], coord[0]);
        return latLng;
      });
      console.log('🔄 Converted polyline coordinates:', polyline.length, 'points');
      console.log('🔍 First few polyline points:', polyline.slice(0, 3));
    } else {
      console.error('❌ No valid geometry coordinates found in response');
      // Create fallback straight line
      polyline = [
        L.latLng(waypoints[0].lat, waypoints[0].lng),
        L.latLng(waypoints[waypoints.length - 1].lat, waypoints[waypoints.length - 1].lng)
      ];
      console.log('🔄 Using fallback straight line polyline');
    }

    const result = {
      distance: parseFloat(distanceInKm.toFixed(1)),
      duration: parseFloat(durationInMinutes.toFixed(1)),
      polyline,
    };
    
    routeCache.set(cacheKey, result);
    console.log('✅ Route calculation successful:', result);
    console.log('🗺️ Polyline data will be passed to map:', result.polyline?.length, 'coordinates');
    
    return result;

  } catch (error) {
    console.error("❌ Error fetching route from OpenRouteService:", error);
    
    // Fallback to straight-line distance calculation
    const pickupLatLng = L.latLng(waypoints[0].lat, waypoints[0].lng);
    const dropoffLatLng = L.latLng(waypoints[waypoints.length - 1].lat, waypoints[waypoints.length - 1].lng);
    const distanceInMeters = pickupLatLng.distanceTo(dropoffLatLng);
    const distanceInKm = distanceInMeters / 1000;
    
    // For fallback, estimate duration based on average speed
    const estimatedDuration = Math.max(5, Math.round(distanceInKm * 1.5)); // ~40km/h average
    
    // Create fallback polyline as straight line
    const fallbackPolyline = [pickupLatLng, dropoffLatLng];
    
    console.log(`🔄 Using fallback calculation: ${distanceInKm.toFixed(1)}km, ${estimatedDuration}min`);
    console.log('🔄 Fallback polyline created with', fallbackPolyline.length, 'points');
    
    const fallbackResult = { 
      distance: parseFloat(distanceInKm.toFixed(1)), 
      duration: estimatedDuration,
      polyline: fallbackPolyline
    };
    
    // Cache the fallback result to avoid repeated API calls
    routeCache.set(cacheKey, fallbackResult);
    
    return fallbackResult;
  }
};

// Geocoding function to convert place names to coordinates
export const geocodeLocation = async (locationName: string): Promise<{ lat: number; lng: number } | null> => {
  console.log('🔍 Geocoding location:', locationName);
  
  try {
    // Using OpenRouteService Geocoding API
    const url = `https://api.openrouteservice.org/geocode/search?api_key=${API_KEY}&text=${encodeURIComponent(locationName)}&boundary.country=KE&size=1`;
    console.log('📤 Geocoding request URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ Geocoding API error: ${response.status} ${response.statusText}`);
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📊 Geocoding response:', data);
    
    if (data.features && data.features.length > 0) {
      const coordinates = data.features[0].geometry.coordinates;
      const result = {
        lat: coordinates[1],
        lng: coordinates[0]
      };
      console.log('✅ Geocoding successful:', result);
      return result;
    }
    
    console.warn('⚠️ No geocoding results found for:', locationName);
    return null;
  } catch (error) {
    console.error("❌ Geocoding error:", error);
    return null;
  }
};
