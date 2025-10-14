"use client"

import { LocationSearch } from "@/components/location-search";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <section className="relative min-h-[calc(100dvh-64px)] flex items-center safe-top safe-bottom">
      <div className="absolute inset-0 -z-10">
        <img
          src="/serene-abstract-temple-architecture-background.jpg"
          alt=""
          className="h-full w-full object-cover opacity-70"
          loading="eager"
          fetchPriority="high"
        />
        <div className="hero-overlay" />
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 w-full safe-left safe-right">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          className="glass border rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 xl:p-12 text-center"
        >
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl tracking-tight text-balance hero-title text-primary leading-tight mobile-tight"
          >
            Find Your Path.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            className="mt-3 sm:mt-4 lg:mt-6 text-base sm:text-lg lg:text-xl text-muted-foreground hero-copy max-w-2xl mx-auto leading-relaxed font-serif px-2 sm:px-0"
          >
            <span className="sm:hidden">Discover sacred temples and plan spiritual journeys across India.</span>
            <span className="hidden sm:inline">Discover sacred temples and plan meaningful spiritual journeys across India's ancient landscapes.</span>
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className="mt-6 sm:mt-8 lg:mt-12"
          >
            <LocationSearch />
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
