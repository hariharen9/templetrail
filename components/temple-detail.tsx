'use client'

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Star, Phone, Clock } from "lucide-react"
import ImageCarouselModal from "./image-carousel-modal"

export default function TempleDetail({ details }: { details: any }) {
  const [isCarouselOpen, setIsCarouselOpen] = useState(false)
  const [carouselStartIndex, setCarouselStartIndex] = useState(0)

  if (!details) return null

  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  function handleImageClick(index: number) {
    setCarouselStartIndex(index)
    setIsCarouselOpen(true)
  }

  return (
    <>
      <div className="p-4 pt-0 text-sm text-muted-foreground space-y-4">
        {details.editorial_summary && <p className="text-base">{details.editorial_summary.overview}</p>}
        
        <div className="flex flex-wrap items-center gap-4">
          {details.rating && (
            <Badge variant="secondary" className="flex items-center gap-2 py-1">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span>{details.rating} ({details.user_ratings_total} reviews)</span>
            </Badge>
          )}
          {details.website && <a href={details.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Website</a>}
          {details.formatted_phone_number && <span className="flex items-center gap-2"><Phone className="h-4 w-4"/> {details.formatted_phone_number}</span>}
        </div>

        {details.opening_hours && (
          <div>
            <h4 className="font-medium text-foreground mb-2 flex items-center gap-2"><Clock className="h-4 w-4"/> Opening Hours</h4>
            <ul className="list-disc pl-5 space-y-1">
              {details.opening_hours.weekday_text.map((line: string, i: number) => <li key={i}>{line}</li>)}
            </ul>
          </div>
        )}

        {details.photos && (
          <div>
            <h4 className="font-medium text-foreground mb-2">Photos</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {details.photos.slice(0, 6).map((photo: any, i: number) => (
                <button key={i} onClick={() => handleImageClick(i)} className="focus:outline-none focus:ring-2 focus:ring-primary rounded-md overflow-hidden">
                  <img 
                    src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${API_KEY}`}
                    alt={`${details.name} photo ${i+1}`}
                    className="rounded-md object-cover h-24 w-full hover:scale-105 transition-transform duration-200"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {details.photos && (
        <ImageCarouselModal 
          images={details.photos} 
          open={isCarouselOpen} 
          onOpenChange={setIsCarouselOpen} 
          startIndex={carouselStartIndex}
        />
      )}
    </>
  )
}
