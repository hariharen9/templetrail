const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/maps\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-maps-cache',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    },
    {
      urlPattern: /^https:\/\/places\.googleapis\.com\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'google-places-cache',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 60 * 60 // 1 hour
        }
      }
    },
    {
      urlPattern: /^https:\/\/routes\.googleapis\.com\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'google-routes-cache',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60 // 1 hour
        }
      }
    }
  ]
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  images: {
    domains: ['maps.googleapis.com'],
    formats: ['image/webp', 'image/avif']
  },
  experimental: {
    optimizeCss: true
  }
}

module.exports = withPWA(nextConfig)