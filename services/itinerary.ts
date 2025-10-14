import { Temple, ItineraryPlan, ItineraryDay, RouteSegment } from '@/types/temple'

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

// Calculate distance between two points using Haversine formula
function calculateDistance(temple1: Temple, temple2: Temple): number {
  const R = 6371 // Radius of the Earth in km
  const dLat = (temple2.location.lat - temple1.location.lat) * (Math.PI / 180)
  const dLon = (temple2.location.lng - temple1.location.lng) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(temple1.location.lat * (Math.PI / 180)) *
      Math.cos(temple2.location.lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Balanced clustering that considers both geography and day balance
function balancedClustering(temples: Temple[], k: number): Temple[][] {
  if (k >= temples.length || k <= 0) {
    return temples.map(t => [t])
  }

  // Calculate ideal temples per day
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
function geographicalKMeans(temples: Temple[], k: number): Temple[][] {
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

// Time-optimized clustering that considers visit duration and travel time
function timeOptimizedClustering(temples: Temple[], k: number, options: ItineraryOptions = {}): Temple[][] {
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

// Traveling Salesman Problem solver using nearest neighbor with 2-opt improvement
function optimizeRoute(temples: Temple[]): Temple[] {
  if (temples.length <= 2) return temples

  // Start with nearest neighbor
  const unvisited = new Set(temples)
  const route: Temple[] = []
  
  let currentTemple = temples[0]
  unvisited.delete(currentTemple)
  route.push(currentTemple)

  while (unvisited.size > 0) {
    let nearestTemple: Temple | null = null
    let minDistance = Infinity

    unvisited.forEach(temple => {
      const distance = calculateDistance(currentTemple, temple)
      if (distance < minDistance) {
        minDistance = distance
        nearestTemple = temple
      }
    })

    if (nearestTemple) {
      currentTemple = nearestTemple
      unvisited.delete(currentTemple)
      route.push(currentTemple)
    }
  }

  // Apply 2-opt improvement
  return twoOptImprovement(route)
}

// 2-opt improvement for better route optimization
function twoOptImprovement(route: Temple[]): Temple[] {
  if (route.length < 4) return route

  let improved = true
  let bestRoute = [...route]
  let bestDistance = calculateRouteDistance(bestRoute)

  while (improved) {
    improved = false
    
    for (let i = 1; i < route.length - 2; i++) {
      for (let j = i + 1; j < route.length; j++) {
        if (j - i === 1) continue // Skip adjacent edges
        
        const newRoute = [...route]
        // Reverse the segment between i and j
        const segment = newRoute.slice(i, j + 1).reverse()
        newRoute.splice(i, j - i + 1, ...segment)
        
        const newDistance = calculateRouteDistance(newRoute)
        if (newDistance < bestDistance) {
          bestRoute = newRoute
          bestDistance = newDistance
          improved = true
        }
      }
    }
    
    route = bestRoute
  }

  return bestRoute
}

function calculateRouteDistance(route: Temple[]): number {
  let totalDistance = 0
  for (let i = 0; i < route.length - 1; i++) {
    totalDistance += calculateDistance(route[i], route[i + 1])
  }
  return totalDistance
}

// Get detailed route information using Google Routes API
async function getRouteDetails(temples: Temple[]): Promise<RouteSegment[]> {
  if (temples.length < 2) return []

  const routes: RouteSegment[] = []
  
  try {
    // For multiple temples, we need to make a single request with waypoints
    if (temples.length > 2) {
      const origin = { lat: temples[0].location.lat, lng: temples[0].location.lng }
      const destination = { lat: temples[temples.length - 1].location.lat, lng: temples[temples.length - 1].location.lng }
      const intermediates = temples.slice(1, -1).map(temple => ({
        lat: temple.location.lat,
        lng: temple.location.lng
      }))

      console.log(`Getting route for ${temples.length} temples`)

      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin,
          destination,
          intermediates,
          travelMode: 'DRIVE'
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0]
          const legs = route.legs || []
          
          console.log(`Routes API returned ${legs.length} legs for ${temples.length} temples`)
          
          for (let i = 0; i < legs.length && i < temples.length - 1; i++) {
            const leg = legs[i]
            routes.push({
              from: temples[i],
              to: temples[i + 1],
              distance: {
                text: `${(leg.distanceMeters / 1000).toFixed(1)} km`,
                value: leg.distanceMeters
              },
              duration: {
                text: formatDuration(leg.duration),
                value: parseDuration(leg.duration)
              },
              polyline: leg.polyline?.encodedPolyline || route.polyline?.encodedPolyline
            })
          }
        }
      } else {
        console.error('Routes API failed, falling back to estimates')
        throw new Error('Routes API failed')
      }
    } else {
      // For just 2 temples, make a simple request
      const origin = { lat: temples[0].location.lat, lng: temples[0].location.lng }
      const destination = { lat: temples[1].location.lat, lng: temples[1].location.lng }

      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin,
          destination,
          travelMode: 'DRIVE'
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0]
          
          routes.push({
            from: temples[0],
            to: temples[1],
            distance: {
              text: `${(route.distanceMeters / 1000).toFixed(1)} km`,
              value: route.distanceMeters
            },
            duration: {
              text: formatDuration(route.duration),
              value: parseDuration(route.duration)
            },
            polyline: route.polyline?.encodedPolyline
          })
        }
      } else {
        throw new Error('Routes API failed')
      }
    }
  } catch (error) {
    console.error('Error getting route details, using fallback estimates:', error)
    
    // Fallback to estimated routes
    for (let i = 0; i < temples.length - 1; i++) {
      const straightLineDistance = calculateDistance(temples[i], temples[i + 1])
      
      // Apply road factor (roads are typically 1.3-1.5x longer than straight line)
      const roadFactor = 1.4
      const estimatedRoadDistance = straightLineDistance * roadFactor
      
      // Calculate estimated travel time based on urban/rural context
      const avgSpeed = estimatedRoadDistance < 5 ? 25 : 35 // km/h
      const travelTimeMinutes = Math.round((estimatedRoadDistance / avgSpeed) * 60)
      
      routes.push({
        from: temples[i],
        to: temples[i + 1],
        distance: {
          text: `${estimatedRoadDistance.toFixed(1)} km`,
          value: Math.round(estimatedRoadDistance * 1000)
        },
        duration: {
          text: `${travelTimeMinutes} min`,
          value: travelTimeMinutes * 60
        }
      })
    }
  }
  
  return routes
}

