import L from 'leaflet';

interface RouteDetails {
  distance: number; // in km
  duration: number; // in minutes
  polyline?: L.LatLngExpression[];
}

const routeCache = new Map<string, RouteDetails>();

// Using OpenRouteService API for accurate routing
const API_KEY = '5b3ce3597851110001cf6248d4425c73420e41c49b16f7f75c9175f6';

// Function to decode polyline string to coordinates
const decodePolyline = (polyline: string): [number, number][] => {
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < polyline.length) {
    let shift = 0;
    let result = 0;
    let byte;

    do {
      byte = polyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = polyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lng += deltaLng;

    coordinates.push([lat / 1e5, lng / 1e5]);
  }

  return coordinates;
};

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
      coordinates
    };
    console.log('📤 Sending request to ORS:', requestBody);
    
    const response = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}`, {
      method: 'POST',
      headers: {
        'Authorization': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
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
    
    // Check for the correct response structure: data.routes[0]
    if (!data.routes || !data.routes[0]) {
      console.error('❌ Invalid API response structure - no routes found');
      throw new Error("No routes found in API response");
    }

    const route = data.routes[0];
    console.log('🛣️ Route data:', route);
    
    if (!route.summary) {
      console.error('❌ Invalid route structure - no summary found');
      throw new Error("No route summary found in API response");
    }
    
    const summary = route.summary;
    console.log('📏 Route summary:', summary);
    
    const distanceInKm = summary.distance / 1000; // Convert meters to km
    const durationInMinutes = summary.duration / 60; // Convert seconds to minutes
    
    console.log(`📊 Calculated distance: ${distanceInKm}km, duration: ${durationInMinutes}min`);
    
    // Process the geometry to get the polyline
    let polyline: L.LatLngExpression[] = [];
    
    if (route.geometry) {
      console.log('🗺️ Route geometry found:', typeof route.geometry);
      
      if (typeof route.geometry === 'string') {
        // Decode polyline string
        console.log('🔄 Decoding polyline string...');
        const decodedCoords = decodePolyline(route.geometry);
        polyline = decodedCoords.map(coord => L.latLng(coord[0], coord[1]));
        console.log('✅ Polyline decoded successfully:', polyline.length, 'points');
      } else if (route.geometry.coordinates && Array.isArray(route.geometry.coordinates)) {
        // Handle GeoJSON format (if returned)
        console.log('🔄 Processing GeoJSON coordinates...');
        polyline = route.geometry.coordinates.map((coord: number[]) => {
          return L.latLng(coord[1], coord[0]); // ORS returns [lng, lat], Leaflet expects [lat, lng]
        });
        console.log('✅ GeoJSON coordinates processed:', polyline.length, 'points');
      }
      
      console.log('🔍 First few polyline points:', polyline.slice(0, 5));
    } else {
      console.error('❌ No geometry found in route response');
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
    console.log('🗺️ Polyline ready for map with', result.polyline?.length, 'coordinates');
    
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
