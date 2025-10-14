import { Temple, RouteSegment } from '@/types/temple'
import { calculateDistance } from './utils'

// Traveling Salesman Problem solver using nearest neighbor with 2-opt improvement
export function optimizeRoute(temples: Temple[]): Temple[] {
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

// Optimized Google Routes API call with accommodation as start/end points
export async function getOptimizedRouteDetailsWithAccommodation(
  temples: Temple[], 
  accommodation?: { geometry: { location: { lat: number; lng: number } } }
): Promise<RouteSegment[]> {
  if (temples.length === 0) return []

  const routes: RouteSegment[] = []
  
  try {
    console.log(`Getting optimized route for ${temples.length} temples with accommodation:`, accommodation ? 'Yes' : 'No')
    if (accommodation) {
      console.log('Accommodation details:', {
        hasGeometry: !!accommodation.geometry,
        hasLocation: !!accommodation.geometry?.location,
        lat: accommodation.geometry?.location?.lat,
        lng: accommodation.geometry?.location?.lng
      })
    }

    // If accommodation is provided, start and end there
    const origin = accommodation 
      ? { lat: accommodation.geometry.location.lat, lng: accommodation.geometry.location.lng }
      : { lat: temples[0].location.lat, lng: temples[0].location.lng }
    
    const destination = accommodation 
      ? { lat: accommodation.geometry.location.lat, lng: accommodation.geometry.location.lng }
      : { lat: temples[temples.length - 1].location.lat, lng: temples[temples.length - 1].location.lng }
    
    let requestBody: any = {
      origin,
      destination,
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      computeAlternativeRoutes: false,
      routeModifiers: {
        avoidTolls: false,
        avoidHighways: false,
        avoidFerries: true
      }
    }

    // Add all temples as intermediates
    if (temples.length > 0) {
      requestBody.intermediates = temples.map(temple => ({
        lat: temple.location.lat,
        lng: temple.location.lng
      }))
    }

    const response = await fetch('/api/routes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (response.ok) {
      const data = await response.json()
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        const legs = route.legs || []
        
        console.log(`Routes API returned ${legs.length} legs`)
        
        // Create accommodation waypoint for route segments
        const accommodationWaypoint = accommodation ? {
          id: 'accommodation',
          name: 'Your Stay',
          location: accommodation.geometry.location,
          formatted_address: 'Accommodation'
        } as Temple : null

        // Process each leg of the journey
        for (let i = 0; i < legs.length; i++) {
          const leg = legs[i]
          let fromPoint: Temple, toPoint: Temple

          if (accommodation) {
            if (i === 0) {
              // First leg: accommodation to first temple
              fromPoint = accommodationWaypoint!
              toPoint = temples[0]
            } else if (i === legs.length - 1) {
              // Last leg: last temple back to accommodation
              fromPoint = temples[temples.length - 1]
              toPoint = accommodationWaypoint!
            } else {
              // Middle legs: temple to temple (i-1 to i because first leg is accommodation)
              fromPoint = temples[i - 1]
              toPoint = temples[i]
            }
          } else {
            // No accommodation: temple to temple
            if (i < temples.length - 1) {
              fromPoint = temples[i]
              toPoint = temples[i + 1]
            } else {
              continue // Skip if we don't have enough temples
            }
          }

          routes.push({
            from: fromPoint,
            to: toPoint,
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

        console.log(`Successfully processed ${routes.length} route segments with accommodation`)
        console.log('Route segments:', routes.map(r => `${r.from.name} → ${r.to.name}`))
        return routes
      }
    } else {
      console.error('Routes API failed:', response.status, response.statusText)
      throw new Error(`Routes API failed: ${response.status}`)
    }
  } catch (error) {
    console.error('Error getting optimized route details, using fallback estimates:', error)
  }
  
  // Fallback to estimated routes if API fails
  return getFallbackRouteEstimatesWithAccommodation(temples, accommodation)
}

// Optimized Google Routes API call - single request with all waypoints
export async function getOptimizedRouteDetails(temples: Temple[]): Promise<RouteSegment[]> {
  if (temples.length < 2) return []

  const routes: RouteSegment[] = []
  
  try {
    console.log(`Getting optimized route for ${temples.length} temples in single API call`)

    // Prepare waypoints for single API call
    const origin = { lat: temples[0].location.lat, lng: temples[0].location.lng }
    const destination = { lat: temples[temples.length - 1].location.lat, lng: temples[temples.length - 1].location.lng }
    
    let requestBody: any = {
      origin,
      destination,
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      computeAlternativeRoutes: false,
      routeModifiers: {
        avoidTolls: false,
        avoidHighways: false,
        avoidFerries: true
      }
    }

    // Add intermediates if we have more than 2 temples
    if (temples.length > 2) {
      requestBody.intermediates = temples.slice(1, -1).map(temple => ({
        lat: temple.location.lat,
        lng: temple.location.lng
      }))
    }

    const response = await fetch('/api/routes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (response.ok) {
      const data = await response.json()
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        const legs = route.legs || []
        
        console.log(`Routes API returned ${legs.length} legs for ${temples.length} temples`)
        
        // Process each leg of the journey
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

        console.log(`Successfully processed ${routes.length} route segments`)
        return routes
      }
    } else {
      console.error('Routes API failed:', response.status, response.statusText)
      throw new Error(`Routes API failed: ${response.status}`)
    }
  } catch (error) {
    console.error('Error getting optimized route details, using fallback estimates:', error)
  }
  
  // Fallback to estimated routes if API fails
  return getFallbackRouteEstimates(temples)
}

// Fallback route estimation with accommodation when API fails
function getFallbackRouteEstimatesWithAccommodation(
  temples: Temple[], 
  accommodation?: { geometry: { location: { lat: number; lng: number } } }
): RouteSegment[] {
  const routes: RouteSegment[] = []
  
  const accommodationWaypoint = accommodation ? {
    id: 'accommodation',
    name: 'Your Stay',
    location: accommodation.geometry.location,
    formatted_address: 'Accommodation'
  } as Temple : null

  if (accommodation && temples.length > 0) {
    // Route from accommodation to first temple
    const distanceToFirst = calculateDistance(accommodationWaypoint!, temples[0])
    const roadFactor = 1.4
    const estimatedDistance = distanceToFirst * roadFactor
    const avgSpeed = estimatedDistance < 5 ? 25 : 35
    const travelTime = Math.round((estimatedDistance / avgSpeed) * 60)
    
    routes.push({
      from: accommodationWaypoint!,
      to: temples[0],
      distance: {
        text: `${estimatedDistance.toFixed(1)} km`,
        value: Math.round(estimatedDistance * 1000)
      },
      duration: {
        text: `${travelTime} min`,
        value: travelTime * 60
      }
    })

    // Routes between temples
    for (let i = 0; i < temples.length - 1; i++) {
      const straightLineDistance = calculateDistance(temples[i], temples[i + 1])
      const estimatedRoadDistance = straightLineDistance * roadFactor
      const avgSpeed = estimatedRoadDistance < 5 ? 25 : 35
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

    // Route from last temple back to accommodation
    const distanceFromLast = calculateDistance(temples[temples.length - 1], accommodationWaypoint!)
    const estimatedDistanceBack = distanceFromLast * roadFactor
    const travelTimeBack = Math.round((estimatedDistanceBack / avgSpeed) * 60)
    
    routes.push({
      from: temples[temples.length - 1],
      to: accommodationWaypoint!,
      distance: {
        text: `${estimatedDistanceBack.toFixed(1)} km`,
        value: Math.round(estimatedDistanceBack * 1000)
      },
      duration: {
        text: `${travelTimeBack} min`,
        value: travelTimeBack * 60
      }
    })
  } else {
    // No accommodation: use regular temple-to-temple routing
    return getFallbackRouteEstimates(temples)
  }
  
  console.log(`Generated ${routes.length} fallback route estimates with accommodation`)
  return routes
}

// Fallback route estimation when API fails
function getFallbackRouteEstimates(temples: Temple[]): RouteSegment[] {
  const routes: RouteSegment[] = []
  
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
  
  console.log(`Generated ${routes.length} fallback route estimates`)
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