// Helper function to format duration from Google Routes API
function formatDuration(duration: string): string {
  // Duration comes as "1234s" format
  const seconds = parseInt(duration.replace('s', ''))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

// Helper function to parse duration to seconds
function parseDuration(duration: string): number {
  // Duration comes as "1234s" format
  return parseInt(duration.replace('s', ''))
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

// Generate time schedule for a day
function generateDaySchedule(
  temples: Temple[], 
  routes: RouteSegment[], 
  startTime: string = '09:00',
  options: ItineraryOptions = {}
): { startTime: string; endTime: string } {
  let currentTime = new Date(`2024-01-01T${startTime}:00`)
  
  temples.forEach((temple, index) => {
    // Add visit duration
    const visitDuration = calculateVisitDuration(temple)
    currentTime = new Date(currentTime.getTime() + visitDuration * 60000)
    
    // Add travel time to next temple (including buffer time for parking, walking, etc.)
    if (index < routes.length) {
      const travelTime = routes[index].duration.value / 60 // Convert to minutes
      const bufferTime = 10 // 10 minutes buffer for parking, walking, etc.
      currentTime = new Date(currentTime.getTime() + (travelTime + bufferTime) * 60000)
    }
  })
  
  let endTime = currentTime.toTimeString().slice(0, 5)
  
  // If user wants a fixed end time, adjust if necessary
  if (options.endTimePreference === 'fixed' && options.fixedEndTime) {
    const fixedEnd = new Date(`2024-01-01T${options.fixedEndTime}:00`)
    if (currentTime > fixedEnd) {
      // If calculated end time exceeds fixed end time, show a warning in the schedule
      endTime = `${options.fixedEndTime} (may run late)`
    } else {
      endTime = options.fixedEndTime
    }
  }
  
  return {
    startTime,
    endTime
  }
}

// Clustering strategy options
export type ClusteringStrategy = 'balanced' | 'geographical' | 'time-optimized'

// Itinerary options interface
export interface ItineraryOptions {
  startTime?: string
  endTimePreference?: 'flexible' | 'fixed'
  fixedEndTime?: string
}

// Main function to generate comprehensive itinerary
export async function generateAdvancedItinerary(
  temples: Temple[], 
  days: number, 
  city: string, 
  strategy: ClusteringStrategy = 'balanced',
  options: ItineraryOptions = {}
): Promise<ItineraryPlan> {
  console.log(`Generating advanced itinerary for ${temples.length} temples over ${days} days in ${city} using ${strategy} strategy`)
  
  // Choose clustering strategy
  let clusters: Temple[][]
  
  switch (strategy) {
    case 'geographical':
      clusters = geographicalKMeans(temples, days)
      console.log('Using pure geographical clustering (may result in uneven days)')
      break
    case 'time-optimized':
      clusters = timeOptimizedClustering(temples, days, options)
      console.log('Using time-optimized clustering (considers visit duration and travel time)')
      break
    case 'balanced':
    default:
      clusters = balancedClustering(temples, days)
      console.log('Using balanced clustering (balances geography with even distribution)')
      break
  }
  
  console.log('Cluster distribution:', clusters.map((cluster, i) => `Day ${i + 1}: ${cluster.length} temples`))
  
  // Optimize route for each day
  const optimizedClusters = clusters.map(cluster => optimizeRoute(cluster))
  
  // Generate detailed itinerary days
  const itineraryDays: ItineraryDay[] = []
  let totalDistance = 0
  let totalDuration = 0
  
  for (let i = 0; i < optimizedClusters.length; i++) {
    const dayTemples = optimizedClusters[i]
    const routes = await getRouteDetails(dayTemples)
    
    const dayDistance = routes.reduce((sum, route) => sum + route.distance.value, 0)
    const dayDuration = routes.reduce((sum, route) => sum + route.duration.value, 0)
    
    const schedule = generateDaySchedule(dayTemples, routes, options.startTime, options)
    
    itineraryDays.push({
      day: i + 1,
      temples: dayTemples,
      routes,
      totalDistance: dayDistance,
      totalDuration: dayDuration,
      startTime: schedule.startTime,
      endTime: schedule.endTime
    })
    
    totalDistance += dayDistance
    totalDuration += dayDuration
  }
  
  return {
    city,
    totalDays: days,
    days: itineraryDays,
    totalTemples: temples.length,
    totalDistance,
    totalDuration,
    createdAt: new Date()
  }
}