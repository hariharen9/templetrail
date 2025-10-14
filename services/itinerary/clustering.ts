import { Temple } from '@/types/temple'
import { calculateDistance } from './utils'

export type ClusteringStrategy = 'balanced' | 'geographical' | 'time-optimized'

export interface ItineraryOptions {
  startTime?: string
  endTimePreference?: 'flexible' | 'fixed'
  fixedEndTime?: string
}

// Balanced clustering that considers both geography and day balance
export function balancedClustering(temples: Temple[], k: number): Temple[][] {
  if (k >= temples.length || k <= 0) {
    return temples.map(t => [t])
  }

  const idealPerDay = Math.ceil(temples.length / k)
  const minPerDay = Math.floor(temples.length / k)
  
  console.log(`Distributing ${temples.length} temples over ${k} days. Ideal: ${idealPerDay}, Min: ${minPerDay}`)

  // Start with geographical K-means clustering
  let clusters = geographicalKMeans(temples, k)
  
  // Balance the clusters to avoid extreme imbalances
  clusters = balanceClusters(clusters, idealPerDay, minPerDay)
  
  return clusters.filter(c => c.length > 0)
}

// Pure geographical K-means clustering
export function geographicalKMeans(temples: Temple[], k: number): Temple[][] {
  // K-means++ initialization for better clustering
  const centroids: { lat: number; lng: number }[] = []
  
  // Choose first centroid randomly
  centroids.push(temples[Math.floor(Math.random() * temples.length)].location)
  
  // Choose remaining centroids using K-means++ method
  for (let i = 1; i < k; i++) {
    const distances = temples.map(temple => {
      const minDistToCentroid = Math.min(...centroids.map(centroid => 
        calculateDistance(temple, { location: centroid } as Temple)
      ))
      return minDistToCentroid * minDistToCentroid
    })
    
    const totalDistance = distances.reduce((sum, d) => sum + d, 0)
    const random = Math.random() * totalDistance
    
    let cumulativeDistance = 0
    for (let j = 0; j < temples.length; j++) {
      cumulativeDistance += distances[j]
      if (cumulativeDistance >= random) {
        centroids.push(temples[j].location)
        break
      }
    }
  }

  let clusters: Temple[][] = []
  let changed = true
  let iterations = 0
  const maxIterations = 100

  while (changed && iterations < maxIterations) {
    clusters = Array.from({ length: k }, () => [])
    
    temples.forEach(temple => {
      let minDistance = Infinity
      let closestCentroidIndex = 0
      
      centroids.forEach((centroid, i) => {
        const distance = calculateDistance(temple, { location: centroid } as Temple)
        if (distance < minDistance) {
          minDistance = distance
          closestCentroidIndex = i
        }
      })
      
      clusters[closestCentroidIndex].push(temple)
    })

    const newCentroids = centroids.map((_, i) => {
      const clusterTemples = clusters[i]
      if (clusterTemples.length === 0) {
        return centroids[i]
      }
      const avgLat = clusterTemples.reduce((sum, t) => sum + t.location.lat, 0) / clusterTemples.length
      const avgLng = clusterTemples.reduce((sum, t) => sum + t.location.lng, 0) / clusterTemples.length
      return { lat: avgLat, lng: avgLng }
    })

    changed = JSON.stringify(newCentroids) !== JSON.stringify(centroids)
    centroids.splice(0, centroids.length, ...newCentroids)
    iterations++
  }

  return clusters
}

