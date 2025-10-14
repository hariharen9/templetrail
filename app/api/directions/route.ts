import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const origin = searchParams.get('origin')
  const destination = searchParams.get('destination')
  const waypoints = searchParams.get('waypoints')
  const mode = searchParams.get('mode') || 'driving'

  if (!origin || !destination) {
    return NextResponse.json({ error: 'origin and destination parameters are required' }, { status: 400 })
  }

  if (!API_KEY) {
    return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 })
  }

  try {
    let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}&key=${API_KEY}`
    
    if (waypoints) {
      url += `&waypoints=optimize:true|${encodeURIComponent(waypoints)}`
    }
    
    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'OK') {
      return NextResponse.json(data)
    } else {
      console.error(`Google Directions API error: ${data.status} - ${data.error_message}`)
      return NextResponse.json({ error: data.error_message || 'Directions API error' }, { status: 400 })
    }
  } catch (error) {
    console.error('Directions API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}