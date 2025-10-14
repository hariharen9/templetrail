'use client'

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { Star, Quote } from "lucide-react"

const testimonials = [
  {
    name: "Meera Krishnan",
    location: "Chennai",
    rating: 5,
    text: "Finally found an app that understands South Indian temple culture! The Chola temple circuit in Thanjavur was perfectly planned.",
    avatar: "MK"
  },
  {
    name: "Arjun Reddy",
    location: "Bangalore", 
    rating: 4,
    text: "Great for discovering lesser-known temples around Mysore. The route optimization saved me so much driving time!",
    avatar: "AR"
  },
  {
    name: "Lakshmi Nair",
    location: "Kochi",
    rating: 5,
    text: "Love how it includes Kerala's unique temple traditions. The Guruvayur to Sabarimala route was incredibly helpful.",
    avatar: "LN"
  },
  {
    name: "Ravi Iyer",
    location: "Coimbatore",
    rating: 4,
    text: "As a beta tester, I'm impressed! The app helped me explore ancient temples in the Kongu region I never knew existed.",
    avatar: "RI"
  }
]

export function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="relative p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
            <Quote className="w-8 h-8 text-primary/30 mx-auto mb-4" />
            
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              "{testimonials[currentIndex].text}"
            </p>
            
            <div className="flex items-center justify-center gap-1 mb-4">
              {Array.from({ length: testimonials[currentIndex].rating }).map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              ))}
            </div>
            
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                {testimonials[currentIndex].avatar}
              </div>
              <div>
                <div className="font-semibold">{testimonials[currentIndex].name}</div>
                <div className="text-sm text-muted-foreground">{testimonials[currentIndex].location}</div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-primary w-6' : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    </div>
  )
}