import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { ItineraryPlan } from '@/types/temple'

interface ItineraryState {
  // Data state
  itinerary: ItineraryPlan | null
  loading: boolean
  error: string | null
  
  // Input parameters
  city: string
  templeIds: string[]
  days: number
  
  // Settings state
  clusteringStrategy: 'balanced' | 'geographical' | 'time-optimized'
  startTime: string
  endTimePreference: 'flexible' | 'fixed'
  fixedEndTime: string
  
  // Temporary settings (for the settings panel)
  tempClusteringStrategy: 'balanced' | 'geographical' | 'time-optimized'
  tempDays: number
  tempStartTime: string
  tempEndTimePreference: 'flexible' | 'fixed'
  tempFixedEndTime: string
  
  // UI state
  showSettings: boolean
  expandedDays: Set<number>
  selectedDay: number | undefined
  
  // Actions
  setItinerary: (itinerary: ItineraryPlan | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setCity: (city: string) => void
  setTempleIds: (ids: string[]) => void
  setDays: (days: number) => void
  setClusteringStrategy: (strategy: 'balanced' | 'geographical' | 'time-optimized') => void
  setStartTime: (time: string) => void
  setEndTimePreference: (preference: 'flexible' | 'fixed') => void
  setFixedEndTime: (time: string) => void
  setShowSettings: (show: boolean) => void
  toggleDayExpansion: (day: number) => void
  expandAllDays: () => void
  collapseAllDays: () => void
  setSelectedDay: (day: number | undefined) => void
  
  // Temporary settings actions
  setTempClusteringStrategy: (strategy: 'balanced' | 'geographical' | 'time-optimized') => void
  setTempDays: (days: number) => void
  setTempStartTime: (time: string) => void
  setTempEndTimePreference: (preference: 'flexible' | 'fixed') => void
  setTempFixedEndTime: (time: string) => void
  applyTempSettings: () => void
  resetTempSettings: () => void
  openSettings: () => void
  
  // Utility actions
  reset: () => void
}

export const useItineraryStore = create<ItineraryState>()(
  devtools(
    (set, get) => ({
      // Initial state
      itinerary: null,
      loading: true,
      error: null,
      city: 'Varanasi',
      templeIds: [],
      days: 3,
      clusteringStrategy: 'balanced',
      startTime: '09:00',
      endTimePreference: 'flexible',
      fixedEndTime: '18:00',
      tempClusteringStrategy: 'balanced',
      tempDays: 3,
      tempStartTime: '09:00',
      tempEndTimePreference: 'flexible',
      tempFixedEndTime: '18:00',
      showSettings: false,
      expandedDays: new Set([1]),
      selectedDay: undefined,

      // Actions
      setItinerary: (itinerary) => set({ itinerary }, false, 'setItinerary'),
      
      setLoading: (loading) => set({ loading }, false, 'setLoading'),
      
      setError: (error) => set({ error }, false, 'setError'),
      
      setCity: (city) => set({ city }, false, 'setCity'),
      
      setTempleIds: (templeIds) => set({ templeIds }, false, 'setTempleIds'),
      
      setDays: (days) => set({ days }, false, 'setDays'),
      
      setClusteringStrategy: (clusteringStrategy) => 
        set({ clusteringStrategy }, false, 'setClusteringStrategy'),
      
      setStartTime: (startTime) => set({ startTime }, false, 'setStartTime'),
      
      setEndTimePreference: (endTimePreference) => 
        set({ endTimePreference }, false, 'setEndTimePreference'),
      
      setFixedEndTime: (fixedEndTime) => set({ fixedEndTime }, false, 'setFixedEndTime'),
      
      setShowSettings: (showSettings) => set({ showSettings }, false, 'setShowSettings'),
      
      toggleDayExpansion: (day) => 
        set((state) => {
          const newExpanded = new Set(state.expandedDays)
          if (newExpanded.has(day)) {
            newExpanded.delete(day)
          } else {
            newExpanded.add(day)
          }
          return { expandedDays: newExpanded }
        }, false, 'toggleDayExpansion'),
      
      expandAllDays: () => 
        set((state) => ({
          expandedDays: state.itinerary 
            ? new Set(state.itinerary.days.map(day => day.day))
            : new Set()
        }), false, 'expandAllDays'),
      
      collapseAllDays: () => set({ expandedDays: new Set() }, false, 'collapseAllDays'),
      
      setSelectedDay: (selectedDay) => set({ selectedDay }, false, 'setSelectedDay'),
      
      // Temporary settings actions
      setTempClusteringStrategy: (tempClusteringStrategy) => 
        set({ tempClusteringStrategy }, false, 'setTempClusteringStrategy'),
      
      setTempDays: (tempDays) => set({ tempDays }, false, 'setTempDays'),
      
      setTempStartTime: (tempStartTime) => set({ tempStartTime }, false, 'setTempStartTime'),
      
      setTempEndTimePreference: (tempEndTimePreference) => 
        set({ tempEndTimePreference }, false, 'setTempEndTimePreference'),
      
      setTempFixedEndTime: (tempFixedEndTime) => 
        set({ tempFixedEndTime }, false, 'setTempFixedEndTime'),
      
      applyTempSettings: () => 
        set((state) => ({
          days: state.tempDays,
          clusteringStrategy: state.tempClusteringStrategy,
          startTime: state.tempStartTime,
          endTimePreference: state.tempEndTimePreference,
          fixedEndTime: state.tempFixedEndTime,
          showSettings: false,
        }), false, 'applyTempSettings'),
      
      resetTempSettings: () => 
        set((state) => ({
          tempDays: state.days,
          tempClusteringStrategy: state.clusteringStrategy,
          tempStartTime: state.startTime,
          tempEndTimePreference: state.endTimePreference,
          tempFixedEndTime: state.fixedEndTime,
        }), false, 'resetTempSettings'),
      
      openSettings: () => 
        set((state) => ({
          showSettings: true,
          tempDays: state.days,
          tempClusteringStrategy: state.clusteringStrategy,
          tempStartTime: state.startTime,
          tempEndTimePreference: state.endTimePreference,
          tempFixedEndTime: state.fixedEndTime,
        }), false, 'openSettings'),
      
      reset: () => set({
        itinerary: null,
        loading: true,
        error: null,
        expandedDays: new Set([1]),
        selectedDay: undefined,
        showSettings: false,
      }, false, 'reset'),
    }),
    {
      name: 'itinerary-store',
    }
  )
)