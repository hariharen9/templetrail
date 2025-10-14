'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Download, FileText, Printer, Loader2 } from 'lucide-react'
import { ItineraryPlan } from '@/types/temple'
import { exportItineraryToPDF } from '@/services/pdf-export'
import { useToast } from '@/hooks/use-toast'
import { useTheme } from 'next-themes'

interface ExportOptionsDialogProps {
  itinerary: ItineraryPlan
  children: React.ReactNode
}

export default function ExportOptionsDialog({ itinerary, children }: ExportOptionsDialogProps) {
  const { toast } = useToast()
  const { theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<'pdf' | 'print'>('pdf')
  const [includeMap, setIncludeMap] = useState(true)
  const [includeDetails, setIncludeDetails] = useState(true)
  const [includePhotos, setIncludePhotos] = useState(false)
  const [colorTheme, setColorTheme] = useState<'auto' | 'light' | 'dark'>('auto')

  const handleExport = async () => {
    setIsExporting(true)
    try {
      if (exportFormat === 'print') {
        // Open print-friendly page
        const printWindow = window.open('/print-itinerary', '_blank')
        if (printWindow) {
          // Pass itinerary data to print window
          printWindow.addEventListener('load', () => {
            printWindow.postMessage({ itinerary }, '*')
          })
        }
        setIsOpen(false)
        return
      }

      toast({
        title: "Generating PDF",
        description: "Creating your detailed itinerary document...",
      })

      const selectedTheme = colorTheme === 'auto' 
        ? (theme === 'dark' ? 'dark' : 'light')
        : colorTheme

      await exportItineraryToPDF(itinerary, {
        includeMap,
        includeDetails,
        theme: selectedTheme
      })

      toast({
        title: "PDF Downloaded",
        description: "Your itinerary has been saved to your downloads folder.",
      })
      
      setIsOpen(false)
    } catch (error) {
      console.error('Export failed:', error)
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Unable to generate export. Please try again.",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Itinerary
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Export Format */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Export Format</Label>
            <RadioGroup value={exportFormat} onValueChange={(value: 'pdf' | 'print') => setExportFormat(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  PDF Document
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="print" id="print" />
                <Label htmlFor="print" className="flex items-center gap-2 cursor-pointer">
                  <Printer className="h-4 w-4" />
                  Print-Friendly Page
                </Label>
              </div>
            </RadioGroup>
          </div>

          {exportFormat === 'pdf' && (
            <>
              {/* Theme Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Color Theme</Label>
                <RadioGroup value={colorTheme} onValueChange={(value: 'auto' | 'light' | 'dark') => setColorTheme(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auto" id="auto" />
                    <Label htmlFor="auto" className="cursor-pointer">Auto (Match App Theme)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light" className="cursor-pointer">Light Theme</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark" className="cursor-pointer">Dark Theme</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Content Options */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold">Include in PDF</Label>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-details" className="text-sm cursor-pointer">
                    Detailed temple information
                  </Label>
                  <Switch
                    id="include-details"
                    checked={includeDetails}
                    onCheckedChange={setIncludeDetails}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-map" className="text-sm cursor-pointer">
                    Route overview maps
                  </Label>
                  <Switch
                    id="include-map"
                    checked={includeMap}
                    onCheckedChange={setIncludeMap}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-photos" className="text-sm cursor-pointer">
                    Temple photos (coming soon)
                  </Label>
                  <Switch
                    id="include-photos"
                    checked={includePhotos}
                    onCheckedChange={setIncludePhotos}
                    disabled
                  />
                </div>
              </div>
            </>
          )}

          {/* Export Info */}
          <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
            {exportFormat === 'pdf' ? (
              <p>
                PDF will include your complete {itinerary.totalDays}-day itinerary with 
                {includeDetails ? ' detailed temple information,' : ''} 
                {includeMap ? ' route maps,' : ''} and travel tips.
              </p>
            ) : (
              <p>
                Opens a print-friendly page that you can save as PDF using your browser's print function.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {exportFormat === 'pdf' ? 'Generating...' : 'Opening...'}
                </>
              ) : (
                <>
                  {exportFormat === 'pdf' ? (
                    <FileText className="h-4 w-4 mr-2" />
                  ) : (
                    <Printer className="h-4 w-4 mr-2" />
                  )}
                  {exportFormat === 'pdf' ? 'Download PDF' : 'Open Print View'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}