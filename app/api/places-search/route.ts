import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const type = searchParams.get('type') || 'lodging'
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 })
  }

  try {
    // Use Google Places Text Search API for finding businesses
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
    url.searchParams.append('query', query)
    url.searchParams.append('type', type)
    url.searchParams.append('key', apiKey)
    
    console.log('Places Text Search URL:', url.toString())
    
    const response = await fetch(url.toString())
    const data = await response.json()
    
    console.log('Places Text Search Response:', {
      status: response.status,
      dataStatus: data.status,
      resultsCount: data.results?.length || 0,
      errorMessage: data.error_message
    })

    if (response.ok) {
      return NextResponse.json({
        results: data.results || [],
        status: data.status,
        debug: {
          query,
          type,
          resultsCount: data.results?.length || 0
        }
      })
    } else {
      console.error('Google Places Text Search API error:', data)
      return NextResponse.json({ 
        error: 'Failed to search places',
        details: data.error_message || data.status
      }, { status: response.status })
    }
  } catch (error) {
    console.error('Places search error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}