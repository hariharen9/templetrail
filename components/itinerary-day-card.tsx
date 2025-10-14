'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ItineraryDay } from '@/types/temple'
import { Clock, MapPin, Star, Navigation, ChevronDown, ChevronUp, Camera } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ItineraryDayCardProps {
  day: ItineraryDay
  isExpanded?: boolean
  onToggleExpand?: () => void
}

export default function ItineraryDayCard({ day, isExpanded = false, onToggleExpand }: ItineraryDayCardProps) {
  const [expandedTemple, setExpandedTemple] = useState<string | null>(null)

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`
    }
    return `${meters} m`
  }

  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-serif text-xl">Day {day.day}</CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{day.temples.length} temples</span>
              </div>
              <div className="flex items-center gap-1">
                <Navigation className="h-4 w-4" />
                <span>{formatDistance(day.totalDistance)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{day.startTime} - {day.endTime}</span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="flex items-center gap-2"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <CardContent className="pt-0">
              <div className="space-y-4">
                {day.temples.map((temple, index) => (
                  <div key={temple.id} className="relative">
                    {/* Temple Card */}
                    <div className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                      {/* Temple Image */}
                      <div className="flex-shrink-0">
                        {temple.photos && temple.photos.length > 0 ? (
                          <img
                            src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photoreference=${temple.photos[0].photo_reference}&key=${API_KEY}`}
                            alt={temple.name}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                            <Camera className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Temple Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-lg leading-tight">{temple.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{temple.city}</p>
                            
                            {temple.rating && (
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                  <span className="text-sm font-medium">{temple.rating}</span>
                                </div>
                                {temple.user_ratings_total && (
                                  <span className="text-xs text-muted-foreground">
                                    ({temple.user_ratings_total} reviews)
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <Badge variant="secondary" className="text-xs">
                              Visit {index + 1}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              45-60 min visit
                            </p>
                          </div>
                        </div>

                        {temple.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {temple.description}
                          </p>
                        )}

                        {temple.opening_hours?.weekday_text && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">
                              Today: {temple.opening_hours.weekday_text[new Date().getDay()]}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Route to Next Temple */}
                    {index < day.routes.length && (
                      <div className="flex items-center justify-center py-3">
                        <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-full text-sm">
                          <Navigation className="h-4 w-4 text-primary" />
                          <span className="font-medium">{day.routes[index].distance.text}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">{day.routes[index].duration.text}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Day Summary */}
                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  <h5 className="font-semibold mb-2">Day {day.day} Summary</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Distance</p>
                      <p className="font-medium">{formatDistance(day.totalDistance)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Travel Time</p>
                      <p className="font-medium">{formatDuration(day.totalDuration)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Start Time</p>
                      <p className="font-medium">{day.startTime}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">End Time</p>
                      <p className="font-medium">{day.endTime}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}