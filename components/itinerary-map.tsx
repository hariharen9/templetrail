'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { ItineraryPlan } from '@/types/temple'

interface ItineraryMapProps {
  itinerary: ItineraryPlan
  selectedDay?: number
  height?: string
}

const ItineraryMapComponent = dynamic(() => import('./itinerary-map-component'), {
  loading: () => <div className="w-full h-full bg-muted animate-pulse rounded-lg flex items-center justify-center">
    <span className="text-muted-foreground">Loading map...</span>
  </div>,
  ssr: false,
})

export default function ItineraryMap({ itinerary, selectedDay, height = "400px" }: ItineraryMapProps) {
  return (
    <div style={{ height }} className="w-full rounded-lg overflow-hidden">
      <ItineraryMapComponent 
        itinerary={itinerary} 
        selectedDay={selectedDay}
      />
    </div>
  )
}