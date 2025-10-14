"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getTemplesByIds } from "@/services/temple"
import { generateAdvancedItinerary } from "@/services/itinerary"
import { ItineraryPlan } from "@/types/temple"
import ItinerarySummary from "@/components/itinerary-summary"
import ItineraryDayCard from "@/components/itinerary-day-card"
import ItineraryMap from "@/components/itinerary-map"
import { ArrowLeft, MapIcon, Calendar, Loader2, AlertCircle, Info, Settings, X, Clock, Users } from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { useItineraryStore } from "@/stores/itinerary-store"

export default function ItineraryPage() {
  const params = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const city = params.get("city") || "Varanasi"
  const days = Number(params.get("days") || 3)
  const templeIds = (params.get("temples") || "").split(",").filter(Boolean)

  const [itinerary, setItinerary] = useState<ItineraryPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]))
  const [selectedDay, setSelectedDay] = useState<number | undefined>(undefined)
  const [clusteringStrategy, setClusteringStrategy] = useState<'balanced' | 'geographical' | 'time-optimized'>('balanced')
  const [customDays, setCustomDays] = useState(days)
  const [startTime, setStartTime] = useState('09:00')
  const [endTimePreference, setEndTimePreference] = useState('flexible') // 'flexible' | 'fixed'
  const [fixedEndTime, setFixedEndTime] = useState('18:00')
  const [showSettings, setShowSettings] = useState(false)
  
  // Temporary settings for the panel (not applied until "Done" is clicked)
  const [tempClusteringStrategy, setTempClusteringStrategy] = useState(clusteringStrategy)
  const [tempCustomDays, setTempCustomDays] = useState(customDays)
  const [tempStartTime, setTempStartTime] = useState(startTime)
  const [tempEndTimePreference, setTempEndTimePreference] = useState(endTimePreference)
  const [tempFixedEndTime, setTempFixedEndTime] = useState(fixedEndTime)

  // Memoize templeIds array to prevent unnecessary re-renders
  const memoizedTempleIds = useMemo(() => templeIds, [templeIds.join(",")])

  useEffect(() => {
    if (memoizedTempleIds.length === 0) {
      setError("No temples selected for itinerary")
      setLoading(false)
      return
    }

    async function createItinerary() {
      setLoading(true)
      setError(null)
      
      try {
        console.log(`Creating itinerary for ${memoizedTempleIds.length} temples over ${customDays} days`)
        
        // Fetch temple details
        const temples = await getTemplesByIds(memoizedTempleIds)
        console.log(`Fetched ${temples.length} temple details`)
        
        if (temples.length === 0) {
          throw new Error("Could not fetch temple details")
        }

        toast({
          title: "Generating Itinerary",
          description: `Creating your ${customDays}-day journey with ${temples.length} temples...`,
        })

        // Generate advanced itinerary with selected strategy and custom settings
        const plan = await generateAdvancedItinerary(temples, customDays, city, clusteringStrategy, {
          startTime,
          endTimePreference: endTimePreference as 'flexible' | 'fixed',
          fixedEndTime
        })
        console.log("Generated itinerary plan:", plan)
        
        setItinerary(plan)
        toast({
          title: "Itinerary Ready!",
          description: `Your ${customDays}-day spiritual journey has been created successfully.`,
        })
      } catch (error) {
        console.error("Failed to generate itinerary:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to generate itinerary"
        setError(errorMessage)
        toast({
          variant: "destructive",
          title: "Itinerary Generation Failed",
          description: errorMessage,
        })
      } finally {
        setLoading(false)
      }
    }

    createItinerary()
  }, [memoizedTempleIds, customDays, city, clusteringStrategy, startTime, endTimePreference, fixedEndTime])

  const toggleDayExpansion = (dayNumber: number) => {
    const newExpanded = new Set(expandedDays)
    if (newExpanded.has(dayNumber)) {
      newExpanded.delete(dayNumber)
    } else {
      newExpanded.add(dayNumber)
    }
    setExpandedDays(newExpanded)
  }

  const expandAllDays = () => {
    if (itinerary) {
      setExpandedDays(new Set(itinerary.days.map(day => day.day)))
    }
  }

  const collapseAllDays = () => {
    setExpandedDays(new Set())
  }

  const applySettings = () => {
    // Apply all temporary settings to actual settings
    setCustomDays(tempCustomDays)
    setStartTime(tempStartTime)
    setEndTimePreference(tempEndTimePreference)
    setFixedEndTime(tempFixedEndTime)
    setClusteringStrategy(tempClusteringStrategy)
    setShowSettings(false)
  }

  const cancelSettings = () => {
    // Reset temporary settings to current actual settings
    setTempCustomDays(customDays)
    setTempStartTime(startTime)
    setTempEndTimePreference(endTimePreference)
    setTempFixedEndTime(fixedEndTime)
    setTempClusteringStrategy(clusteringStrategy)
    setShowSettings(false)
  }

  const openSettings = () => {
    // Sync temporary settings with current actual settings when opening
    setTempCustomDays(customDays)
    setTempStartTime(startTime)
    setTempEndTimePreference(endTimePreference)
    setTempFixedEndTime(fixedEndTime)
    setTempClusteringStrategy(clusteringStrategy)
    setShowSettings(true)
  }

  // Handle keyboard shortcuts in settings panel
  useEffect(() => {
    if (!showSettings) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        applySettings()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        cancelSettings()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showSettings])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Creating Your Spiritual Journey</h2>
            <p className="text-muted-foreground">
              Optimizing routes and gathering temple information...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !itinerary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Unable to Create Itinerary</h2>
            <p className="text-muted-foreground">
              {error || "Something went wrong while generating your itinerary."}
            </p>
          </div>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 safe-left safe-right">
          {/* Mobile Header */}
          <div className="block lg:hidden">
            <div className="flex items-center justify-between mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2 touch-manipulation"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={openSettings}
                className="flex items-center gap-2 touch-manipulation"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Customize</span>
                {(customDays !== days || startTime !== '09:00' || clusteringStrategy !== 'balanced' || endTimePreference !== 'flexible') && (
                  <div className="w-2 h-2 bg-primary rounded-full" />
                )}
              </Button>
            </div>
            <div className="text-center">
              <h1 className="font-serif text-xl sm:text-2xl font-bold mobile-tight">
                {customDays}-Day Temple Journey
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {itinerary.city} • {itinerary.totalTemples} temples
              </p>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2 touch-manipulation"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Discovery
              </Button>
              <div>
                <h1 className="font-serif text-2xl font-bold">
                  {customDays}-Day Temple Journey
                </h1>
                <p className="text-muted-foreground">
                  {itinerary.city} • {itinerary.totalTemples} temples • {startTime} start • {clusteringStrategy} strategy
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={openSettings}
                className="flex items-center gap-2 touch-manipulation"
              >
                <Settings className="h-4 w-4" />
                Customize Trip
                {(customDays !== days || startTime !== '09:00' || clusteringStrategy !== 'balanced' || endTimePreference !== 'flexible') && (
                  <div className="w-2 h-2 bg-primary rounded-full" />
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={expandAllDays} className="touch-manipulation">
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAllDays} className="touch-manipulation">
                Collapse All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Trip Customization
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={cancelSettings}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Days Configuration */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Trip Duration
                    </Label>
                    <div className="space-y-2">
                      <Label htmlFor="days" className="text-sm">Number of Days</Label>
                      <Input
                        id="days"
                        type="number"
                        min="1"
                        max="14"
                        value={tempCustomDays}
                        onChange={(e) => setTempCustomDays(Number(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Distribute {itinerary?.totalTemples || 0} temples across {tempCustomDays} days
                      </p>
                    </div>
                  </div>

                  {/* Time Configuration */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Daily Schedule
                    </Label>
                    <div className="space-y-2">
                      <Label htmlFor="startTime" className="text-sm">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={tempStartTime}
                        onChange={(e) => setTempStartTime(e.target.value)}
                        className="w-full"
                      />
                      
                      <Label className="text-sm">End Time Preference</Label>
                      <select 
                        value={tempEndTimePreference} 
                        onChange={(e) => setTempEndTimePreference(e.target.value as 'flexible' | 'fixed')}
                        className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                      >
                        <option value="flexible">Flexible (Based on temples)</option>
                        <option value="fixed">Fixed End Time</option>
                      </select>
                      
                      {tempEndTimePreference === 'fixed' && (
                        <Input
                          type="time"
                          value={tempFixedEndTime}
                          onChange={(e) => setTempFixedEndTime(e.target.value)}
                          className="w-full"
                        />
                      )}
                    </div>
                  </div>

                  {/* Clustering Strategy */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Distribution Strategy
                    </Label>
                    <div className="space-y-2">
                      <Label className="text-sm">Temple Grouping</Label>
                      <select 
                        value={tempClusteringStrategy} 
                        onChange={(e) => setTempClusteringStrategy(e.target.value as any)}
                        className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                      >
                        <option value="balanced">Balanced Days</option>
                        <option value="geographical">Geographical Clustering</option>
                        <option value="time-optimized">Time Optimized</option>
                      </select>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        {tempClusteringStrategy === 'balanced' && (
                          <p>• Even distribution of temples across days<br/>• Balanced workload per day</p>
                        )}
                        {tempClusteringStrategy === 'geographical' && (
                          <p>• Minimize travel distances<br/>• Group nearby temples together</p>
                        )}
                        {tempClusteringStrategy === 'time-optimized' && (
                          <p>• 8-10 hour days including travel<br/>• Consider temple visit durations</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="pt-4 border-t">
                  <Label className="text-sm font-semibold mb-3 block">Quick Presets</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setTempStartTime('08:00')
                        setTempEndTimePreference('flexible')
                        setTempClusteringStrategy('time-optimized')
                      }}
                      className="text-left justify-start"
                    >
                      <div>
                        <div className="font-medium">Early Bird</div>
                        <div className="text-xs text-muted-foreground">8 AM start, time-optimized</div>
                      </div>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setTempStartTime('09:00')
                        setTempEndTimePreference('flexible')
                        setTempClusteringStrategy('balanced')
                      }}
                      className="text-left justify-start"
                    >
                      <div>
                        <div className="font-medium">Balanced</div>
                        <div className="text-xs text-muted-foreground">9 AM start, even distribution</div>
                      </div>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setTempStartTime('10:00')
                        setTempEndTimePreference('fixed')
                        setTempFixedEndTime('17:00')
                        setTempClusteringStrategy('geographical')
                      }}
                      className="text-left justify-start"
                    >
                      <div>
                        <div className="font-medium">Relaxed</div>
                        <div className="text-xs text-muted-foreground">10 AM - 5 PM, minimal travel</div>
                      </div>
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Regenerating itinerary...
                      </>
                    ) : (
                      <>
                        Click 'Apply Changes' to regenerate your itinerary
                        <span className="text-xs opacity-60">• Cmd+Enter to apply • Esc to cancel</span>
                      </>
                    )}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setTempCustomDays(days)
                        setTempStartTime('09:00')
                        setTempEndTimePreference('flexible')
                        setTempFixedEndTime('18:00')
                        setTempClusteringStrategy('balanced')
                      }}
                    >
                      Reset to Default
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={cancelSettings}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      onClick={applySettings}
                      className={
                        tempCustomDays !== customDays || 
                        tempStartTime !== startTime || 
                        tempEndTimePreference !== endTimePreference || 
                        tempFixedEndTime !== fixedEndTime || 
                        tempClusteringStrategy !== clusteringStrategy
                          ? "bg-primary" 
                          : ""
                      }
                    >
                      Apply Changes
                      {(tempCustomDays !== customDays || 
                        tempStartTime !== startTime || 
                        tempEndTimePreference !== endTimePreference || 
                        tempFixedEndTime !== fixedEndTime || 
                        tempClusteringStrategy !== clusteringStrategy) && (
                        <div className="ml-2 w-2 h-2 bg-white rounded-full" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-6 safe-left safe-right">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="overview" className="flex items-center gap-2 text-sm touch-manipulation">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger value="daily" className="flex items-center gap-2 text-sm touch-manipulation">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Daily Plans</span>
              <span className="sm:hidden">Days</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2 text-sm touch-manipulation">
              <MapIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Map View</span>
              <span className="sm:hidden">Map</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ItinerarySummary itinerary={itinerary} />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-4"
              >
                <h3 className="font-serif text-xl">Daily Breakdown</h3>
                {itinerary.days.map((day, index) => (
                  <ItineraryDayCard
                    key={day.day}
                    day={day}
                    isExpanded={expandedDays.has(day.day)}
                    onToggleExpand={() => toggleDayExpansion(day.day)}
                  />
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="space-y-4"
              >
                <h3 className="font-serif text-xl">Route Overview</h3>
                <ItineraryMap itinerary={itinerary} height="600px" />
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="daily" className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="font-serif text-2xl">Daily Itineraries</h2>
              <div className="flex gap-2">
                {itinerary.days.map((day) => (
                  <Button
                    key={day.day}
                    variant={selectedDay === day.day ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDay(selectedDay === day.day ? undefined : day.day)}
                  >
                    Day {day.day}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-4">
                {itinerary.days
                  .filter(day => !selectedDay || day.day === selectedDay)
                  .map((day, index) => (
                    <motion.div
                      key={day.day}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <ItineraryDayCard
                        day={day}
                        isExpanded={true}
                        onToggleExpand={() => {}}
                      />
                    </motion.div>
                  ))}
              </div>

              <div className="space-y-4">
                <h3 className="font-serif text-xl">
                  {selectedDay ? `Day ${selectedDay} Route` : 'All Routes'}
                </h3>
                <ItineraryMap 
                  itinerary={itinerary} 
                  selectedDay={selectedDay}
                  height="500px" 
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl">Interactive Map</h2>
                <div className="flex gap-2">
                  <Button
                    variant={!selectedDay ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDay(undefined)}
                  >
                    All Days
                  </Button>
                  {itinerary.days.map((day) => (
                    <Button
                      key={day.day}
                      variant={selectedDay === day.day ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDay(day.day)}
                    >
                      Day {day.day}
                    </Button>
                  ))}
                </div>
              </div>
              
              <ItineraryMap 
                itinerary={itinerary} 
                selectedDay={selectedDay}
                height="calc(100vh - 200px)" 
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
