'use client'

import { APIProvider, Map as GoogleMap, AdvancedMarker, useMap } from '@vis.gl/react-google-maps'
import { ItineraryPlan } from '@/types/temple'
import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'

interface ItineraryMapComponentProps {
  itinerary: ItineraryPlan
  selectedDay?: number
  accommodation?: {
    name: string
    geometry: { location: { lat: number; lng: number } }
  } | null
}

function MapController({ itinerary, selectedDay, accommodation }: ItineraryMapComponentProps) {
  const map = useMap()
  const { toast } = useToast()
  const [polylines, setPolylines] = useState<google.maps.Polyline[]>([])

  useEffect(() => {
    if (!map) return

    // Clear existing polylines
    polylines.forEach(polyline => {
      polyline.setMap(null)
    })

    // Calculate bounds to fit all temples
    const bounds = new google.maps.LatLngBounds()
    
    const daysToShow = selectedDay ? [itinerary.days[selectedDay - 1]] : itinerary.days
    
    // Ensure we have valid days and temples
    if (!daysToShow || daysToShow.length === 0) {
      console.warn('No days to show on map')
      return
    }
    
    daysToShow.forEach(day => {
      if (day && day.temples) {
        day.temples.forEach(temple => {
          if (temple && temple.location) {
            bounds.extend(new google.maps.LatLng(temple.location.lat, temple.location.lng))
          }
        })
      }
    })

    // Include accommodation in bounds if available
    if (accommodation && accommodation.geometry && accommodation.geometry.location) {
      bounds.extend(new google.maps.LatLng(accommodation.geometry.location.lat, accommodation.geometry.location.lng))
    }

    // Only fit bounds if we have valid bounds
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds)
    }

    // Create polylines from route data if available, otherwise use simple connecting lines
    const newPolylines: google.maps.Polyline[] = []

    // Helper function to create simple lines
    function createSimpleLine(from: any, to: any, dayIndex: number) {
      try {
        if (!from || !to || !from.location || !to.location) {
          console.warn('Invalid route data for simple line creation')
          return
        }
        
        // Use green color for accommodation routes
        const isAccommodationRoute = from.id === 'accommodation' || to.id === 'accommodation'
        const strokeColor = isAccommodationRoute 
          ? '#16a34a' // Green for accommodation routes
          : selectedDay ? '#3b82f6' : `hsl(${(dayIndex * 137.5) % 360}, 70%, 50%)`
        
        const polyline = new google.maps.Polyline({
          path: [
            new google.maps.LatLng(from.location.lat, from.location.lng),
            new google.maps.LatLng(to.location.lat, to.location.lng)
          ],
          geodesic: true,
          strokeColor: strokeColor,
          strokeOpacity: isAccommodationRoute ? 0.9 : 0.8,
          strokeWeight: isAccommodationRoute ? 5 : 4,
          map: map
        })
        newPolylines.push(polyline)
      } catch (error) {
        console.error('Error creating simple line:', error)
      }
    }

    daysToShow.forEach((day, dayIndex) => {
      if (!day || !day.temples || day.temples.length === 0) {
        return // Skip days with no temples
      }
      
      console.log(`Day ${day.day}: ${day.routes?.length || 0} routes, ${day.temples.length} temples`)
      if (day.routes) {
        day.routes.forEach((route, i) => {
          console.log(`  Route ${i}: ${route.from.name} → ${route.to.name}`)
        })
      }
      
      // Check if we have route polylines from the Routes API
      const hasRoutePolylines = day.routes && day.routes.some(route => route && route.polyline)
        
      if (hasRoutePolylines) {
        // Use actual route polylines from Routes API
        day.routes.forEach(route => {
          if (route && route.polyline) {
            try {
              // Check if geometry library is available
              if (google.maps.geometry && google.maps.geometry.encoding) {
                const decodedPath = google.maps.geometry.encoding.decodePath(route.polyline)
                
                // Use green color for accommodation routes, regular color for temple routes
                const isAccommodationRoute = route.from.id === 'accommodation' || route.to.id === 'accommodation'
                const strokeColor = isAccommodationRoute 
                  ? '#16a34a' // Green for accommodation routes
                  : selectedDay ? '#3b82f6' : `hsl(${(dayIndex * 137.5) % 360}, 70%, 50%)`
                
                const polyline = new google.maps.Polyline({
                  path: decodedPath,
                  geodesic: true,
                  strokeColor: strokeColor,
                  strokeOpacity: isAccommodationRoute ? 0.9 : 0.8,
                  strokeWeight: isAccommodationRoute ? 5 : 4,
                  map: map
                })
                newPolylines.push(polyline)
              } else {
                console.warn('Google Maps Geometry library not loaded, using simple line')
                toast({
                  title: "Map Loading",
                  description: "Using simplified route display while map libraries load.",
                })
                createSimpleLine(route.from, route.to, dayIndex)
              }
            } catch (error) {
              console.error('Error decoding polyline:', error)
              toast({
                variant: "destructive",
                title: "Route Display Error",
                description: "Unable to display detailed routes. Showing simplified paths.",
              })
              // Fallback to simple line
              createSimpleLine(route.from, route.to, dayIndex)
            }
          } else {
            // Fallback to simple line (this will handle accommodation routes without polylines)
            createSimpleLine(route.from, route.to, dayIndex)
          }
        })
      } else {
        // Fallback: Use route data if available, otherwise create simple connecting lines
        if (day.routes && day.routes.length > 0) {
          // Use the route data to create simple lines (includes accommodation routes)
          day.routes.forEach(route => {
            createSimpleLine(route.from, route.to, dayIndex)
          })
        } else {
          // Last resort: Create simple connecting lines between temples only
          const path = day.temples.map(temple => 
            new google.maps.LatLng(temple.location.lat, temple.location.lng)
          )

          const polyline = new google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: selectedDay ? '#3b82f6' : `hsl(${(dayIndex * 137.5) % 360}, 70%, 50%)`,
            strokeOpacity: 0.8,
            strokeWeight: 4,
            map: map
          })

          newPolylines.push(polyline)
        }
      }
    })

    setPolylines(newPolylines)

    return () => {
      newPolylines.forEach(polyline => {
        polyline.setMap(null)
      })
    }
  }, [map, itinerary, selectedDay, toast])

  return null
}

