"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useMemo } from "react"

export default function PlannerFooter({
  selectedCount,
  days,
  setDays,
  onGenerate,
}: {
  selectedCount: number
  days: number
  setDays: (n: number) => void
  onGenerate: () => void
}) {
  const disabled = useMemo(() => selectedCount < 1 || days < 1, [selectedCount, days])
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 safe-bottom">
      <div className="mx-auto max-w-7xl px-4 pb-4 safe-left safe-right">
        <div className="glass border rounded-xl shadow-lg">
          {/* Mobile Layout */}
          <div className="block sm:hidden px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm">
                <span className="font-semibold text-lg">{selectedCount}</span>
                <span className="text-muted-foreground ml-1">temples</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium" htmlFor="days-mobile">
                  Days:
                </label>
                <Input
                  id="days-mobile"
                  type="number"
                  min={1}
                  max={14}
                  value={days}
                  onChange={(e) => setDays(Number.parseInt(e.target.value || "1", 10))}
                  className="w-16 h-10 text-center"
                />
              </div>
            </div>
            <Button 
              onClick={onGenerate} 
              disabled={disabled} 
              className="w-full font-medium h-12 touch-manipulation"
              size="lg"
            >
              Generate Itinerary
            </Button>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between px-6 py-4">
            <div className="text-sm">
              <span className="font-medium">{selectedCount}</span> temples selected
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium" htmlFor="days-desktop">
                Days
              </label>
              <Input
                id="days-desktop"
                type="number"
                min={1}
                max={14}
                value={days}
                onChange={(e) => setDays(Number.parseInt(e.target.value || "1", 10))}
                className="w-20 h-10"
              />
              <Button 
                onClick={onGenerate} 
                disabled={disabled} 
                className="font-medium touch-manipulation min-h-[44px]"
              >
                Generate Itinerary
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
