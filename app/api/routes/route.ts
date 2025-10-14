import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

export async function POST(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { origin, destination, intermediates, travelMode = 'DRIVE' } = body

    if (!origin || !destination) {
      return NextResponse.json({ error: 'origin and destination are required' }, { status: 400 })
    }

    // Prepare the request body for Google Routes API
    const routeRequest = {
      origin: {
        location: {
          latLng: {
            latitude: origin.lat,
            longitude: origin.lng
          }
        }
      },
      destination: {
        location: {
          latLng: {
            latitude: destination.lat,
            longitude: destination.lng
          }
        }
      },
      travelMode,
      routingPreference: 'TRAFFIC_AWARE',
      computeAlternativeRoutes: false,
      routeModifiers: {
        avoidTolls: false,
        avoidHighways: false,
        avoidFerries: false
      },
      languageCode: 'en-US',
      units: 'METRIC'
    }

    // Add intermediates (waypoints) if provided
    if (intermediates && intermediates.length > 0) {
      (routeRequest as any).intermediates = intermediates.map((point: any) => ({
        location: {
          latLng: {
            latitude: point.lat,
            longitude: point.lng
          }
        }
      }))
    }

    console.log('Making Routes API request:', JSON.stringify(routeRequest, null, 2))

    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.duration,routes.legs.distanceMeters,routes.legs.polyline,routes.legs.steps'
      },
      body: JSON.stringify(routeRequest)
    })

    const data = await response.json()
    console.log('Routes API response status:', response.status)
    console.log('Routes API response:', JSON.stringify(data, null, 2))

    if (response.ok && data.routes && data.routes.length > 0) {
      return NextResponse.json(data)
    } else {
      console.error('Routes API error:', data)
      return NextResponse.json({ 
        error: data.error?.message || 'Routes API error',
        details: data 
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Routes API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}