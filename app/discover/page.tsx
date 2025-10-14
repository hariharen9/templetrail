"use client"

import { useEffect, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import MapPlaceholder from "@/components/map-placeholder"
import TempleCard from "@/components/temple-card"
import PlannerFooter from "@/components/planner-footer"
import { getCoordsFromCity, getTemplesNearCoords } from "@/services/google-maps"
import { Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { useDiscoverStore } from "@/stores/discover-store"

export default function DiscoverPage() {
  const params = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const city = params.get("search") || "Varanasi"
  const lat = params.get("lat")
  const lng = params.get("lng")

  // Zustand store
  const {
    allTemples,
    filteredTemples,
    loading,
    error,
    center,
    mapCenter,
    bounds,
    showSearchArea,
    searchingArea,
    selectedTempleId,
    selectedTemples,
    days,
    setAllTemples,
    setLoading,
    setError,
    setCenter,
    setMapCenter,
    setBounds,
    setShowSearchArea,
    setSearchingArea,
    setSelectedTempleId,
    toggleTempleSelection,
    setCity,
    setDays,
    reset
  } = useDiscoverStore()

  useEffect(() => {
    async function fetchTemples() {
      setLoading(true)
      setAllTemples([]) // Clear previous results
      setShowSearchArea(false) // Hide search area button on new search
      setError(null)
      
      try {
        let coords: { lat: number; lng: number } | null = null
        
        // Use coordinates from URL if available, otherwise geocode the city
        if (lat && lng) {
          coords = { lat: parseFloat(lat), lng: parseFloat(lng) }
        } else {
          coords = await getCoordsFromCity(city)
        }
        
        if (coords) {
          setCenter(coords)
          setMapCenter(coords)
          const temples = await getTemplesNearCoords(coords)
          setAllTemples(temples)
        } else {
          console.warn('Could not get coordinates for:', city)
          setAllTemples([])
          const errorMsg = `Unable to find coordinates for ${city}. Please try a different location.`
          setError(errorMsg)
          toast({
            variant: "destructive",
            title: "Location Not Found",
            description: errorMsg,
          })
        }
      } catch (error) {
        console.error('Error fetching temples:', error)
        setAllTemples([])
        const errorMsg = "Unable to search for temples. Please check your connection and try again."
        setError(errorMsg)
        toast({
          variant: "destructive",
          title: "Search Failed",
          description: errorMsg,
        })
      } finally {
        setLoading(false)
      }
    }

    if (city) {
      setCity(city)
      fetchTemples()
    }
  }, [city, lat, lng, setLoading, setAllTemples, setShowSearchArea, setError, setCenter, setMapCenter, setCity, toast])

  // Separate cleanup effect for debounceRef
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
    }
  }, [])

  function generate() {
    const chosen = Object.keys(selectedTemples).filter(id => selectedTemples[id]);
    router.push(`/itinerary?city=${encodeURIComponent(city)}&days=${days}&temples=${chosen.join(",")}`)
  }

  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const handleMapCenterChange = useCallback((newCenter: { lat: number; lng: number }) => {
    setMapCenter(newCenter)
    
    // Debounce the search area button display
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(() => {
      // Show search area button if map moved significantly from original center
      const distance = getDistance(center, newCenter)
      setShowSearchArea(distance > 1) // Show if moved more than 1km
    }, 500) // 500ms debounce
  }, [center])

  const searchThisArea = async () => {
    setSearchingArea(true)
    try {
      const temples = await getTemplesNearCoords(mapCenter)
      setAllTemples(temples)
      // Update the center to the new search location so map shows the right area
      setCenter(mapCenter)
      setShowSearchArea(false)
      // Clear any selected temple when searching new area
      setSelectedTempleId(null)
      console.log(`Searched area around ${mapCenter.lat}, ${mapCenter.lng} and found ${temples.length} temples`)
      toast({
        title: "Area Search Complete",
        description: `Found ${temples.length} temples in this area.`,
      })
    } catch (error) {
      console.error('Error searching area:', error)
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: "Unable to search this area. Please try again.",
      })
    } finally {
      setSearchingArea(false)
    }
  }

  // Helper function to calculate distance between two points
  const getDistance = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }) => {
    const R = 6371 // Radius of the Earth in km
    const dLat = (point2.lat - point1.lat) * (Math.PI / 180)
    const dLon = (point2.lng - point1.lng) * (Math.PI / 180)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(point1.lat * (Math.PI / 180)) *
        Math.cos(point2.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance in km
  }

  const selectedCount = Object.values(selectedTemples).filter(Boolean).length

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-6 safe-left safe-right safe-bottom">
      {/* Mobile-first layout */}
      <div className="block lg:hidden">
        {/* Mobile Header */}
        <header className="mb-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl sm:text-2xl mobile-tight truncate">Temples in {city}</h2>
                {!loading && (
                  <span className="temple-count-badge inline-flex items-center px-2 py-1 rounded-full text-xs font-medium">
                    {filteredTemples.length}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedTempleId 
                  ? "Showing selected temple" 
                  : showSearchArea 
                    ? "Tap map to explore areas"
                    : "Showing temples in map view"
                }
              </p>
            </div>
            {selectedTempleId && (
              <button 
                onClick={() => setSelectedTempleId(null)} 
                className="text-sm font-semibold text-primary hover:underline touch-manipulation ml-4 flex-shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        </header>

        {/* Mobile Map */}
        <div className="relative mb-4 rounded-lg overflow-hidden">
          <MapPlaceholder 
            height="45vh"
            temples={allTemples} 
            center={center} 
            onBoundsChanged={setBounds} 
            onMarkerClick={setSelectedTempleId}
            onCenterChanged={handleMapCenterChange}
          />
          
          {/* Map Hint */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="map-hint-button absolute top-3 right-3 z-10 p-2 rounded-full shadow-sm touch-manipulation">
                <Info className="h-4 w-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[200px] text-center">
              <p className="text-sm">Adjust map view to find more temples in different areas</p>
            </TooltipContent>
          </Tooltip>
          
          {showSearchArea && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 animate-in fade-in slide-in-from-top-2 duration-300">
              <button
                onClick={searchThisArea}
                disabled={searchingArea}
                className="bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-lg hover:bg-primary/90 transition-all duration-200 flex items-center gap-2 font-medium text-sm touch-manipulation min-h-[44px]"
              >
                {searchingArea ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline">Searching...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Search area</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Mobile Temple List */}
        <div className="space-y-4 pb-28 scroll-smooth">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={`mobile-skeleton-${i}`} className="h-28 rounded-xl bg-muted animate-pulse" />
              ))
            : filteredTemples.map((t, i) => (
                <div
                  key={t.id}
                  className="opacity-0 translate-y-3"
                  style={{ animation: `fade-slide-up 500ms ${120 * i}ms forwards cubic-bezier(.2,.8,.2,1)` }}
                >
                  <TempleCard temple={t} selected={!!selectedTemples[t.id]} onToggle={toggleTempleSelection} />
                </div>
              ))}
          
          {!loading && filteredTemples.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No temples found in this area</p>
              <p className="text-sm text-muted-foreground mt-1">Try moving the map or searching a different location</p>
            </div>
          )}
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 lg:sticky lg:top-[64px] self-start fade-slide-up">
          <div className="relative">
            <MapPlaceholder 
              height={"calc(100dvh - 96px)"} 
              temples={allTemples} 
              center={center} 
              onBoundsChanged={setBounds} 
              onMarkerClick={setSelectedTempleId}
              onCenterChanged={handleMapCenterChange}
            />
            
            {/* Map Hint */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="map-hint-button absolute top-4 right-4 z-10 p-2.5 rounded-full shadow-sm touch-manipulation">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[250px] text-center">
                <p className="text-sm">Adjust map view to find more temples in different areas</p>
              </TooltipContent>
            </Tooltip>
            
            {showSearchArea && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 animate-in fade-in slide-in-from-top-2 duration-300">
                <button
                  onClick={searchThisArea}
                  disabled={searchingArea}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg hover:bg-primary/90 transition-all duration-200 flex items-center gap-2 font-medium text-sm hover:shadow-xl hover:scale-105 touch-manipulation"
                >
                  {searchingArea ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search this area
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-serif text-2xl">Temples in {city}</h2>
                {!loading && (
                  <span className="temple-count-badge inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium">
                    {filteredTemples.length} found
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedTempleId 
                  ? "Showing selected temple" 
                  : showSearchArea 
                    ? "Showing temples in current view • Move map to explore more areas"
                    : "Showing temples in map view"
                }
              </p>
            </div>
            {selectedTempleId && (
              <button onClick={() => setSelectedTempleId(null)} className="text-sm font-semibold text-primary hover:underline touch-manipulation">
                Clear Selection
              </button>
            )}
          </header>

          <div className="space-y-3 h-[calc(100dvh-168px)] lg:h-[calc(100dvh-160px)] overflow-auto pr-1">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={`desktop-skeleton-${i}`} className="h-28 rounded-lg bg-muted animate-pulse" />
                ))
              : filteredTemples.map((t, i) => (
                  <div
                    key={t.id}
                    className="opacity-0 translate-y-3"
                    style={{ animation: `fade-slide-up 500ms ${120 * i}ms forwards cubic-bezier(.2,.8,.2,1)` }}
                  >
                    <TempleCard temple={t} selected={!!selectedTemples[t.id]} onToggle={toggleTempleSelection} />
                  </div>
                ))}
          </div>
        </div>
      </div>

      <PlannerFooter selectedCount={selectedCount} days={days} setDays={setDays} onGenerate={generate} />
    </section>
  )
}
