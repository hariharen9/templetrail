'use client'

import { useEffect, useState } from 'react'
import { ItineraryPlan } from '@/types/temple'
import { Calendar, MapPin, Clock, Navigation, Star, Phone, Globe } from 'lucide-react'

export default function PrintItineraryPage() {
  const [itinerary, setItinerary] = useState<ItineraryPlan | null>(null)

  useEffect(() => {
    // Listen for itinerary data from parent window
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.itinerary) {
        setItinerary(event.data.itinerary)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`
    }
    return `${meters} m`
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading itinerary...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-black print:text-black">
      <style jsx global>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          .avoid-break { page-break-inside: avoid; }
        }
        @page {
          margin: 1in;
          size: A4;
        }
      `}</style>

      {/* Print Controls */}
      <div className="no-print fixed top-4 right-4 z-50 space-x-2">
        <button
          onClick={() => window.print()}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          Print / Save as PDF
        </button>
        <button
          onClick={() => window.close()}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Close
        </button>
      </div>

      {/* Header */}
      <div className="bg-orange-500 text-white p-8 mb-8">
        <h1 className="text-4xl font-bold mb-2">
          {itinerary.totalDays}-Day Temple Journey
        </h1>
        <p className="text-xl opacity-90">
          Exploring {itinerary.city}'s Sacred Temples
        </p>
        <p className="text-sm opacity-75 mt-4">
          Generated on {new Date().toLocaleDateString()} • Temple Journey Planner
        </p>
      </div>

      {/* Summary Stats */}
      <div className="mb-8 avoid-break">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Journey Overview</h2>
        <div className="grid grid-cols-4 gap-6 bg-gray-50 p-6 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-2 mx-auto">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{itinerary.totalDays}</p>
            <p className="text-sm text-gray-600">Days</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-2 mx-auto">
              <MapPin className="h-6 w-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{itinerary.totalTemples}</p>
            <p className="text-sm text-gray-600">Temples</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-2 mx-auto">
              <Navigation className="h-6 w-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{formatDistance(itinerary.totalDistance)}</p>
            <p className="text-sm text-gray-600">Total Distance</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-2 mx-auto">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{formatDuration(itinerary.totalDuration)}</p>
            <p className="text-sm text-gray-600">Travel Time</p>
          </div>
        </div>
      </div>

      {/* Travel Tips */}
      <div className="mb-8 avoid-break">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Essential Travel Tips</h2>
        <div className="bg-blue-50 p-6 rounded-lg">
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Start early to avoid crowds and heat</li>
            <li>• Carry water and wear comfortable walking shoes</li>
            <li>• Respect temple dress codes and photography rules</li>
            <li>• Consider hiring a local guide for cultural insights</li>
            <li>• Allow extra time for traffic and parking</li>
            <li>• Check temple opening hours before visiting</li>
          </ul>
        </div>
      </div>

      {/* Daily Itineraries */}
      {itinerary.days.map((day, dayIndex) => (
        <div key={day.day} className={`mb-8 ${dayIndex > 0 ? 'page-break' : ''}`}>
          <div className="bg-orange-500 text-white p-4 rounded-t-lg">
            <h2 className="text-2xl font-bold">
              Day {day.day} - {day.temples.length} Temples
            </h2>
            <p className="text-sm opacity-90">
              {day.startTime} - {day.endTime} • {formatDistance(day.totalDistance)} • {formatDuration(day.totalDuration)}
            </p>
          </div>

          <div className="border border-gray-200 rounded-b-lg p-6 space-y-6">
            {day.temples.map((temple, templeIndex) => (
              <div key={temple.id} className="avoid-break">
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  {/* Temple Number */}
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {templeIndex + 1}
                  </div>

                  {/* Temple Details */}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      {temple.name}
                    </h3>

                    {/* Rating and Reviews */}
                    {temple.rating && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold text-sm">{temple.rating}</span>
                        </div>
                        {temple.user_ratings_total && (
                          <span className="text-sm text-gray-600">
                            ({temple.user_ratings_total} reviews)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Address */}
                    {temple.formatted_address && (
                      <p className="text-sm text-gray-600 mb-2 flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {temple.formatted_address}
                      </p>
                    )}

                    {/* Contact Info */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {temple.formatted_phone_number && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {temple.formatted_phone_number}
                        </div>
                      )}
                      {temple.website && (
                        <div className="flex items-center gap-1">
                          <Globe className="h-4 w-4" />
                          <span className="break-all">{temple.website}</span>
                        </div>
                      )}
                    </div>

                    {/* Opening Hours */}
                    {temple.opening_hours?.weekday_text && (
                      <div className="mt-3 p-3 bg-white rounded border">
                        <h4 className="font-semibold text-sm mb-2">Opening Hours</h4>
                        <div className="text-xs text-gray-600 space-y-1">
                          {temple.opening_hours.weekday_text.slice(0, 3).map((hours, idx) => (
                            <div key={idx}>{hours}</div>
                          ))}
                          {temple.opening_hours.weekday_text.length > 3 && (
                            <div className="text-gray-500">
                              ... and {temple.opening_hours.weekday_text.length - 3} more days
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {temple.description && (
                      <div className="mt-3 p-3 bg-white rounded border">
                        <p className="text-sm text-gray-700">{temple.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Route to next temple */}
                {templeIndex < day.temples.length - 1 && day.routes[templeIndex] && (
                  <div className="ml-12 mt-2 p-2 bg-blue-50 rounded text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4" />
                      <span>
                        Next: {formatDistance(day.routes[templeIndex].distance.value)} • 
                        {formatDuration(day.routes[templeIndex].duration.value)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
        <p>Generated by Temple Journey Planner • {new Date().toLocaleDateString()}</p>
        <p className="mt-1">Plan your spiritual journey with confidence</p>
      </div>
    </div>
  )
}