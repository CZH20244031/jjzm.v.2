'use client'

import { useState, useEffect, useRef } from 'react'
import type { Variants } from 'framer-motion'

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
}

interface CountUpOptions {
  duration?: number
  delay?: number
  enabled?: boolean
}

export function useCountUp(
  end: number,
  optionsOrDuration: CountUpOptions | number = 1500,
  legacyDecimals: number = 0
) {
  // Support both legacy signature (end, duration, decimals) and new signature (end, options)
  const opts: Required<CountUpOptions> & { decimals: number } =
    typeof optionsOrDuration === 'number'
      ? { duration: optionsOrDuration, delay: 0, enabled: true, decimals: legacyDecimals }
      : { duration: 1500, delay: 0, enabled: true, decimals: 0, ...optionsOrDuration }

  const { duration, delay, enabled, decimals } = opts

  const [count, setCount] = useState(0)
  const countRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    // Clean up previous animation
    if (delayTimerRef.current) clearTimeout(delayTimerRef.current)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    startTimeRef.current = null
    countRef.current = 0

    if (!enabled || duration <= 0 || isNaN(end) || !isFinite(end)) {
      const safeEnd = isNaN(end) || !isFinite(end) ? 0 : Number(end) || 0
      // Use rAF to avoid synchronous setState in effect (lint rule)
      rafRef.current = requestAnimationFrame(() => {
        setCount(Number(safeEnd.toFixed(decimals)))
      })
      return
    }

    const safeEnd = Number(end) || 0
    const safeDuration = Number(duration) || 1500

    const startAnimation = () => {
      const animate = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp
        const progress = Math.min((timestamp - startTimeRef.current) / safeDuration, 1)
        const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
        countRef.current = eased * safeEnd
        setCount(Number(countRef.current.toFixed(decimals)))
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate)
        }
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    if (delay && delay > 0) {
      delayTimerRef.current = setTimeout(startAnimation, delay * 1000)
    } else {
      startAnimation()
    }

    return () => {
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [end, duration, delay, enabled, decimals])

  return count
}