// Time-optimized clustering that considers visit duration and travel time
export function timeOptimizedClustering(temples: Temple[], k: number, options: ItineraryOptions = {}): Temple[][] {
  if (k >= temples.length || k <= 0) {
    return temples.map(t => [t])
  }

  // Calculate target day duration based on user preferences
  let targetDayDuration = 9 * 60 // 9 hours in minutes (default)
  let maxDayDuration = 10 * 60 // 10 hours max (default)
  
  if (options.endTimePreference === 'fixed' && options.fixedEndTime && options.startTime) {
    const startTime = new Date(`2024-01-01T${options.startTime}:00`)
    const endTime = new Date(`2024-01-01T${options.fixedEndTime}:00`)
    const availableTime = (endTime.getTime() - startTime.getTime()) / (1000 * 60) // minutes
    
    targetDayDuration = Math.max(availableTime * 0.9, 4 * 60) // Use 90% of available time, minimum 4 hours
    maxDayDuration = availableTime
  }
  
  const clusters: Temple[][] = []
  const remainingTemples = [...temples]
  
  for (let day = 0; day < k && remainingTemples.length > 0; day++) {
    const dayCluster: Temple[] = []
    let dayDuration = 0
    
    // Start with the temple that has the highest rating (or first if no ratings)
    let startTemple = remainingTemples.reduce((best, temple) => 
      (temple.rating || 0) > (best.rating || 0) ? temple : best
    )
    
    // Add the starting temple
    dayCluster.push(startTemple)
    remainingTemples.splice(remainingTemples.indexOf(startTemple), 1)
    dayDuration += calculateVisitDuration(startTemple)
    
    // Add more temples to this day while staying within time limits
    while (remainingTemples.length > 0 && dayDuration < targetDayDuration) {
      // Find the closest remaining temple
      let closestTemple: Temple | null = null
      let closestDistance = Infinity
      let closestIndex = -1
      
      remainingTemples.forEach((temple, index) => {
        const lastTemple = dayCluster[dayCluster.length - 1]
        const distance = calculateDistance(lastTemple, temple)
        
        if (distance < closestDistance) {
          closestDistance = distance
          closestTemple = temple
          closestIndex = index
        }
      })
      
      if (closestTemple) {
        const visitDuration = calculateVisitDuration(closestTemple)
        const travelTime = Math.round(closestDistance * 2) // Rough estimate: 30 km/h
        const totalTimeToAdd = visitDuration + travelTime + 10 // 10 min buffer
        
        // Check if adding this temple would exceed the day limit
        if (dayDuration + totalTimeToAdd <= maxDayDuration) {
          dayCluster.push(closestTemple)
          remainingTemples.splice(closestIndex, 1)
          dayDuration += totalTimeToAdd
        } else {
          // Can't fit more temples in this day
          break
        }
      } else {
        break
      }
    }
    
    clusters.push(dayCluster)
    console.log(`Day ${day + 1}: ${dayCluster.length} temples, estimated ${Math.round(dayDuration / 60)}h ${dayDuration % 60}m`)
  }
  
  // If there are remaining temples, distribute them to existing days
  while (remainingTemples.length > 0) {
    const temple = remainingTemples.pop()!
    
    // Find the day with the least temples
    let targetDay = 0
    let minTemples = clusters[0].length
    
    for (let i = 1; i < clusters.length; i++) {
      if (clusters[i].length < minTemples) {
        minTemples = clusters[i].length
        targetDay = i
      }
    }
    
    clusters[targetDay].push(temple)
    console.log(`Added remaining temple "${temple?.name || 'Unknown'}" to day ${targetDay + 1}`)
  }
  
  return clusters
}

// Balance clusters to avoid extreme imbalances
function balanceClusters(clusters: Temple[][], idealPerDay: number, minPerDay: number): Temple[][] {
  const maxAllowedPerDay = idealPerDay + 1 // Allow 1 extra temple per day max
  
  // Sort clusters by size (largest first)
  clusters.sort((a, b) => b.length - a.length)
  
  let rebalanced = false
  
  // Rebalance oversized clusters
  for (let i = 0; i < clusters.length; i++) {
    const cluster = clusters[i]
    
    // If cluster is too large, move temples to smaller clusters
    while (cluster.length > maxAllowedPerDay) {
      // Find the smallest cluster that can accept a temple
      let targetClusterIndex = -1
      let minSize = Infinity
      
      for (let j = 0; j < clusters.length; j++) {
        if (j !== i && clusters[j].length < idealPerDay && clusters[j].length < minSize) {
          minSize = clusters[j].length
          targetClusterIndex = j
        }
      }
      
      if (targetClusterIndex === -1) {
        // No suitable target found, break to avoid infinite loop
        break
      }
      
      // Find the temple in the oversized cluster that's closest to the target cluster
      const targetCluster = clusters[targetClusterIndex]
      const targetCentroid = calculateClusterCentroid(targetCluster)
      
      let closestTemple: Temple | null = null
      let closestDistance = Infinity
      let closestIndex = -1
      
      cluster.forEach((temple, index) => {
        const distance = calculateDistance(temple, { location: targetCentroid } as Temple)
        if (distance < closestDistance) {
          closestDistance = distance
          closestTemple = temple
          closestIndex = index
        }
      })
      
      if (closestTemple && closestIndex !== -1) {
        // Move the temple
        cluster.splice(closestIndex, 1)
        targetCluster.push(closestTemple)
        rebalanced = true
        console.log(`Moved temple "${(closestTemple as Temple).name}" from day ${i + 1} to day ${targetClusterIndex + 1} for better balance`)
      } else {
        break
      }
    }
  }
  
  if (rebalanced) {
    console.log('Cluster sizes after rebalancing:', clusters.map(c => c.length))
  }
  
  return clusters
}

// Calculate the centroid of a cluster
function calculateClusterCentroid(cluster: Temple[]): { lat: number; lng: number } {
  if (cluster.length === 0) {
    return { lat: 0, lng: 0 }
  }
  
  const avgLat = cluster.reduce((sum, t) => sum + t.location.lat, 0) / cluster.length
  const avgLng = cluster.reduce((sum, t) => sum + t.location.lng, 0) / cluster.length
  
  return { lat: avgLat, lng: avgLng }
}

// Calculate suggested visit duration for each temple
function calculateVisitDuration(temple: Temple): number {
  // Base duration: 45 minutes
  let duration = 45
  
  // Adjust based on rating (higher rated = more time)
  if (temple.rating) {
    if (temple.rating >= 4.5) duration += 15
    else if (temple.rating >= 4.0) duration += 10
    else if (temple.rating >= 3.5) duration += 5
  }
  
  // Adjust based on number of reviews (popular = more time)
  if (temple.user_ratings_total) {
    if (temple.user_ratings_total > 1000) duration += 15
    else if (temple.user_ratings_total > 500) duration += 10
    else if (temple.user_ratings_total > 100) duration += 5
  }
  
  return Math.min(duration, 90) // Cap at 90 minutes
}