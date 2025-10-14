'use client'

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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
      } finally {
        setSearching(false)
      }
    },
    []
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
        // Fallback: just use the prediction text for search
        setInputValue(prediction.structured_formatting.main_text)
        setSelectedPlace(null)
        setOpen(false)
      }
    } catch (error) {
      console.error('Error fetching place details:', error)
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
    }
  }

  return (
    <div className="mt-4 sm:mt-6 flex flex-col gap-3 sm:gap-2 sm:flex-row sm:items-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-11 sm:h-12 text-sm sm:text-base flex-1 justify-between bg-background/80 touch-manipulation"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Search className="h-4 w-4 opacity-50 flex-shrink-0" />
              <span className={cn("truncate", !inputValue && "text-muted-foreground")}>
                {inputValue || "Search for a place..."}
              </span>
            </div>
            {searching && <Loader2 className="h-4 w-4 animate-spin opacity-50 flex-shrink-0" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[calc(100vw-2rem)] sm:w-[400px]" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Type a city, state, or country..." 
              value={inputValue}
              onValueChange={setInputValue}
              className="h-9 text-base"
            />
            <CommandList className="max-h-[50vh] sm:max-h-[300px]">
              {searching ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
                </div>
              ) : predictions.length === 0 && inputValue.length >= 2 ? (
                <CommandEmpty>No places found.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {predictions.map((prediction) => (
                    <CommandItem
                      key={prediction.place_id}
                      value={prediction.place_id}
                      onSelect={() => handlePlaceSelect(prediction)}
                      className="flex items-start gap-3 py-3 px-3 touch-manipulation"
                    >
                      <MapPin className="h-4 w-4 mt-0.5 opacity-50 flex-shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-sm sm:text-base truncate">
                          {prediction.structured_formatting.main_text}
                        </span>
                        <span className="text-xs sm:text-sm text-muted-foreground truncate">
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

      <Button
        onClick={start}
        className="h-11 sm:h-12 px-4 sm:px-6 animate-[pulse_2.5s_ease-in-out_infinite] touch-manipulation text-sm sm:text-base"
        disabled={(!selectedPlace && !inputValue) || loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="hidden sm:inline">Loading...</span>
            <span className="sm:hidden">Loading</span>
          </>
        ) : (
          <>
            <span className="hidden sm:inline">Start Planning</span>
            <span className="sm:hidden">Start</span>
          </>
        )}
      </Button>
    </div>
  )
}
