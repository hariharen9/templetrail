'use client'

import { APIProvider, Map as GoogleMap, AdvancedMarker, useMap } from '@vis.gl/react-google-maps'
import { Temple } from '@/types/temple'
import { useEffect } from 'react'

interface MapProps {
  temples: Temple[]
  center: { lat: number; lng: number }
  onBoundsChanged: (bounds: google.maps.LatLngBounds) => void
  onMarkerClick: (templeId: string) => void
  onCenterChanged?: (center: { lat: number; lng: number }) => void
}

function MapController({ center, onBoundsChanged, onCenterChanged }: {
  center: { lat: number; lng: number }
  onBoundsChanged: (bounds: google.maps.LatLngBounds) => void
  onCenterChanged?: (center: { lat: number; lng: number }) => void
}) {
  const map = useMap()

  // Update map center when center prop changes
  useEffect(() => {
    if (!map) return

    const currentCenter = map.getCenter()
    if (currentCenter) {
      const currentLat = currentCenter.lat()
      const currentLng = currentCenter.lng()

      // Only update if the center has changed significantly (more than ~100m)
      const distance = Math.sqrt(
        Math.pow(center.lat - currentLat, 2) + Math.pow(center.lng - currentLng, 2)
      )

      if (distance > 0.001) { // roughly 100m
        map.panTo(center)
      }
    }
  }, [map, center])

  useEffect(() => {
    if (!map) return

    const idleListener = map.addListener('idle', () => {
      const bounds = map.getBounds()
      if (bounds) {
        onBoundsChanged(bounds)
      }
    })

    const centerChangedListener = onCenterChanged ? map.addListener('center_changed', () => {
      const mapCenter = map.getCenter()
      if (mapCenter && onCenterChanged) {
        onCenterChanged({
          lat: mapCenter.lat(),
          lng: mapCenter.lng()
        })
      }
    }) : null

    return () => {
      google.maps.event.removeListener(idleListener)
      if (centerChangedListener) {
        google.maps.event.removeListener(centerChangedListener)
      }
    }
  }, [map, onBoundsChanged, onCenterChanged])

  return null
}

export default function Map({ temples, center, onBoundsChanged, onMarkerClick, onCenterChanged }: MapProps) {
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return <div>Google Maps API Key is missing.</div>
  }

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        style={{ width: '100%', height: '100%', borderRadius: '0.5rem', zIndex: 0 }}
        defaultCenter={center}
        defaultZoom={13}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        mapId={"a2a80a5be4606585"} // A custom map style ID
      >
        {temples.map((temple) => (
          <AdvancedMarker key={temple.id} position={temple.location} onClick={() => onMarkerClick(temple.id)}>
            <span className="text-2xl cursor-pointer">📍</span>
          </AdvancedMarker>
        ))}
        <MapController center={center} onBoundsChanged={onBoundsChanged} onCenterChanged={onCenterChanged} />
      </GoogleMap>
    </APIProvider>
  )
}