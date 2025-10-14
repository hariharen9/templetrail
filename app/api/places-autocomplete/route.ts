import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const input = searchParams.get('input')

  if (!input) {
    return NextResponse.json({ error: 'Input parameter is required' }, { status: 400 })
  }

  if (!API_KEY) {
    return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 })
  }

  try {
    // Try the new Places API (New) first
    try {
      const newApiResponse = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': API_KEY,
          'X-Goog-FieldMask': 'suggestions.placePrediction.place,suggestions.placePrediction.placeId,suggestions.placePrediction.text'
        },
        body: JSON.stringify({
          input: input,
          includedPrimaryTypes: ['locality', 'administrative_area_level_1', 'country'],
          languageCode: 'en'
        })
      })

      if (newApiResponse.ok) {
        const newData = await newApiResponse.json()
        
        if (newData.suggestions && newData.suggestions.length > 0) {
          const predictions = newData.suggestions
            .filter((suggestion: any) => suggestion.placePrediction)
            .map((suggestion: any) => ({
              place_id: suggestion.placePrediction.placeId,
              description: suggestion.placePrediction.text.text,
              structured_formatting: {
                main_text: suggestion.placePrediction.text.text.split(',')[0],
                secondary_text: suggestion.placePrediction.text.text.split(',').slice(1).join(',').trim()
              }
            }))
          
          return NextResponse.json({ predictions })
        }
      }
    } catch (newApiError) {
      // Silently fall back to legacy API
    }

    // Fallback to legacy Places API
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=(cities)&key=${API_KEY}`
    
    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'OK') {
      return NextResponse.json({
        predictions: data.predictions.map((prediction: any) => ({
          place_id: prediction.place_id,
          description: prediction.description,
          structured_formatting: prediction.structured_formatting
        }))
      })
    } else {
      return NextResponse.json({ 
        error: data.error_message || `Places API error: ${data.status}`,
        status: data.status 
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Places Autocomplete API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}