import jsPDF from 'jspdf'
import { ItineraryPlan, Temple } from '@/types/temple'

interface PDFExportOptions {
  includeMap?: boolean
  includeDetails?: boolean
  theme?: 'light' | 'dark'
}

export class ItineraryPDFExporter {
  private doc: jsPDF
  private pageWidth: number
  private pageHeight: number
  private margin: number
  private currentY: number
  private theme: 'light' | 'dark'

  constructor(options: PDFExportOptions = {}) {
    this.doc = new jsPDF('p', 'mm', 'a4')
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
    this.margin = 20
    this.currentY = this.margin
    this.theme = options.theme || 'light'
  }

  private getColors() {
    return this.theme === 'dark' 
      ? {
          primary: '#f97316',
          text: '#f8fafc',
          muted: '#94a3b8',
          background: '#0f172a',
          card: '#1e293b',
          border: '#334155'
        }
      : {
          primary: '#f97316',
          text: '#0f172a',
          muted: '#64748b',
          background: '#ffffff',
          card: '#f8fafc',
          border: '#e2e8f0'
        }
  }

  private addNewPageIfNeeded(requiredHeight: number) {
    if (this.currentY + requiredHeight > this.pageHeight - this.margin) {
      this.doc.addPage()
      this.currentY = this.margin
      return true
    }
    return false
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  private formatDistance(meters: number): string {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`
    }
    return `${meters} m`
  }

  private addHeader(itinerary: ItineraryPlan) {
    const colors = this.getColors()
    
    // Background
    this.doc.setFillColor(colors.background)
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F')
    
    // Header background with gradient effect
    this.doc.setFillColor(colors.primary)
    this.doc.rect(0, 0, this.pageWidth, 45, 'F')
    
    // Add subtle pattern overlay
    this.doc.setFillColor('#ffffff')
    this.doc.setGState(this.doc.GState({ opacity: 0.1 }))
    for (let i = 0; i < this.pageWidth; i += 10) {
      this.doc.circle(i, 10, 2, 'F')
      this.doc.circle(i + 5, 25, 1.5, 'F')
    }
    this.doc.setGState(this.doc.GState({ opacity: 1 }))
    
    // Title
    this.doc.setTextColor('#ffffff')
    this.doc.setFontSize(26)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(`${itinerary.totalDays}-Day Temple Journey`, this.margin, 22)
    
    // Subtitle
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`Exploring ${itinerary.city}'s Sacred Temples`, this.margin, 32)
    
    // Date and branding
    this.doc.setFontSize(10)
    this.doc.text(`Generated ${new Date().toLocaleDateString()}`, this.pageWidth - this.margin - 50, 38)
    
    // Add decorative line
    this.doc.setDrawColor('#ffffff')
    this.doc.setLineWidth(0.5)
    this.doc.line(this.margin, 42, this.pageWidth - this.margin, 42)
    
    this.currentY = 55
  }

  private addSummaryStats(itinerary: ItineraryPlan) {
    const colors = this.getColors()
    this.addNewPageIfNeeded(80)
    
    // Summary card background with rounded corners effect
    this.doc.setFillColor(colors.card)
    this.doc.setDrawColor(colors.border)
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 70, 3, 3, 'FD')
    
    this.doc.setTextColor(colors.text)
    this.doc.setFontSize(18)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Journey Overview', this.margin + 8, this.currentY + 15)
    
    // Stats in grid with icons
    const stats = [
      { label: 'Days', value: itinerary.totalDays.toString(), icon: '📅' },
      { label: 'Temples', value: itinerary.totalTemples.toString(), icon: '🏛️' },
      { label: 'Distance', value: this.formatDistance(itinerary.totalDistance), icon: '🗺️' },
      { label: 'Travel Time', value: this.formatDuration(itinerary.totalDuration), icon: '⏱️' }
    ]
    
    const statWidth = (this.pageWidth - 2 * this.margin - 16) / 4
    stats.forEach((stat, index) => {
      const x = this.margin + 8 + (index * statWidth)
      
      // Icon background circle
      this.doc.setFillColor(colors.primary)
      this.doc.setGState(this.doc.GState({ opacity: 0.1 }))
      this.doc.circle(x + 15, this.currentY + 35, 12, 'F')
      this.doc.setGState(this.doc.GState({ opacity: 1 }))
      
      // Stat value
      this.doc.setFont('helvetica', 'bold')
      this.doc.setFontSize(16)
      this.doc.setTextColor(colors.primary)
      this.doc.text(stat.value, x, this.currentY + 40)
      
      // Stat label
      this.doc.setFont('helvetica', 'normal')
      this.doc.setFontSize(10)
      this.doc.setTextColor(colors.muted)
      this.doc.text(stat.label, x, this.currentY + 50)
    })
    
    // Add highlights section
    this.currentY += 80
    this.addNewPageIfNeeded(40)
    
    // Calculate highlights
    const avgRating = itinerary.days
      .flatMap(day => day.temples)
      .filter(temple => temple.rating)
      .reduce((sum, temple, _, arr) => sum + (temple.rating || 0) / arr.length, 0)
    
    const totalReviews = itinerary.days
      .flatMap(day => day.temples)
      .reduce((sum, temple) => sum + (temple.user_ratings_total || 0), 0)
    
    if (avgRating > 0) {
      this.doc.setFillColor(colors.card)
      this.doc.setDrawColor(colors.border)
      this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 25, 3, 3, 'FD')
      
      this.doc.setTextColor(colors.text)
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('Journey Highlights', this.margin + 8, this.currentY + 10)
      
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setTextColor(colors.muted)
      this.doc.text(
        `★ ${avgRating.toFixed(1)} average rating • ${totalReviews.toLocaleString()} total reviews`,
        this.margin + 8,
        this.currentY + 18
      )
      
      this.currentY += 35
    }
  }

  private addTravelTips() {
    const colors = this.getColors()
    this.addNewPageIfNeeded(80)
    
    this.doc.setTextColor(colors.text)
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Essential Travel Tips', this.margin, this.currentY)
    this.currentY += 10
    
    const tips = [
      'Start early to avoid crowds and heat',
      'Carry water and wear comfortable walking shoes',
      'Respect temple dress codes and photography rules',
      'Consider hiring a local guide for cultural insights',
      'Allow extra time for traffic and parking',
      'Check temple opening hours before visiting'
    ]
    
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(colors.muted)
    
    tips.forEach(tip => {
      this.addNewPageIfNeeded(8)
      this.doc.text(`• ${tip}`, this.margin + 5, this.currentY)
      this.currentY += 6
    })
    
    this.currentY += 10
  }

  private addDayDetails(itinerary: ItineraryPlan) {
    const colors = this.getColors()
    
    itinerary.days.forEach((day, dayIndex) => {
      this.addNewPageIfNeeded(100)
      
      // Day header
      this.doc.setFillColor(colors.primary)
      this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 15, 'F')
      
      this.doc.setTextColor('#ffffff')
      this.doc.setFontSize(14)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(`Day ${day.day} - ${day.temples.length} Temples`, this.margin + 5, this.currentY + 10)
      
      // Day stats
      this.doc.setFontSize(10)
      this.doc.text(
        `${day.startTime} - ${day.endTime} • ${this.formatDistance(day.totalDistance)} • ${this.formatDuration(day.totalDuration)}`,
        this.pageWidth - this.margin - 80,
        this.currentY + 10
      )
      
      this.currentY += 20
      
      // Temples for this day
      day.temples.forEach((temple, templeIndex) => {
        this.addNewPageIfNeeded(35)
        
        // Temple card
        this.doc.setFillColor(colors.card)
        this.doc.setDrawColor(colors.border)
        this.doc.rect(this.margin + 5, this.currentY, this.pageWidth - 2 * this.margin - 10, 30, 'FD')
        
        // Temple number circle
        this.doc.setFillColor(colors.primary)
        this.doc.circle(this.margin + 15, this.currentY + 10, 5, 'F')
        this.doc.setTextColor('#ffffff')
        this.doc.setFontSize(10)
        this.doc.setFont('helvetica', 'bold')
        this.doc.text((templeIndex + 1).toString(), this.margin + 12, this.currentY + 12)
        
        // Temple name
        this.doc.setTextColor(colors.text)
        this.doc.setFontSize(12)
        this.doc.setFont('helvetica', 'bold')
        const templeName = temple.name.length > 40 ? temple.name.substring(0, 40) + '...' : temple.name
        this.doc.text(templeName, this.margin + 25, this.currentY + 10)
        
        // Temple details
        this.doc.setFontSize(9)
        this.doc.setFont('helvetica', 'normal')
        this.doc.setTextColor(colors.muted)
        
        const details = []
        if (temple.rating) details.push(`★ ${temple.rating}`)
        if (temple.user_ratings_total) details.push(`${temple.user_ratings_total} reviews`)
        if (temple.price_level) details.push(`Price: ${'$'.repeat(temple.price_level)}`)
        
        this.doc.text(details.join(' • '), this.margin + 25, this.currentY + 18)
        
        // Address
        if (temple.formatted_address) {
          const address = temple.formatted_address.length > 60 ? temple.formatted_address.substring(0, 60) + '...' : temple.formatted_address
          this.doc.text(address, this.margin + 25, this.currentY + 25)
        }
        
        this.currentY += 35
      })
      
      this.currentY += 10
    })
  }

  private addFooter() {
    const colors = this.getColors()
    const pageCount = this.doc.getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      
      // Footer line
      this.doc.setDrawColor(colors.border)
      this.doc.line(this.margin, this.pageHeight - 15, this.pageWidth - this.margin, this.pageHeight - 15)
      
      // Footer text
      this.doc.setTextColor(colors.muted)
      this.doc.setFontSize(8)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text('Generated by Temple Journey Planner', this.margin, this.pageHeight - 8)
      this.doc.text(`Page ${i} of ${pageCount}`, this.pageWidth - this.margin - 20, this.pageHeight - 8)
    }
  }

  public async exportItinerary(itinerary: ItineraryPlan, options: PDFExportOptions = {}): Promise<void> {
    try {
      // Add header
      this.addHeader(itinerary)
      
      // Add summary statistics
      this.addSummaryStats(itinerary)
      
      // Add travel tips
      this.addTravelTips()
      
      // Add detailed day-by-day itinerary
      this.addDayDetails(itinerary)
      
      // Add footer to all pages
      this.addFooter()
      
      // Generate filename
      const filename = `${itinerary.city}-${itinerary.totalDays}day-temple-journey-${new Date().toISOString().split('T')[0]}.pdf`
      
      // Save the PDF
      this.doc.save(filename)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw new Error('Failed to generate PDF export')
    }
  }
}

export const exportItineraryToPDF = async (
  itinerary: ItineraryPlan, 
  options: PDFExportOptions = {}
): Promise<void> => {
  const exporter = new ItineraryPDFExporter(options)
  await exporter.exportItinerary(itinerary, options)
}