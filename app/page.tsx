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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="glass border rounded-2xl p-6 sm:p-8 lg:p-10 text-center"
        >
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight text-balance hero-title text-primary leading-tight mobile-tight">
            Find Your Path.
          </h1>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground hero-copy max-w-2xl mx-auto leading-relaxed">
            Plan serene multi-day temple journeys across India.
          </p>

          <div className="mt-6 sm:mt-8">
            <LocationSearch />
          </div>

        </motion.div>
      </div>
    </section>
  );
}
