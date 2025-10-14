import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius = searchParams.get('radius') || '15000'

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng parameters are required' }, { status: 400 })
  }

  if (!API_KEY) {
    return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 })
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=hindu_temple&key=${API_KEY}`
    console.log(`Searching temples at: ${lat}, ${lng} with radius ${radius}`)
    
    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'OK') {
      console.log(`Google Places API returned ${data.results.length} temples`)
      const temples = data.results.map((place: any) => ({
        id: place.place_id,
        name: place.name,
        city: place.vicinity || 'Unknown',
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        },
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        photos: place.photos?.map((photo: any) => ({
          photo_reference: photo.photo_reference,
          width: photo.width,
          height: photo.height
        })) || [],
        price_level: place.price_level,
        types: place.types
      }))

      return NextResponse.json({ temples })
    } else {
      console.error(`Google Places API error: ${data.status} - ${data.error_message}`)
      return NextResponse.json({ error: data.error_message || 'Places API error' }, { status: 400 })
    }
  } catch (error) {
    console.error('Nearby Search API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}