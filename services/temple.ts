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

// In-memory cache for temple details to avoid redundant API calls
const templeCache = new Map<string, Temple>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

// Batch size for parallel requests to avoid overwhelming the API
const BATCH_SIZE = 10;

// Enhanced temple fetching with caching, batching, and parallel processing
export async function getTemplesByIds(ids: string[]): Promise<Temple[]> {
  if (ids.length === 0) {
    return [];
  }

  console.log(`Fetching details for ${ids.length} temples with caching and batching...`);

  // Check cache first and filter out cached temples
  const now = Date.now();
  const cachedTemples: Temple[] = [];
  const uncachedIds: string[] = [];

  ids.forEach(id => {
    const cached = templeCache.get(id);
    const timestamp = cacheTimestamps.get(id);
    
    if (cached && timestamp && (now - timestamp) < CACHE_EXPIRY) {
      cachedTemples.push(cached);
    } else {
      uncachedIds.push(id);
    }
  });

  console.log(`Found ${cachedTemples.length} cached temples, fetching ${uncachedIds.length} from API`);

  if (uncachedIds.length === 0) {
    return cachedTemples;
  }

  // Process uncached IDs in batches for better performance and rate limiting
  const batches: string[][] = [];
  for (let i = 0; i < uncachedIds.length; i += BATCH_SIZE) {
    batches.push(uncachedIds.slice(i, i + BATCH_SIZE));
  }

  const fetchedTemples: Temple[] = [];

  // Process batches sequentially to respect rate limits, but parallelize within each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} temples)`);

    const batchPromises = batch.map(async (id, index) => {
      try {
        const response = await fetch(`/api/place-details?place_id=${id}`);
        
        if (!response.ok) {
          console.warn(`Failed to fetch temple ${id}: ${response.status} ${response.statusText}`);
          return null;
        }

        const placeDetails = await response.json();
        
        if (placeDetails.geometry && placeDetails.geometry.location) {
          const temple: Temple = {
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
          };

          // Cache the result
          templeCache.set(id, temple);
          cacheTimestamps.set(id, now);

          console.log(`Successfully fetched temple ${batchIndex * BATCH_SIZE + index + 1}/${uncachedIds.length}: ${temple.name}`);
          return temple;
        } else {
          console.warn(`Invalid place details for ${id}: missing geometry or location`);
          return null;
        }
      } catch (error) {
        console.error(`Error fetching temple details for ${id}:`, error);
        return null;
      }
    });

    // Wait for current batch to complete before processing next batch
    const batchResults = await Promise.all(batchPromises);
    const validBatchTemples = batchResults.filter((temple): temple is Temple => temple !== null);
    fetchedTemples.push(...validBatchTemples);

    // Small delay between batches to be respectful to the API
    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  const allTemples = [...cachedTemples, ...fetchedTemples];
  
  console.log(`Successfully fetched ${allTemples.length}/${ids.length} temple details (${cachedTemples.length} from cache, ${fetchedTemples.length} from API)`);
  
  if (allTemples.length === 0) {
    throw new Error("Unable to fetch any temple details. Please check your internet connection and try again.");
  }
  
  if (allTemples.length < ids.length) {
    console.warn(`Only ${allTemples.length} out of ${ids.length} temples could be fetched`);
  }

  return allTemples;
}

// Utility function to clear expired cache entries
export function clearExpiredCache(): void {
  const now = Date.now();
  for (const [id, timestamp] of cacheTimestamps.entries()) {
    if (now - timestamp >= CACHE_EXPIRY) {
      templeCache.delete(id);
      cacheTimestamps.delete(id);
    }
  }
}

// Utility function to get cache stats
export function getCacheStats(): { size: number; expiry: number } {
  return {
    size: templeCache.size,
    expiry: CACHE_EXPIRY
  };
}
