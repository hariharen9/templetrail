import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Temple } from '@/types/temple'

interface DiscoverState {
  // Data state
  allTemples: Temple[]
  filteredTemples: Temple[]
  loading: boolean
  error: string | null
  
  // Map state
  center: { lat: number; lng: number }
  mapCenter: { lat: number; lng: number }
  bounds: google.maps.LatLngBounds | undefined
  showSearchArea: boolean
  searchingArea: boolean
  
  // Selection state
  selectedTempleId: string | null
  selectedTemples: Record<string, boolean>
  manuallyAddedTemples: Set<string> // Track temples added via search
  
  // Search state
  city: string
  days: number
  
  // Actions
  setAllTemples: (temples: Temple[]) => void
  addManualTemple: (temple: Temple) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setCenter: (center: { lat: number; lng: number }) => void
  setMapCenter: (center: { lat: number; lng: number }) => void
  setBounds: (bounds: google.maps.LatLngBounds | undefined) => void
  setShowSearchArea: (show: boolean) => void
  setSearchingArea: (searching: boolean) => void
  setSelectedTempleId: (id: string | null) => void
  toggleTempleSelection: (id: string) => void
  setCity: (city: string) => void
  setDays: (days: number) => void
  clearSelection: () => void
  reset: () => void
}

const DEFAULT_CENTER = { lat: 25.3176, lng: 82.9739 } // Varanasi

export const useDiscoverStore = create<DiscoverState>()(
  devtools(
    (set, get) => ({
      // Initial state
      allTemples: [],
      filteredTemples: [],
      loading: true,
      error: null,
      center: DEFAULT_CENTER,
      mapCenter: DEFAULT_CENTER,
      bounds: undefined,
      showSearchArea: false,
      searchingArea: false,
      selectedTempleId: null,
      selectedTemples: {},
      manuallyAddedTemples: new Set<string>(),
      city: 'Varanasi',
      days: 3,

      // Actions
      setAllTemples: (temples) => 
        set((state) => ({
          allTemples: temples,
          filteredTemples: state.selectedTempleId 
            ? temples.filter(t => t.id === state.selectedTempleId)
            : state.bounds 
              ? temples.filter(t => {
                  const templeLatLng = new google.maps.LatLng(t.location.lat, t.location.lng)
                  return state.bounds?.contains(templeLatLng)
                })
              : temples
        }), false, 'setAllTemples'),

      addManualTemple: (temple) =>
        set((state) => {
          const newManuallyAdded = new Set(state.manuallyAddedTemples)
          newManuallyAdded.add(temple.id)
          
          return {
            allTemples: [...state.allTemples, temple],
            manuallyAddedTemples: newManuallyAdded,
            filteredTemples: state.selectedTempleId 
              ? [...state.allTemples, temple].filter(t => t.id === state.selectedTempleId)
              : state.bounds 
                ? [...state.allTemples, temple].filter(t => {
                    const templeLatLng = new google.maps.LatLng(t.location.lat, t.location.lng)
                    return state.bounds?.contains(templeLatLng)
                  })
                : [...state.allTemples, temple]
          }
        }, false, 'addManualTemple'),

      setLoading: (loading) => set({ loading }, false, 'setLoading'),
      
      setError: (error) => set({ error }, false, 'setError'),
      
      setCenter: (center) => set({ center }, false, 'setCenter'),
      
      setMapCenter: (mapCenter) => set({ mapCenter }, false, 'setMapCenter'),
      
      setBounds: (bounds) => 
        set((state) => ({
          bounds,
          filteredTemples: state.selectedTempleId 
            ? state.allTemples.filter(t => t.id === state.selectedTempleId)
            : bounds 
              ? state.allTemples.filter(t => {
                  const templeLatLng = new google.maps.LatLng(t.location.lat, t.location.lng)
                  return bounds.contains(templeLatLng)
                })
              : state.allTemples
        }), false, 'setBounds'),
      
      setShowSearchArea: (showSearchArea) => set({ showSearchArea }, false, 'setShowSearchArea'),
      
      setSearchingArea: (searchingArea) => set({ searchingArea }, false, 'setSearchingArea'),
      
      setSelectedTempleId: (selectedTempleId) => 
        set((state) => ({
          selectedTempleId,
          filteredTemples: selectedTempleId 
            ? state.allTemples.filter(t => t.id === selectedTempleId)
            : state.bounds 
              ? state.allTemples.filter(t => {
                  const templeLatLng = new google.maps.LatLng(t.location.lat, t.location.lng)
                  return state.bounds?.contains(templeLatLng)
                })
              : state.allTemples
        }), false, 'setSelectedTempleId'),
      
      toggleTempleSelection: (id) => 
        set((state) => ({
          selectedTemples: {
            ...state.selectedTemples,
            [id]: !state.selectedTemples[id]
          }
        }), false, 'toggleTempleSelection'),
      
      setCity: (city) => set({ city }, false, 'setCity'),
      
      setDays: (days) => set({ days }, false, 'setDays'),
      
      clearSelection: () => set({ selectedTemples: {} }, false, 'clearSelection'),
      
      reset: () => set({
        allTemples: [],
        filteredTemples: [],
        loading: true,
        error: null,
        selectedTempleId: null,
        selectedTemples: {},
        manuallyAddedTemples: new Set<string>(),
        showSearchArea: false,
        searchingArea: false,
      }, false, 'reset'),
    }),
    {
      name: 'discover-store',
    }
  )
)