'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Temple } from '@/types/temple'

interface MapPlaceholderProps {
  height: string
  temples: Temple[]
  center: { lat: number; lng: number }
  onBoundsChanged: (bounds: google.maps.LatLngBounds) => void
  onMarkerClick: (templeId: string) => void
  onCenterChanged?: (center: { lat: number; lng: number }) => void
}



export default function MapPlaceholder({ height, temples, center, onBoundsChanged, onMarkerClick, onCenterChanged }: MapPlaceholderProps) {
  const Map = useMemo(
    () =>
      dynamic(() => import('@/components/map'), {
        loading: () => <div style={{ height }} className="w-full bg-muted animate-pulse rounded-lg" />,
        ssr: false,
      }),
    [height],
  )

  return (
    <div style={{ height }}>
      <Map 
        temples={temples} 
        center={center} 
        onBoundsChanged={onBoundsChanged} 
        onMarkerClick={onMarkerClick}
        onCenterChanged={onCenterChanged}
      />
    </div>
  )
}



  
