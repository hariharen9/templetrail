'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ItineraryPlan } from '@/types/temple'
import { Calendar, MapPin, Clock, Navigation, Download, Share2, Star } from 'lucide-react'
import ExportOptionsDialog from '@/components/export-options-dialog'

interface ItinerarySummaryProps {
  itinerary: ItineraryPlan
}

export default function ItinerarySummary({ itinerary }: ItinerarySummaryProps) {
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

  const averageRating = itinerary.days
    .flatMap(day => day.temples)
    .filter(temple => temple.rating)
    .reduce((sum, temple, _, arr) => sum + (temple.rating || 0) / arr.length, 0)

  const totalReviews = itinerary.days
    .flatMap(day => day.temples)
    .reduce((sum, temple) => sum + (temple.user_ratings_total || 0), 0)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${itinerary.totalDays}-Day Temple Journey in ${itinerary.city}`,
          text: `Check out this spiritual journey through ${itinerary.totalTemples} temples in ${itinerary.city}`,
          url: window.location.href
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-serif text-2xl">
              {itinerary.totalDays}-Day Spiritual Journey
            </CardTitle>
            <p className="text-muted-foreground mt-1">
              Exploring {itinerary.city}'s sacred temples
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <ExportOptionsDialog itinerary={itinerary}>
              <Button variant="outline" size="sm" className="touch-manipulation">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </ExportOptionsDialog>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-2 mx-auto">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <p className="text-2xl font-bold">{itinerary.totalDays}</p>
            <p className="text-sm text-muted-foreground">Days</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-2 mx-auto">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <p className="text-2xl font-bold">{itinerary.totalTemples}</p>
            <p className="text-sm text-muted-foreground">Temples</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-2 mx-auto">
              <Navigation className="h-6 w-6 text-primary" />
            </div>
            <p className="text-2xl font-bold">{formatDistance(itinerary.totalDistance)}</p>
            <p className="text-sm text-muted-foreground">Total Distance</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-2 mx-auto">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <p className="text-2xl font-bold">{formatDuration(itinerary.totalDuration)}</p>
            <p className="text-sm text-muted-foreground">Travel Time</p>
          </div>
        </div>

        {averageRating > 0 && (
          <div className="flex items-center justify-center gap-4 p-4 bg-muted/30 rounded-lg mb-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold">{averageRating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">Average Rating</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Based on {totalReviews.toLocaleString()} reviews
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="font-semibold">Daily Overview</h4>
          {itinerary.days.map((day) => (
            <div key={day.day} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">Day {day.day}</Badge>
                <span className="font-medium">{day.temples.length} temples</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{formatDistance(day.totalDistance)}</span>
                <span>{day.startTime} - {day.endTime}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h5 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">Route Information</h5>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Routes are calculated using Google's Routes API for accurate distances and travel times. 
              Times include traffic-aware routing and may vary based on current conditions.
            </p>
          </div>

          <div className="p-4 bg-accent/10 rounded-lg">
            <h5 className="font-semibold mb-2">Travel Tips</h5>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Start early to avoid crowds and heat</li>
              <li>• Carry water and wear comfortable walking shoes</li>
              <li>• Respect temple dress codes and photography rules</li>
              <li>• Consider hiring a local guide for cultural insights</li>
              <li>• Allow extra time for traffic and parking</li>
              <li>• Check temple opening hours before visiting</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}