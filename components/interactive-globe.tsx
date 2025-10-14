'use client'

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export function InteractiveGlobe() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto">
      {/* Globe base */}
      <motion.div
        className="w-full h-full rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30"
        animate={{
          rotateY: mousePosition.x * 10,
          rotateX: mousePosition.y * 10,
        }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        {/* Temple markers */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary rounded-full"
            style={{
              top: `${20 + Math.sin(i * 0.8) * 30}%`,
              left: `${20 + Math.cos(i * 0.8) * 30}%`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2,
              delay: i * 0.2,
              repeat: Infinity,
            }}
          />
        ))}
        
        {/* Orbital rings */}
        <motion.div
          className="absolute inset-0 rounded-full border border-primary/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border border-accent/20"
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>
    </div>
  )
}