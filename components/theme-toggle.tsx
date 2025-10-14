"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Circle } from "lucide-react"
import type { JSX } from "react/jsx-runtime" // Import JSX to fix the lint error

type Theme = "light" | "dark" | "amoled"

const icons: Record<Theme, JSX.Element> = {
  light: <Sun className="h-4 w-4" />,
  dark: <Moon className="h-4 w-4" />,
  amoled: <Circle className="h-4 w-4" />,
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light")

  useEffect(() => {
    const stored = (localStorage.getItem("tt_theme") as Theme) || "light"
    applyTheme(stored)
  }, [])

  function applyTheme(next: Theme) {
    setTheme(next)
    const root = document.documentElement
    root.classList.remove("dark", "amoled")
    if (next === "dark") root.classList.add("dark")
    if (next === "amoled") root.classList.add("amoled")
    localStorage.setItem("tt_theme", next)
  }

  function cycle() {
    applyTheme(theme === "light" ? "dark" : theme === "dark" ? "amoled" : "light")
  }

  return (
    <Button
      variant="outline"
      onClick={cycle}
      className="gap-2 bg-transparent"
      aria-label="Toggle theme"
      title={`Theme: ${theme}`}
    >
      {icons[theme]}
      <span className="text-sm capitalize">{theme}</span>
    </Button>
  )
}
