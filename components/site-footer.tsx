'use client'

import { motion } from "framer-motion"
import { Heart } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="relative py-6 sm:py-8 bg-gradient-to-r from-background via-accent/5 to-background border-t border-border/50 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
            <span className="flex items-center gap-1 sm:gap-2">
              Built with{" "}
              <motion.span
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 fill-red-500" />
              </motion.span>
              by
            </span>
            <motion.a
              href="https://hariharen9.site"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:text-accent transition-colors duration-300 relative touch-manipulation"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Hariharen
              <motion.span
                className="absolute -bottom-0.5 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-accent origin-left"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.a>
          </p>
          
          {/* Subtle decorative elements */}
          <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 opacity-30">
            <div className="w-1 h-1 bg-primary rounded-full" />
            <div className="w-2 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full" />
            <div className="w-1 h-1 bg-accent rounded-full" />
          </div>
        </motion.div>
      </div>
      
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-accent/20 rounded-full blur-2xl" />
      </div>
    </footer>
  )
}