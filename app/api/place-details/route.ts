import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const placeId = searchParams.get('place_id')

  if (!placeId) {
    return NextResponse.json({ error: 'place_id parameter is required' }, { status: 400 })
  }

  if (!API_KEY) {
    return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 })
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,geometry,formatted_address,photos,rating,user_ratings_total,website,editorial_summary,opening_hours,formatted_phone_number&key=${API_KEY}`
    
    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'OK') {
      return NextResponse.json(data.result)
    } else {
      return NextResponse.json({ error: data.error_message || 'Place Details API error' }, { status: 400 })
    }
  } catch (error) {
    console.error('Place Details API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}