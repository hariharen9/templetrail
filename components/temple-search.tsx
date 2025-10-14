'use client'

import { useState, useEffect, useCallback, useRef } from "react"
import { Search, MapPin, Loader2, X, Plus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useDiscoverStore } from "@/stores/discover-store"
import { Temple } from "@/types/temple"

interface PlacePrediction {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
  types: string[]
}

interface PlaceDetails {
  place_id: string
  name: string
  formatted_address: string
  location: {
    lat: number
    lng: number
  }
  rating?: number
  user_ratings_total?: number
  types: string[]
}

export function TempleSearch() {
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { toggleTempleSelection, selectedTemples, allTemples, addManualTemple, manuallyAddedTemples } = useDiscoverStore()

  const [isExpanded, setIsExpanded] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [searching, setSearching] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [isFocused, setIsFocused] = useState(false)

  // Debounced search function for temples
  const searchTemples = useCallback(
    async (input: string) => {
      if (input.length < 2) {
        setPredictions([])
        return
      }

      setSearching(true)
      try {
        // Search for temples and religious places - enhance query for better temple results
        let searchQuery = input
        
        // If the search doesn't already contain temple-related keywords, try both the original and enhanced query
        const hasTempleKeywords = /temple|mandir|church|mosque|gurudwara|shrine|religious/i.test(input)
        
        const response = await fetch(`/api/places-autocomplete?input=${encodeURIComponent(searchQuery)}`)
        const data = await response.json()

        if (response.ok && data.predictions) {
          console.log('Search results for:', input, data.predictions.length, 'results')
          
          let allPredictions = data.predictions
          
          // If we don't have many results and no temple keywords were used, try an enhanced search
          if (allPredictions.length < 3 && !hasTempleKeywords) {
            try {
              const enhancedQuery = `${input} temple`
              const enhancedResponse = await fetch(`/api/places-autocomplete?input=${encodeURIComponent(enhancedQuery)}`)
              const enhancedData = await enhancedResponse.json()
              
              if (enhancedResponse.ok && enhancedData.predictions) {
                console.log('Enhanced search results:', enhancedData.predictions.length, 'results')
                // Combine and deduplicate results
                const combinedResults = [...allPredictions]
                enhancedData.predictions.forEach((pred: PlacePrediction) => {
                  if (!combinedResults.find(existing => existing.place_id === pred.place_id)) {
                    combinedResults.push(pred)
                  }
                })
                allPredictions = combinedResults
              }
            } catch (enhancedError) {
              console.log('Enhanced search failed, using original results')
            }
          }
          
          // Sort predictions to prioritize religious places
          const sortedPredictions = allPredictions.sort((a: PlacePrediction, b: PlacePrediction) => {
            const aIsReligious = a.types?.some(type => 
              ['place_of_worship', 'hindu_temple', 'church', 'mosque', 'synagogue'].includes(type)
            ) || 
            a.description.toLowerCase().includes('temple') ||
            a.description.toLowerCase().includes('mandir') ||
            a.description.toLowerCase().includes('church') ||
            a.description.toLowerCase().includes('mosque') ||
            a.description.toLowerCase().includes('gurudwara') ||
            a.description.toLowerCase().includes('shrine')
            
            const bIsReligious = b.types?.some(type => 
              ['place_of_worship', 'hindu_temple', 'church', 'mosque', 'synagogue'].includes(type)
            ) || 
            b.description.toLowerCase().includes('temple') ||
            b.description.toLowerCase().includes('mandir') ||
            b.description.toLowerCase().includes('church') ||
            b.description.toLowerCase().includes('mosque') ||
            b.description.toLowerCase().includes('gurudwara') ||
            b.description.toLowerCase().includes('shrine')
            
            if (aIsReligious && !bIsReligious) return -1
            if (!aIsReligious && bIsReligious) return 1
            return 0
          })
          
          setPredictions(sortedPredictions)
        } else {
          console.log('API response not ok or no predictions:', data)
          setPredictions([])
        }
      } catch (error) {
        console.error('Error fetching temple predictions:', error)
        setPredictions([])
        toast({
          variant: "destructive",
          title: "Search Error",
          description: "Unable to search for temples. Please check your connection and try again.",
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
      searchTemples(inputValue)
    }, 300)

    return () => clearTimeout(timer)
  }, [inputValue, searchTemples])

  const handleTempleSelect = async (prediction: PlacePrediction) => {
    setSearching(true)
    try {
      const response = await fetch(`/api/place-details?place_id=${prediction.place_id}`)
      const placeDetails = await response.json()

      if (response.ok && placeDetails.geometry && placeDetails.geometry.location) {
        // Transform to our temple format
        const newTemple = {
          id: prediction.place_id,
          name: placeDetails.name,
          city: placeDetails.vicinity || placeDetails.formatted_address?.split(',')[1]?.trim() || 'Unknown',
          location: {
            lat: placeDetails.geometry.location.lat,
            lng: placeDetails.geometry.location.lng
          },
          rating: placeDetails.rating,
          user_ratings_total: placeDetails.user_ratings_total,
          photos: placeDetails.photos,
          types: placeDetails.types,
          formatted_address: placeDetails.formatted_address,
          formatted_phone_number: placeDetails.formatted_phone_number,
          website: placeDetails.website,
          opening_hours: placeDetails.opening_hours,
          imageUrl: placeDetails.photos?.[0] ? 
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${placeDetails.photos[0].photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}` 
            : undefined,
          description: `Religious place in ${placeDetails.vicinity || placeDetails.formatted_address}`,
          history: 'Added via search'
        }

        // Check if temple already exists
        const existingTemple = allTemples.find(t => t.id === newTemple.id)
        if (existingTemple) {
          // Just select it if it already exists
          toggleTempleSelection(newTemple.id)
          toast({
            title: "Temple Selected",
            description: `${newTemple.name} has been added to your selection.`,
          })
        } else {
          // Add to temples list as manually added and select it
          addManualTemple(newTemple)
          toggleTempleSelection(newTemple.id)
          toast({
            title: "Temple Added",
            description: `${newTemple.name} has been added to your list and selected.`,
          })
        }

        setInputValue("")
        setIsExpanded(false)
        setFocusedIndex(-1)
      } else {
        console.error('Invalid place details response:', placeDetails)
        toast({
          variant: "destructive",
          title: "Location Error",
          description: "Unable to get temple details. Please try another search.",
        })
      }
    } catch (error) {
      console.error('Error fetching place details:', error)
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Unable to fetch temple details. Please try again.",
      })
    } finally {
      setSearching(false)
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
          handleTempleSelect(predictions[focusedIndex])
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

  return (
    <div ref={containerRef} className="relative w-full temple-search-container">
      <div className="group relative">
        {/* Main search container */}
        <motion.div 
          className={cn(
            "relative temple-search-input rounded-xl overflow-hidden transition-all duration-300 shadow-sm",
            isFocused || isExpanded
              ? "border-primary/40 shadow-primary/10"
              : "border-border/20 hover:border-border/40"
          )}
          animate={{
            borderRadius: isExpanded && (predictions.length > 0 || searching) 
              ? "0.75rem 0.75rem 0 0" 
              : "0.75rem",
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {/* Input Area */}
          <div className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              {/* Search icon */}
              <div className="flex-shrink-0 p-1.5 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg">
                <Search className="h-4 w-4 text-primary" />
              </div>

              {/* Input content */}
              <div className="flex-1 min-w-0">
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
                  placeholder="Search temples by name..."
                  className="w-full bg-transparent border-none outline-none text-sm sm:text-base font-medium placeholder:text-muted-foreground/60"
                />
              </div>

              {/* Action icons */}
              <div className="flex items-center gap-1">
                {searching && (
                  <div className="flex-shrink-0 p-1">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                )}
                
                {inputValue && (
                  <button
                    onClick={() => {
                      setInputValue("")
                      setIsExpanded(false)
                      setFocusedIndex(-1)
                      inputRef.current?.focus()
                    }}
                    className="flex-shrink-0 p-1 hover:bg-muted/50 rounded-md transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="absolute top-full left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border border-t-0 border-border/20 rounded-b-xl shadow-lg max-h-[60vh] overflow-hidden"
            >
              {searching ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-muted-foreground text-sm">
                        Searching temples...
                      </div>
                      <div className="text-xs text-muted-foreground/70 mt-1">
                        Finding religious places and temples
                      </div>
                    </div>
                  </div>
                </div>
              ) : predictions.length === 0 && inputValue.length >= 2 ? (
                <div className="py-8 text-center px-4">
                  <div className="p-2 bg-muted/50 rounded-full w-fit mx-auto mb-3">
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="font-medium text-muted-foreground text-sm">No temples found</div>
                  <div className="text-xs text-muted-foreground/70 mt-1">
                    Try searching with different keywords
                  </div>
                </div>
              ) : (
                <div className="max-h-[50vh] overflow-y-auto">
                  <div className="p-2 space-y-1">
                    {predictions.map((prediction, index) => {
                      const isManuallyAdded = manuallyAddedTemples.has(prediction.place_id)
                      const isSelected = selectedTemples[prediction.place_id]
                      
                      return (
                        <motion.div
                          key={prediction.place_id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15, delay: index * 0.03 }}
                          onClick={() => handleTempleSelect(prediction)}
                          className={cn(
                            "temple-suggestion-item flex items-start gap-3 py-3 px-3 rounded-lg transition-all duration-200 cursor-pointer group border min-h-[48px]",
                            focusedIndex === index
                              ? "bg-accent/50 border-accent/50"
                              : "border-transparent hover:bg-accent/30 hover:border-accent/20"
                          )}
                        >
                          <div className="flex-shrink-0 p-2 bg-gradient-to-br from-primary/10 to-accent/10 rounded-md group-hover:from-primary/15 group-hover:to-accent/15 transition-colors">
                            <MapPin className="h-3 w-3 text-primary" />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1 justify-center">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                {prediction.structured_formatting.main_text}
                              </span>
                              {isManuallyAdded && (
                                <span className={cn(
                                  "temple-status-badge",
                                  isSelected 
                                    ? "temple-status-selected"
                                    : "temple-status-added"
                                )}>
                                  {isSelected ? "Selected" : "Added"}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground truncate mt-0.5">
                              {prediction.structured_formatting.secondary_text}
                            </span>
                          </div>
                          <div className="flex-shrink-0 p-1">
                            <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}