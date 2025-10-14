"use client"

import Link from "next/link"
import ThemeToggle from "./theme-toggle"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState } from "react"

const links = [
  { href: "/", label: "Home" },
  { href: "/discover", label: "Discover" },
  { href: "/itinerary", label: "Itinerary" },
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  
  return (
    <header className="sticky top-0 z-40 safe-top">
      <div className={cn("navbar-glass supports-[backdrop-filter]:backdrop-blur")}>
        <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between safe-left safe-right">
          <Link 
            href="/" 
            className="font-serif text-lg sm:text-xl tracking-tight touch-manipulation"
            onClick={() => setOpen(false)}
          >
            TempleTrail
          </Link>
          
          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center gap-3">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation min-h-[44px] flex items-center",
                    pathname === l.href 
                      ? "bg-accent text-accent-foreground shadow-sm" 
                      : "hover:bg-muted hover:scale-105"
                  )}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          
          <div className="flex items-center gap-2">
            {/* Mobile Menu Button */}
            <button
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted touch-manipulation transition-colors"
              aria-label="Toggle menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                className={cn("transition-transform duration-200", open && "rotate-90")} 
                aria-hidden
              >
                {open ? (
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                )}
              </svg>
            </button>
            <ThemeToggle />
          </div>
        </nav>
        
        {/* Mobile Menu */}
        {open && (
          <div className="md:hidden px-4 pb-4 pt-2 border-t border-border/50">
            <ul className="flex flex-col gap-1">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block w-full rounded-lg px-4 py-3 text-sm font-medium transition-colors touch-manipulation min-h-[44px] flex items-center",
                      pathname === l.href 
                        ? "bg-accent text-accent-foreground" 
                        : "hover:bg-muted"
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </header>
  )
}
