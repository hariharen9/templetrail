import { Temple } from "@/types/temple";

// 1. Haversine distance calculation
function getDistance(temple1: Temple, temple2: Temple): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (temple2.location.lat - temple1.location.lat) * (Math.PI / 180);
  const dLon = (temple2.location.lng - temple1.location.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(temple1.location.lat * (Math.PI / 180)) *
      Math.cos(temple2.location.lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// 2. K-Means clustering
function kmeans(temples: Temple[], k: number): Temple[][] {
  if (k >= temples.length || k <= 0) {
    return temples.map(t => [t]);
  }

  // Initialize centroids randomly
  let centroids = temples.slice(0, k).map(t => t.location);
  let clusters: Temple[][] = [];
  let changed = true;

  while (changed) {
    clusters = Array.from({ length: k }, () => []);
    temples.forEach(temple => {
      let minDistance = Infinity;
      let closestCentroidIndex = 0;
      centroids.forEach((centroid, i) => {
        const distance = getDistance(temple, { location: centroid } as Temple);
        if (distance < minDistance) {
          minDistance = distance;
          closestCentroidIndex = i;
        }
      });
      clusters[closestCentroidIndex].push(temple);
    });

    const newCentroids = centroids.map((_, i) => {
      const clusterTemples = clusters[i];
      if (clusterTemples.length === 0) {
        return centroids[i]; // Keep old centroid if cluster is empty
      }
      const avgLat = clusterTemples.reduce((sum, t) => sum + t.location.lat, 0) / clusterTemples.length;
      const avgLng = clusterTemples.reduce((sum, t) => sum + t.location.lng, 0) / clusterTemples.length;
      return { lat: avgLat, lng: avgLng };
    });

    changed = JSON.stringify(newCentroids) !== JSON.stringify(centroids);
    centroids = newCentroids;
  }

  return clusters.filter(c => c.length > 0);
}

// 3. Nearest Neighbor for routing within a cluster
function nearestNeighbor(cluster: Temple[]): Temple[] {
  if (cluster.length <= 1) return cluster;

  const unvisited = new Set(cluster);
  const route: Temple[] = [];
  
  // Start with the first temple in the cluster
  let currentTemple = cluster[0];
  unvisited.delete(currentTemple);
  route.push(currentTemple);

  while (unvisited.size > 0) {
    let nearestTemple: Temple | null = null;
    let minDistance = Infinity;

    unvisited.forEach(temple => {
      const distance = getDistance(currentTemple, temple);
      if (distance < minDistance) {
        minDistance = distance;
        nearestTemple = temple;
      }
    });

    if (nearestTemple) {
      currentTemple = nearestTemple;
      unvisited.delete(currentTemple);
      route.push(currentTemple);
    }
  }
  return route;
}

// 4. Main function to generate the itinerary
export function generateItinerary(temples: Temple[], days: number): Temple[][] {
  const clusters = kmeans(temples, days);
  const dailyRoutes = clusters.map(cluster => nearestNeighbor(cluster));
  return dailyRoutes;
}
