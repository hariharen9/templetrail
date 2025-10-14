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

// Updated to work with Google Places API temple IDs
export async function getTemplesByIds(ids: string[]): Promise<Temple[]> {
  if (ids.length === 0) {
    return [];
  }

  const temples: Temple[] = [];
  
  // Fetch temple details from Google Places API for each ID
  for (const id of ids) {
    try {
      const response = await fetch(`/api/place-details?place_id=${id}`);
      if (response.ok) {
        const placeDetails = await response.json();
        
        if (placeDetails.geometry && placeDetails.geometry.location) {
          temples.push({
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
          });
        }
      }
    } catch (error) {
      console.error(`Error fetching temple details for ${id}:`, error);
    }
  }

  return temples;
}
