"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"

import { Temple } from "@/types/temple"
import { getTempleDetails } from "@/services/google-maps"
import TempleDetail from "./temple-detail"
import { useEffect } from "react"

export default function TempleCard({
  temple,
  onToggle,
  selected,
}: {
  temple: Temple
  onToggle: (id: string) => void
  selected?: boolean
}) {
  const [justAdded, setJustAdded] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [details, setDetails] = useState<any>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(true)

  useEffect(() => {
    async function loadInitialDetails() {
      setIsLoadingDetails(true)
      const fetchedDetails = await getTempleDetails(temple.id)
      setDetails(fetchedDetails)
      setIsLoadingDetails(false)
    }
    loadInitialDetails()
  }, [temple.id])

  function handleClick() {
    onToggle(temple.id)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 650)
  }

  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <motion.div
      layout
      initial={false}
      transition={{ type: "spring", stiffness: 420, damping: 28, mass: 0.7 }}
      className="relative"
    >
      <Card
        className={cn(
          "transition-colors w-full",
          selected ? "border-accent ring-pulse selected-glow bg-accent/5" : "hover:border-accent/50",
        )}
      >
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-lg">{temple.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{temple.city}</p>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {!isExpanded && (temple.photos || details?.photos) && (
            <div className="grid grid-cols-3 gap-2">
              {(temple.photos || details?.photos)?.slice(0, 3).map((photo: any, i: number) => (
                <img 
                  key={i} 
                  src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${API_KEY}`}
                  alt={`${temple.name} thumbnail ${i+1}`}
                  className="rounded-lg object-cover h-20 w-full"
                  loading="lazy"
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="px-0 h-auto text-sm touch-manipulation"
            >
              {isExpanded ? "Hide Details" : "Show Details"}
            </Button>
            <Button
              variant={selected ? "secondary" : "default"}
              onClick={handleClick}
              className={cn("relative overflow-hidden touch-manipulation min-h-[44px] px-4")}
              aria-pressed={selected}
            >
              <span className="relative z-10 flex items-center gap-2">
                {selected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                <span className="hidden sm:inline">{selected ? "Added" : "Add to Trip"}</span>
                <span className="sm:hidden">{selected ? "Added" : "Add"}</span>
              </span>

              <AnimatePresence>
                {justAdded && (
                  <motion.span
                    key="ripple"
                    initial={{ scale: 0, opacity: 0.35 }}
                    animate={{ scale: 2.4, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute inset-0 rounded-md bg-accent/20"
                  />
                )}
              </AnimatePresence>
            </Button>
          </div>
        </CardContent>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.section
              key="content"
              initial="collapsed"
              animate="open"
              exit="collapsed"
              variants={{
                open: { opacity: 1, height: "auto" },
                collapsed: { opacity: 0, height: 0 },
              }}
              transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
              className="overflow-hidden"
            >
              {isLoadingDetails ? <div className="h-24 w-full bg-muted animate-pulse"/> : <TempleDetail details={details} />}
            </motion.section>
          )}
        </AnimatePresence>

      </Card>

      <AnimatePresence>
        {selected && (
          <motion.span
            key="halo"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="pointer-events-none absolute -inset-0.5 rounded-[calc(var(--radius)+6px)] border border-accent/50"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && (
          <motion.div
            key="check"
            initial={{ y: -6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
            className="absolute right-2 top-2 h-6 w-6 rounded-full bg-accent text-accent-foreground grid place-items-center shadow"
            aria-hidden
          >
            <Check className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
