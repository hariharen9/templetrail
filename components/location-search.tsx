'use client'

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"

interface PlacePrediction {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

interface PlaceDetails {
  name: string
  formatted_address: string
  location: {
    lat: number
    lng: number
  }
}

export function LocationSearch() {
  const router = useRouter()
  const { toast } = useToast()

  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)

  // Debounced search function
  const searchPlaces = useCallback(
    async (input: string) => {
      if (input.length < 2) {
        setPredictions([])
        return
      }

      setSearching(true)
      try {
        const response = await fetch(`/api/places-autocomplete?input=${encodeURIComponent(input)}`)
        const data = await response.json()

        if (response.ok && data.predictions) {
          setPredictions(data.predictions)
        } else {
          setPredictions([])
        }
      } catch (error) {
        console.error('Error fetching place predictions:', error)
        setPredictions([])
        toast({
          variant: "destructive",
          title: "Search Error",
          description: "Unable to search for places. Please check your connection and try again.",
        })
      } finally {
        setSearching(false)
      }
    },
    [toast]
  )

  // Debounce the search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPlaces(inputValue)
    }, 300)

    return () => clearTimeout(timer)
  }, [inputValue, searchPlaces])

  const handlePlaceSelect = async (prediction: PlacePrediction) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/place-details?place_id=${prediction.place_id}`)
      const placeDetails = await response.json()

      if (response.ok && placeDetails.geometry && placeDetails.geometry.location) {
        // Transform the Google Places API response to our expected format
        const transformedPlace: PlaceDetails = {
          name: placeDetails.name,
          formatted_address: placeDetails.formatted_address,
          location: {
            lat: placeDetails.geometry.location.lat,
            lng: placeDetails.geometry.location.lng
          }
        }
        setSelectedPlace(transformedPlace)
        setInputValue(prediction.structured_formatting.main_text)
        setOpen(false)
      } else {
        console.error('Invalid place details response:', placeDetails)
        toast({
          variant: "destructive",
          title: "Location Error",
          description: "Unable to get location details. Using search term instead.",
        })
        // Fallback: just use the prediction text for search
        setInputValue(prediction.structured_formatting.main_text)
        setSelectedPlace(null)
        setOpen(false)
      }
    } catch (error) {
      console.error('Error fetching place details:', error)
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Unable to fetch location details. Please try again.",
      })
      // Fallback: just use the prediction text for search
      setInputValue(prediction.structured_formatting.main_text)
      setSelectedPlace(null)
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  function start() {
    if (selectedPlace && selectedPlace.location && selectedPlace.location.lat && selectedPlace.location.lng) {
      const params = new URLSearchParams({
        search: selectedPlace.name,
        lat: selectedPlace.location.lat.toString(),
        lng: selectedPlace.location.lng.toString()
      })
      router.push(`/discover?${params.toString()}`)
    } else if (inputValue) {
      // Fallback: use just the search term without coordinates
      router.push(`/discover?search=${encodeURIComponent(inputValue)}`)
    } else {
      console.error('No place selected or input value')
      toast({
        variant: "destructive",
        title: "Search Required",
        description: "Please enter a location to search for temples.",
      })
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="group relative cursor-pointer enhanced-focus touch-manipulation" tabIndex={0}>
              {/* Subtle background glow - only on larger screens */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-accent/8 to-primary/8 rounded-2xl sm:rounded-3xl blur-xl sm:blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 sm:duration-700" />

              {/* Main input container */}
              <div className="relative location-search-input rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
                  {/* Search icon */}
                  <div className="flex-shrink-0 p-2 sm:p-3 bg-gradient-to-br from-primary/15 to-accent/15 rounded-xl sm:rounded-2xl">
                    <Search className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>

                  {/* Input content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2 font-serif">
                      Where shall we begin?
                    </div>
                    <div className={cn(
                      "text-base sm:text-lg lg:text-xl font-serif font-medium truncate transition-all duration-300",
                      inputValue
                        ? "text-foreground"
                        : "text-muted-foreground/60 group-hover:text-muted-foreground/80"
                    )}>
                      {inputValue || (
                        <>
                          <span className="sm:hidden">Search Places...</span>
                          <span className="hidden sm:inline">Search places across India...</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Loading indicator */}
                  {searching && (
                    <div className="flex-shrink-0 p-1 sm:p-2">
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="p-0 w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] md:w-[520px] border border-border/50 sm:border-2 shadow-xl sm:shadow-2xl bg-card/95 backdrop-blur-xl rounded-xl sm:rounded-2xl"
            align="center"
            sideOffset={8}
          >
            <Command shouldFilter={false}>
              {/* Search input header */}
              <div className="border-b border-border/30 p-3 sm:p-4 lg:p-5">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <Search className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                  <span className="text-xs sm:text-sm font-serif font-medium text-muted-foreground">
                    <span className="sm:hidden">Find Sacred Places</span>
                    <span className="hidden sm:inline">Discover Sacred Destinations</span>
                  </span>
                </div>
                <CommandInput
                  placeholder="Enter city, state, or region..."
                  value={inputValue}
                  onValueChange={setInputValue}
                  className="text-sm sm:text-base border-0 p-0 h-auto focus:ring-0 placeholder:text-muted-foreground/50 font-serif"
                />
              </div>

              {/* Results */}
              <CommandList className="max-h-[50vh] sm:max-h-[60vh] lg:max-h-[420px]">
                {searching ? (
                  <div className="flex items-center justify-center py-8 sm:py-12">
                    <div className="flex flex-col items-center gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 bg-primary/10 rounded-full">
                        <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
                      </div>
                      <div className="text-center px-4">
                        <div className="font-serif font-medium text-muted-foreground text-sm sm:text-base">
                          <span className="sm:hidden">Searching...</span>
                          <span className="hidden sm:inline">Searching sacred places...</span>
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground/70 mt-1 hidden sm:block">
                          Finding temples and spiritual destinations
                        </div>
                      </div>
                    </div>
                  </div>
                ) : predictions.length === 0 && inputValue.length >= 2 ? (
                  <div className="py-8 sm:py-12 text-center px-4">
                    <div className="p-2 sm:p-3 bg-muted/50 rounded-full w-fit mx-auto mb-3 sm:mb-4">
                      <Search className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                    </div>
                    <div className="font-serif font-medium text-muted-foreground text-sm sm:text-base">No places found</div>
                    <div className="text-xs sm:text-sm text-muted-foreground/70 mt-1">
                      Try searching for a different city or region
                    </div>
                  </div>
                ) : (
                  <CommandGroup className="p-2 sm:p-3">
                    {predictions.map((prediction, index) => (
                      <CommandItem
                        key={prediction.place_id}
                        value={prediction.place_id}
                        onSelect={() => handlePlaceSelect(prediction)}
                        className="flex items-start gap-3 sm:gap-4 py-3 sm:py-4 px-3 sm:px-4 rounded-xl sm:rounded-2xl touch-manipulation hover:bg-accent/30 transition-all duration-200 cursor-pointer group border border-transparent hover:border-accent/20 min-h-[48px]"
                        style={{
                          animationDelay: `${index * 50}ms`,
                          animation: 'fade-slide-up 400ms ease-out forwards'
                        }}
                      >
                        <div className="flex-shrink-0 p-2 sm:p-2.5 bg-gradient-to-br from-primary/15 to-accent/15 rounded-lg sm:rounded-xl group-hover:from-primary/20 group-hover:to-accent/20 transition-colors">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1 justify-center">
                          <span className="font-serif font-semibold text-sm sm:text-base truncate group-hover:text-primary transition-colors">
                            {prediction.structured_formatting.main_text}
                          </span>
                          <span className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5 sm:mt-1 font-serif">
                            {prediction.structured_formatting.secondary_text}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Start Planning Button */}
      <div className="flex justify-center pt-1 sm:pt-2">
        <button
          onClick={start}
          disabled={(!selectedPlace && !inputValue) || loading}
          className="journey-button group relative overflow-hidden rounded-2xl sm:rounded-3xl px-6 sm:px-10 lg:px-14 py-4 sm:py-5 lg:py-6 font-serif text-base sm:text-lg lg:text-xl font-bold tracking-wide touch-manipulation w-full max-w-[280px] sm:max-w-[320px] lg:min-w-[280px] enhanced-focus"
        >
          {/* Button content */}
          <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-3 text-primary-foreground">
            {loading ? (
              <>
                <div className="p-0.5 sm:p-1 bg-white/20 rounded-full">
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                </div>
                <span className="font-serif text-sm sm:text-base lg:text-lg">
                  <span className="sm:hidden">Preparing...</span>
                  <span className="hidden sm:inline">Preparing Journey...</span>
                </span>
              </>
            ) : (
              <>
                <span className="font-serif text-sm sm:text-base lg:text-lg">
                  <span className="sm:hidden">Begin Journey</span>
                  <span className="hidden sm:inline">Begin Your Journey</span>
                </span>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/60 rounded-full group-hover:scale-125 transition-transform duration-300" />
              </>
            )}
          </div>

          {/* Elegant shine effect - only on hover for larger screens */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1200 ease-out hidden sm:block" />

          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-2xl sm:rounded-3xl" />
        </button>
      </div>
    </div>
  )
}
