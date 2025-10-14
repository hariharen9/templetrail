'use client'

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"

export default function ImageCarouselModal({ 
  images, 
  open, 
  onOpenChange, 
  startIndex = 0 
}: { 
  images: any[], 
  open: boolean, 
  onOpenChange: (open: boolean) => void,
  startIndex?: number
}) {
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] bg-transparent border-none shadow-none flex items-center justify-center">
        <DialogTitle asChild>
          <VisuallyHidden.Root>Temple Image Gallery</VisuallyHidden.Root>
        </DialogTitle>
        <DialogDescription asChild>
          <VisuallyHidden.Root>A scrollable gallery of images for the selected temple.</VisuallyHidden.Root>
        </DialogDescription>
        <Carousel className="w-full h-full" opts={{ loop: true, startIndex }}>
          <CarouselContent className="h-full">
            {images.map((photo, index) => (
              <CarouselItem key={index} className="flex items-center justify-center">
                <img 
                  src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photoreference=${photo.photo_reference}&key=${API_KEY}`}
                  alt={`Temple photo ${index + 1}`}
                  className="max-h-full max-w-full object-contain"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-2 text-white bg-black/20 hover:bg-black/40" />
          <CarouselNext className="absolute right-2 text-white bg-black/20 hover:bg-black/40" />
        </Carousel>
      </DialogContent>
    </Dialog>
  )
}
