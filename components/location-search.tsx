'use client'

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin, Loader2, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"
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
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [isExpanded, setIsExpanded] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [isFocused, setIsFocused] = useState(false)

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
        setIsExpanded(false)
        setFocusedIndex(-1)
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
        setIsExpanded(false)
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
      setIsExpanded(false)
    } finally {
      setLoading(false)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isExpanded || predictions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => (prev < predictions.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (focusedIndex >= 0 && predictions[focusedIndex]) {
          handlePlaceSelect(predictions[focusedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsExpanded(false)
        setFocusedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
        setFocusedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
      {/* Unified Hero Search Container */}
      <div ref={containerRef} className="relative">
        <div className="group relative enhanced-focus touch-manipulation">
          {/* Subtle background glow - only on larger screens */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-accent/8 to-primary/8 rounded-2xl sm:rounded-3xl blur-xl sm:blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 sm:duration-700" />

          {/* Main unified container */}
          <motion.div 
            className={cn(
              "relative bg-card/95 backdrop-blur-xl border shadow-2xl overflow-hidden transition-all duration-300",
              isFocused || isExpanded
                ? "border-primary/40 shadow-primary/10 shadow-2xl"
                : "border-border/20"
            )}
            animate={{
              borderRadius: isExpanded && (predictions.length > 0 || searching) 
                ? "1.5rem" 
                : "1.5rem",
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {/* Main Input Area */}
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
                {/* Search icon */}
                <div className="flex-shrink-0 p-2 sm:p-3 bg-gradient-to-br from-primary/15 to-accent/15 rounded-xl sm:rounded-2xl">
                  <Search className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>

                {/* Input content */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2 font-serif flex items-center justify-center gap-2">
                    {selectedPlace ? (
                      <>
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Selected destination
                      </>
                    ) : (
                      "Where shall we begin?"
                    )}
                  </div>
                  
                  {/* Hidden input for functionality */}
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value)
                      if (e.target.value.length >= 2) {
                        setIsExpanded(true)
                      } else {
                        setIsExpanded(false)
                      }
                    }}
                    onFocus={() => {
                      setIsFocused(true)
                      if (inputValue.length >= 2) {
                        setIsExpanded(true)
                      }
                    }}
                    onBlur={() => {
                      setIsFocused(false)
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder=""
                    className="absolute opacity-0 pointer-events-none"
                  />
                  
                  {/* Visual input display */}
                  <div 
                    className={cn(
                      "text-base sm:text-lg lg:text-xl font-serif font-medium transition-all duration-300 cursor-text relative text-center",
                      inputValue
                        ? "text-foreground"
                        : "text-muted-foreground/60 group-hover:text-muted-foreground/80"
                    )}
                    onClick={() => inputRef.current?.focus()}
                  >
                    {inputValue || (
                      <>
                        <span className="sm:hidden">Search Places...</span>
                        <span className="hidden sm:inline">Search places across India...</span>
                      </>
                    )}
                    
                    {/* Subtle typing indicator */}
                    {searching && inputValue && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute -right-1 top-0 w-0.5 h-full bg-primary"
                      />
                    )}
                  </div>
                </div>

                {/* Action icons */}
                <div className="flex items-center gap-2">
                  {searching && (
                    <div className="flex-shrink-0 p-1 sm:p-2">
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-primary" />
                    </div>
                  )}
                  
                  {inputValue && (
                    <button
                      onClick={() => {
                        setInputValue("")
                        setIsExpanded(false)
                        setSelectedPlace(null)
                        setFocusedIndex(-1)
                        inputRef.current?.focus()
                      }}
                      className="flex-shrink-0 p-1 sm:p-2 hover:bg-muted/50 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>

              {/* Integrated Suggestions - Inside the same container */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="mt-4 sm:mt-6"
                  >
                    {/* Subtle divider */}
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-border/30 to-transparent mb-4 sm:mb-6" />
                    
                    {searching ? (
                      <div className="flex items-center justify-center py-6 sm:py-8">
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
                      <div className="py-6 sm:py-8 text-center px-4">
                        <div className="p-2 sm:p-3 bg-muted/50 rounded-full w-fit mx-auto mb-3 sm:mb-4">
                          <Search className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                        </div>
                        <div className="font-serif font-medium text-muted-foreground text-sm sm:text-base">No places found</div>
                        <div className="text-xs sm:text-sm text-muted-foreground/70 mt-1">
                          Try searching for a different city or region
                        </div>
                      </div>
                    ) : (
                      <div className="max-h-[35vh] overflow-y-auto">
                        <div className="space-y-1 sm:space-y-2">
                          {predictions.map((prediction, index) => (
                            <motion.div
                              key={prediction.place_id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, delay: index * 0.05 }}
                              onClick={() => handlePlaceSelect(prediction)}
                              className={cn(
                                "suggestion-item flex items-start gap-3 sm:gap-4 py-3 sm:py-4 px-3 sm:px-4 rounded-xl sm:rounded-2xl touch-manipulation transition-all duration-200 cursor-pointer group border min-h-[48px]",
                                focusedIndex === index
                                  ? "bg-accent/50 border-accent/50"
                                  : "border-transparent hover:bg-accent/30 hover:border-accent/20"
                              )}
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
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
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
