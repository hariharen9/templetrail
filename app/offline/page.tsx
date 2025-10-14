"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WifiOff, RefreshCw, Home } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function OfflinePage() {
  const router = useRouter()

  const handleRetry = () => {
    if (navigator.onLine) {
      router.back()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 safe-top safe-bottom safe-left safe-right">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <WifiOff className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl font-serif">You're Offline</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            It looks like you've lost your internet connection. Don't worry - you can still browse previously visited temples and itineraries.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={handleRetry} 
              className="w-full touch-manipulation"
              variant="default"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <Button 
              asChild 
              variant="outline" 
              className="w-full touch-manipulation"
            >
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Link>
            </Button>
          </div>
          
          <div className="pt-4 border-t">
            <h3 className="font-semibold text-sm mb-2">Available Offline:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Previously viewed temples</li>
              <li>• Saved itineraries</li>
              <li>• Basic app navigation</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}