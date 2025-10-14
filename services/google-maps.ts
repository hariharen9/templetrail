import { Temple } from "@/types/temple";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export async function getCoordsFromCity(city: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === 'OK') {
      return data.results[0].geometry.location;
    }
    return null;
  } catch (error) {
    console.error("Geocoding API error:", error);
    return null;
  }
}

export async function getTemplesNearCoords(coords: { lat: number; lng: number }): Promise<Temple[]> {
  console.log(`Searching for temples near ${coords.lat}, ${coords.lng}`);
  
  try {
    const response = await fetch(`/api/nearby-temples?lat=${coords.lat}&lng=${coords.lng}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error("API error:", errorData);
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.temples && Array.isArray(data.temples)) {
      console.log(`Found ${data.temples.length} temples near ${coords.lat}, ${coords.lng}`);
      return data.temples.map((place: any) => ({
        id: place.id,
        name: place.name,
        city: place.city,
        location: place.location,
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        photos: place.photos,
        imageUrl: place.photos && place.photos.length > 0 
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${API_KEY}` 
          : undefined,
        history: place.name, // Placeholder, as Places API doesn't provide history
      }));
    }
    
    console.warn("No temples found in API response:", data);
    return [];
  } catch (error) {
    console.error("Places API error:", error);
    return [];
  }
}

export async function getTempleDetails(placeId: string): Promise<any | null> {
  try {
    const response = await fetch(`/api/place-details?place_id=${placeId}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error("Place Details API error:", errorData);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Place Details API error:", error);
    return null;
  }
}
