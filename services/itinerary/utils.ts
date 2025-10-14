import { Temple, RouteSegment } from '@/types/temple'
import { ItineraryOptions } from './clustering'

// Calculate distance between two points using Haversine formula
export function calculateDistance(temple1: Temple, temple2: Temple): number {
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

// Calculate suggested visit duration for each temple
export function calculateVisitDuration(temple: Temple): number {
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
export function generateDaySchedule(
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

// Format time duration in a human-readable format
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

// Parse time string to minutes
export function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

// Convert minutes to time string
export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}