export default function ItineraryMapComponent({ itinerary, selectedDay, accommodation }: ItineraryMapComponentProps) {
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
      <span className="text-muted-foreground">Google Maps API Key is missing</span>
    </div>
  }

  if (!itinerary || !itinerary.days || itinerary.days.length === 0) {
    return <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
      <span className="text-muted-foreground">No itinerary data available</span>
    </div>
  }

  const daysToShow = selectedDay ? [itinerary.days[selectedDay - 1]].filter(Boolean) : itinerary.days
  const allTemples = daysToShow.flatMap(day => day && day.temples ? day.temples : [])

  if (allTemples.length === 0) {
    return <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
      <span className="text-muted-foreground">No temples to display on map</span>
    </div>
  }

  // Calculate center point
  const centerLat = allTemples.reduce((sum, temple) => sum + (temple.location?.lat || 0), 0) / allTemples.length
  const centerLng = allTemples.reduce((sum, temple) => sum + (temple.location?.lng || 0), 0) / allTemples.length

  return (
    <APIProvider 
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
      libraries={['geometry']}
    >
      <GoogleMap
        style={{ width: '100%', height: '100%' }}
        defaultCenter={{ lat: centerLat, lng: centerLng }}
        defaultZoom={12}
        gestureHandling={'greedy'}
        disableDefaultUI={false}
        mapId={"a2a80a5be4606585"}
      >
        {daysToShow.map((day, dayIndex) =>
          day && day.temples ? day.temples.map((temple, templeIndex) => {
            if (!temple || !temple.location || !temple.id) {
              return null
            }
            
            return (
              <AdvancedMarker
                key={`${day.day}-${temple.id}`}
                position={temple.location}
              >
                <div className="relative">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
                    style={{ 
                      backgroundColor: selectedDay ? '#3b82f6' : `hsl(${(dayIndex * 137.5) % 360}, 70%, 50%)` 
                    }}
                  >
                    {selectedDay ? templeIndex + 1 : `${day.day}.${templeIndex + 1}`}
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap">
                    {temple.name || 'Unknown Temple'}
                  </div>
                </div>
              </AdvancedMarker>
            )
          }) : []
        )}
        
        {/* Accommodation Marker */}
        {accommodation && accommodation.geometry && accommodation.geometry.location && (
          <AdvancedMarker
            key="accommodation"
            position={accommodation.geometry.location}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg bg-green-600 border-2 border-white">
                🏨
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-green-600 text-white text-xs rounded whitespace-nowrap">
                {accommodation.name}
              </div>
            </div>
          </AdvancedMarker>
        )}
        
        <MapController itinerary={itinerary} selectedDay={selectedDay} accommodation={accommodation} />
      </GoogleMap>
    </APIProvider>
  )
}