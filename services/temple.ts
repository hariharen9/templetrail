import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Temple } from "@/types/temple";

export async function getTemplesByCity(city: string): Promise<Temple[]> {
  const templesRef = collection(db, "temples");
  const q = query(templesRef, where("city", "==", city));
  const querySnapshot = await getDocs(q);

  const temples: Temple[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    temples.push({
      id: doc.id,
      name: data.name,
      city: data.city,
      location: {
        lat: data.location.latitude,
        lng: data.location.longitude,
      },
      imageUrl: data.imageUrl,
      history: data.history,
    } as Temple);
  });

  return temples;
}

// Updated to work with Google Places API temple IDs with parallel fetching and better error handling
export async function getTemplesByIds(ids: string[]): Promise<Temple[]> {
  if (ids.length === 0) {
    return [];
  }

  console.log(`Fetching details for ${ids.length} temples in parallel...`);

  // Fetch all temple details in parallel for better performance
  const fetchPromises = ids.map(async (id, index) => {
    try {
      const response = await fetch(`/api/place-details?place_id=${id}`);
      
      if (!response.ok) {
        console.warn(`Failed to fetch temple ${id}: ${response.status} ${response.statusText}`);
        return null;
      }

      const placeDetails = await response.json();
      
      if (placeDetails.geometry && placeDetails.geometry.location) {
        console.log(`Successfully fetched temple ${index + 1}/${ids.length}: ${placeDetails.name}`);
        return {
          id: id,
          name: placeDetails.name,
          city: placeDetails.vicinity || 'Unknown',
          location: {
            lat: placeDetails.geometry.location.lat,
            lng: placeDetails.geometry.location.lng,
          },
          rating: placeDetails.rating,
          user_ratings_total: placeDetails.user_ratings_total,
          photos: placeDetails.photos?.map((photo: any) => ({
            photo_reference: photo.photo_reference,
            width: photo.width,
            height: photo.height
          })) || [],
          imageUrl: placeDetails.photos && placeDetails.photos.length > 0 
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${placeDetails.photos[0].photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}` 
            : undefined,
          history: placeDetails.editorial_summary?.overview || placeDetails.name,
          description: placeDetails.editorial_summary?.overview,
        } as Temple;
      } else {
        console.warn(`Invalid place details for ${id}: missing geometry or location`);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching temple details for ${id}:`, error);
      return null;
    }
  });

  // Wait for all requests to complete and filter out null results
  const results = await Promise.all(fetchPromises);
  const validTemples = results.filter((temple): temple is Temple => temple !== null);
  
  console.log(`Successfully fetched ${validTemples.length}/${ids.length} temple details`);
  
  if (validTemples.length === 0) {
    throw new Error("Unable to fetch any temple details. Please check your internet connection and try again.");
  }
  
  if (validTemples.length < ids.length) {
    console.warn(`Only ${validTemples.length} out of ${ids.length} temples could be fetched`);
  }

  return validTemples;
}
