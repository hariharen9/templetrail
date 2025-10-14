import { Temple, ItineraryPlan, ItineraryDay } from '@/types/temple'
import { 
  ClusteringStrategy, 
  ItineraryOptions,
  balancedClustering, 
  geographicalKMeans, 
  timeOptimizedClustering 
} from './itinerary/clustering'
import { optimizeRoute, getOptimizedRouteDetails } from './itinerary/routing'
import { generateDaySchedule } from './itinerary/utils'

// Main function to generate comprehensive itinerary with optimized API calls
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
  
  // Generate detailed itinerary days with optimized API calls
  const itineraryDays: ItineraryDay[] = []
  let totalDistance = 0
  let totalDuration = 0
  
  // Process all days in parallel for better performance
  const dayPromises = optimizedClusters.map(async (dayTemples, i) => {
    const routes = await getOptimizedRouteDetails(dayTemples)
    
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