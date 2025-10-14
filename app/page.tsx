"use client"

import { LocationSearch } from "@/components/location-search";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { MapPin, Route, Calendar, Star, Sparkles, Zap, Heart, Globe, Users, Shield, Clock, Navigation } from "lucide-react";
import { InteractiveGlobe } from "@/components/interactive-globe";
import { TestimonialCarousel } from "@/components/testimonial-carousel";
import { ScrollProgress } from "@/components/scroll-progress";
import { FloatingSearchButton } from "@/components/floating-search-button";

// Floating particles component
function FloatingParticles() {
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
      
      const handleResize = () => {
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary/20 rounded-full"
          initial={{
            x: Math.random() * dimensions.width,
            y: Math.random() * dimensions.height,
          }}
          animate={{
            x: Math.random() * dimensions.width,
            y: Math.random() * dimensions.height,
          }}
          transition={{
            duration: Math.random() * 20 + 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  )
}



// Feature card component
function FeatureCard({ icon: Icon, title, description, delay = 0 }: {
  icon: any;
  title: string;
  description: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.2, 0.8, 0.2, 1] }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative p-6 sm:p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 cursor-pointer"
    >
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      <div className="relative">
        <motion.div 
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4"
          animate={{ 
            scale: isHovered ? 1.1 : 1,
            rotate: isHovered ? 5 : 0 
          }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            animate={{ rotate: isHovered ? 360 : 0 }}
            transition={{ duration: 0.6 }}
          >
            <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          </motion.div>
        </motion.div>
        <motion.h3 
          className="font-serif text-xl sm:text-2xl font-bold mb-3"
          animate={{ color: isHovered ? "var(--primary)" : "var(--foreground)" }}
          transition={{ duration: 0.3 }}
        >
          {title}
        </motion.h3>
        <p className="text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div ref={containerRef} className="relative">
      <ScrollProgress />
      <FloatingSearchButton />
      {/* Hero Section */}
      <motion.section 
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative min-h-[calc(100dvh-64px)] flex items-center safe-top safe-bottom overflow-hidden"
      >
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

        <FloatingParticles />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 w-full safe-left safe-right">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
            className="glass border rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 xl:p-12 text-center relative overflow-hidden"
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
      </motion.section>



      {/* Features Section */}
      <section className="relative py-16 sm:py-24 lg:py-32 bg-gradient-to-br from-accent/5 via-background to-primary/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Your Spiritual Journey, Perfected
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Advanced AI planning meets ancient wisdom to create your perfect temple pilgrimage
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={MapPin}
              title="South Indian Temples"
              description="Discover ancient Dravidian temples, from Chola masterpieces to Kerala's unique architecture."
              delay={0}
            />
            <FeatureCard
              icon={Route}
              title="Optimized Routes"
              description="Smart routing between temples considering South Indian road conditions and distances."
              delay={0.1}
            />
            <FeatureCard
              icon={Calendar}
              title="Festival Calendar"
              description="Plan around major South Indian festivals like Brahmotsavam, Navaratri, and regional celebrations."
              delay={0.2}
            />
            <FeatureCard
              icon={Heart}
              title="Local Stays"
              description="Find dharmashalas, heritage hotels, and local accommodations near temple towns."
              delay={0.3}
            />
            <FeatureCard
              icon={Globe}
              title="Offline Maps"
              description="Download temple details and routes for areas with limited connectivity in rural regions."
              delay={0.4}
            />
            <FeatureCard
              icon={Shield}
              title="Cultural Context"
              description="Learn about temple history, architectural styles, and local customs before your visit."
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-16 sm:py-24 lg:py-32 bg-gradient-to-br from-background to-accent/10 overflow-hidden">
        <div className="absolute inset-0 bg-dot-pattern opacity-10" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Three Steps to Enlightenment
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              From discovery to journey completion in just a few clicks
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: "01",
                title: "Discover",
                description: "Explore South India's temple heritage from Meenakshi Amman to Padmanabhaswamy, with rich historical context.",
                icon: Sparkles
              },
              {
                step: "02", 
                title: "Plan",
                description: "AI creates culturally-aware itineraries considering temple timings, local festivals, and regional travel patterns.",
                icon: Zap
              },
              {
                step: "03",
                title: "Journey",
                description: "Navigate with confidence using offline maps, local customs guide, and temple-specific information.",
                icon: Navigation
              }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="relative group"
              >
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-300">
                      {item.step}
                    </div>
                    <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 -z-10 group-hover:scale-125 transition-transform duration-300" />
                  </div>
                  
                  <div className="mb-4">
                    <item.icon className="w-8 h-8 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold mb-4 group-hover:text-primary transition-colors duration-300">
                      {item.title}
                    </h3>
                  </div>
                  
                  <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                    {item.description}
                  </p>
                </div>

                {/* Connecting line for desktop */}
                {index < 2 && (
                  <div className="hidden lg:block absolute top-12 left-full w-12 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-16 sm:py-24 lg:py-32 bg-gradient-to-br from-accent/5 to-background overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Early Feedback from Beta Users
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Hear from our early adopters exploring South India's sacred temples
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <TestimonialCarousel />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center lg:text-left"
            >
              <InteractiveGlobe />
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-center lg:justify-start gap-4">
                  <div className="text-2xl font-bold text-primary">4.6/5</div>
                  <div className="flex gap-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    ))}
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 opacity-60" />
                  </div>
                </div>
                <p className="text-muted-foreground">
                  Early feedback from beta testers
                </p>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center lg:text-left">
                    <div className="text-xl font-bold text-primary">4</div>
                    <div className="text-sm text-muted-foreground">South Indian States</div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="text-xl font-bold text-primary">500+</div>
                    <div className="text-sm text-muted-foreground">Temples Mapped</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 sm:py-24 lg:py-32 mb-0 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 overflow-hidden">
        <div className="absolute inset-0 bg-temple-pattern opacity-5" />
        <FloatingParticles />
        
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="glass border rounded-3xl p-8 sm:p-12 lg:p-16"
          >
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-primary">
              Begin Your Sacred Journey Today
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Be among the first to experience AI-powered temple journey planning designed specifically for South India's rich spiritual heritage.
            </p>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block"
            >
              <LocationSearch />
            </motion.div>

            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Beta Access</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span>4.6/5 Early Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>2 Min Setup</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
