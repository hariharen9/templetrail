'use client'

import { useEffect } from 'react'

export default function ChunkErrorHandler() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = event.error
      
      // Check if it's a chunk loading error
      if (
        error?.name === 'ChunkLoadError' ||
        error?.message?.includes('Loading chunk') ||
        error?.message?.includes('Loading CSS chunk')
      ) {
        console.warn('Chunk loading error detected, reloading page...')
        
        // Add a small delay to avoid infinite reload loops
        setTimeout(() => {
          window.location.reload()
        }, 100)
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason
      
      // Check if it's a chunk loading error in a promise
      if (
        error?.name === 'ChunkLoadError' ||
        error?.message?.includes('Loading chunk') ||
        error?.message?.includes('Loading CSS chunk')
      ) {
        console.warn('Chunk loading error in promise, reloading page...')
        event.preventDefault()
        
        setTimeout(() => {
          window.location.reload()
        }, 100)
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return null
}