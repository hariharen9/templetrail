'use client'

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MapPin, Hotel, Home, Search, Loader2, Star, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface AccommodationPlace {
  place_id: string
  name: string
  formatted_address: string
  rating?: number
  user_ratings_total?: number
  price_level?: number
  types: string[]
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
}

interface AccommodationSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (accommodation: AccommodationPlace | null) => void
  city: string
}

const ACCOMMODATION_TYPES = [
  { id: 'hotels', label: 'Hotels & Lodging', icon: Hotel, query: 'hotels' },
  { id: 'guesthouses', label: 'Guesthouses', icon: Home, query: 'guesthouses' },
  { id: 'resorts', label: 'Resorts', icon: Hotel, query: 'resorts' }
]

export default function AccommodationSelector({ isOpen, onClose, onSelect, city }: AccommodationSelectorProps) {
  const { toast } = useToast()
  const [selectedType, setSelectedType] = useState('hotels')
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<AccommodationPlace[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedAccommodation, setSelectedAccommodation] = useState<AccommodationPlace | null>(null)



  // Search for accommodations
  const searchAccommodations = useCallback(async (type: string, query: string = '') => {
    setLoading(true)
    try {
      const typeQuery = ACCOMMODATION_TYPES.find(t => t.id === type)?.query || 'hotels'
      const searchTerm = query || typeQuery
      const fullQuery = `${searchTerm} in ${city}`

      console.log('Searching for accommodations:', fullQuery, 'type:', type)

      // Try the new places search API first
      try {
        const response = await fetch(`/api/places-search?query=${encodeURIComponent(fullQuery)}&type=lodging`)
        const data = await response.json()
        console.log('Places search response:', data)

        if (response.ok && data.results && data.results.length > 0) {
          // Transform the results to our expected format
          const transformedPlaces: AccommodationPlace[] = data.results
            .slice(0, 8)
            .filter((place: any) => place.geometry?.location)
            .map((place: any) => ({
              place_id: place.place_id,
              name: place.name,
              formatted_address: place.formatted_address,
              rating: place.rating,
              user_ratings_total: place.user_ratings_total,
              price_level: place.price_level,
              types: place.types || [],
              geometry: {
                location: {
                  lat: place.geometry.location.lat,
                  lng: place.geometry.location.lng
                }
              }
            }))

          setSuggestions(transformedPlaces)
          return
        }
      } catch (textSearchError) {
        console.log('Text search failed, falling back to autocomplete:', textSearchError)
      }

      // Fallback to autocomplete API with establishment type
      console.log('Using fallback autocomplete search')
      const autocompleteResponse = await fetch(`/api/places-autocomplete?input=${encodeURIComponent(fullQuery)}&types=establishment`)
      const autocompleteData = await autocompleteResponse.json()

      if (autocompleteResponse.ok && autocompleteData.predictions) {
        // Get detailed information for each place and filter for accommodations
        const detailedPlaces = await Promise.all(
          autocompleteData.predictions.slice(0, 12).map(async (prediction: any) => {
            try {
              const detailResponse = await fetch(`/api/place-details?place_id=${prediction.place_id}`)
              const details = await detailResponse.json()

              if (detailResponse.ok && details.geometry?.location) {
                // Filter for accommodation-related types
                const accommodationTypes = ['lodging', 'hotel', 'guest_house', 'hostel', 'resort', 'motel', 'bed_and_breakfast']
                const hasAccommodationType = details.types?.some((t: string) =>
                  accommodationTypes.includes(t) ||
                  t.includes('lodging') ||
                  t.includes('hotel')
                )

                // Also check if the name suggests it's accommodation
                const nameIndicatesAccommodation = /hotel|resort|inn|lodge|guest|hostel|motel|b&b|bed.*breakfast/i.test(details.name)

                if (hasAccommodationType || nameIndicatesAccommodation) {
                  return {
                    place_id: details.place_id,
                    name: details.name,
                    formatted_address: details.formatted_address,
                    rating: details.rating,
                    user_ratings_total: details.user_ratings_total,
                    price_level: details.price_level,
                    types: details.types || [],
                    geometry: {
                      location: {
                        lat: details.geometry.location.lat,
                        lng: details.geometry.location.lng
                      }
                    }
                  }
                }
              }
              return null
            } catch (error) {
              console.error('Error fetching place details:', error)
              return null
            }
          })
        )

        const validPlaces = detailedPlaces.filter(Boolean) as AccommodationPlace[]
        setSuggestions(validPlaces)
      } else {
        setSuggestions([])
      }
    } catch (error) {
      console.error('Error searching accommodations:', error)
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: "Unable to search for accommodations. Please try again.",
      })
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [city, toast])

  // Search when type changes or component opens
  useEffect(() => {
    if (isOpen) {
      searchAccommodations(selectedType, searchQuery)
    }
  }, [isOpen, selectedType, searchAccommodations])

  // Debounced search when query changes
  useEffect(() => {
    if (!searchQuery) return

    const timer = setTimeout(() => {
      searchAccommodations(selectedType, searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, selectedType, searchAccommodations])

  const handleSelect = (accommodation: AccommodationPlace) => {
    setSelectedAccommodation(accommodation)
  }

  const handleConfirm = () => {
    console.log('Confirming accommodation selection:', selectedAccommodation)
    onSelect(selectedAccommodation)
    onClose()
  }

  const handleSkip = () => {
    onSelect(null)
    onClose()
  }

  const getPriceLevel = (level?: number) => {
    if (!level) return null
    return '₹'.repeat(level)
  }

  const getAccommodationIcon = (types: string[]) => {
    if (types.includes('lodging') || types.includes('hotel')) return Hotel
    if (types.includes('restaurant') || types.includes('meal_takeaway')) return Home
    return Home
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Choose Your Stay in {city}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Select your accommodation to optimize your temple journey routes
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Type Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Accommodation Type</Label>
            <div className="flex flex-wrap gap-2">
              {ACCOMMODATION_TYPES.map((type) => {
                const Icon = type.icon
                return (
                  <Button
                    key={type.id}
                    variant={selectedType === type.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType(type.id)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {type.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-semibold">Search Specific Place</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder={`Search for specific hotels in ${city}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">
                {loading ? 'Searching...' : `Suggestions (${suggestions.length})`}
              </Label>
              {selectedAccommodation && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAccommodation(null)}
                  className="text-xs"
                >
                  Clear Selection
                </Button>
              )}
            </div>

            <div className="overflow-y-auto max-h-[300px] space-y-2 pr-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Finding accommodations...</p>
                  </div>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="p-3 bg-muted/50 rounded-full w-fit mx-auto mb-3">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-muted-foreground">No accommodations found</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Try searching for "hotels near {city}" or a specific hotel name
                  </p>
                </div>
              ) : (
                suggestions.map((place) => {
                  const Icon = getAccommodationIcon(place.types)
                  const isSelected = selectedAccommodation?.place_id === place.place_id

                  return (
                    <div
                      key={place.place_id}
                      onClick={() => handleSelect(place)}
                      className={cn(
                        "p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-lg flex-shrink-0",
                          isSelected ? "bg-primary/20" : "bg-muted"
                        )}>
                          <Icon className={cn(
                            "h-4 w-4",
                            isSelected ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={cn(
                              "font-semibold text-sm truncate",
                              isSelected ? "text-primary" : "text-foreground"
                            )}>
                              {place.name}
                            </h4>
                            {isSelected && (
                              <Check className="h-4 w-4 text-primary flex-shrink-0" />
                            )}
                          </div>

                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {place.formatted_address}
                          </p>

                          <div className="flex items-center gap-3 mt-2">
                            {place.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                <span className="text-xs font-medium">{place.rating}</span>
                                {place.user_ratings_total && (
                                  <span className="text-xs text-muted-foreground">
                                    ({place.user_ratings_total})
                                  </span>
                                )}
                              </div>
                            )}

                            {place.price_level && (
                              <Badge variant="secondary" className="text-xs">
                                {getPriceLevel(place.price_level)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              Skip for Now
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedAccommodation}
              className="flex-1"
            >
              {selectedAccommodation ? 'Use This Location' : 'Select Accommodation'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}