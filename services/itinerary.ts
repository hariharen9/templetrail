import { Temple, ItineraryPlan, ItineraryDay } from '@/types/temple'
import { 
  ClusteringStrategy, 
  ItineraryOptions,
  balancedClustering, 
  geographicalKMeans, 
  timeOptimizedClustering 
} from './itinerary/clustering'
import { optimizeRoute, getOptimizedRouteDetails, getOptimizedRouteDetailsWithAccommodation } from './itinerary/routing'
import { generateDaySchedule } from './itinerary/utils'

// Main function to generate comprehensive itinerary with optimized API calls
export async function generateAdvancedItinerary(
  temples: Temple[], 
  days: number, 
  city: string, 
  strategy: ClusteringStrategy = 'balanced',
  options: ItineraryOptions = {},
  accommodation?: {
    place_id: string
    name: string
    formatted_address: string
    geometry: { location: { lat: number; lng: number } }
  }
): Promise<ItineraryPlan> {
  console.log(`Generating advanced itinerary for ${temples.length} temples over ${days} days in ${city} using ${strategy} strategy`)
  
  // Choose clustering strategy
  let clusters: Temple[][]
  
  try {
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
  } catch (error) {
    console.error('Error in clustering:', error)
    throw new Error(`Failed to cluster temples: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  console.log('Cluster distribution:', clusters.map((cluster, i) => `Day ${i + 1}: ${cluster.length} temples`))
  
  // Optimize route for each day
  let optimizedClusters: Temple[][]
  try {
    optimizedClusters = clusters.map(cluster => optimizeRoute(cluster))
    console.log('Route optimization completed successfully')
  } catch (error) {
    console.error('Error in route optimization:', error)
    throw new Error(`Failed to optimize routes: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  // Generate detailed itinerary days with optimized API calls
  const itineraryDays: ItineraryDay[] = []
  let totalDistance = 0
  let totalDuration = 0
  
  // Process all days in parallel for better performance
  const dayPromises = optimizedClusters.map(async (dayTemples, i) => {
    const routes = accommodation 
      ? await getOptimizedRouteDetailsWithAccommodation(dayTemples, accommodation)
      : await getOptimizedRouteDetails(dayTemples)
    
    const dayDistance = routes.reduce((sum, route) => sum + route.distance.value, 0)
    const dayDuration = routes.reduce((sum, route) => sum + route.duration.value, 0)
    
    const schedule = generateDaySchedule(dayTemples, routes, options.startTime, options)
    
    return {
      day: i + 1,
      temples: dayTemples,
      routes,
      totalDistance: dayDistance,
      totalDuration: dayDuration,
      startTime: schedule.startTime,
      endTime: schedule.endTime
    }
  })
  
  // Wait for all days to be processed
  const processedDays = await Promise.all(dayPromises)
  
  // Sort by day number and calculate totals
  processedDays.sort((a, b) => a.day - b.day)
  
  for (const day of processedDays) {
    itineraryDays.push(day)
    totalDistance += day.totalDistance
    totalDuration += day.totalDuration
  }
  
  console.log(`Generated itinerary with ${itineraryDays.length} days, ${totalDistance/1000}km total distance, ${Math.round(totalDuration/3600)}h total duration`)
  
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

// Re-export types and functions for backward compatibility
export type { ClusteringStrategy, ItineraryOptions }