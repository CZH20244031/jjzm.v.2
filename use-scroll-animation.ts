'use client'

import { useEffect, useRef } from 'react'

export function useScrollAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)
  const animatedItemsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement
            const id = el.dataset.animateId
            if (id && !animatedItemsRef.current.has(id)) {
              animatedItemsRef.current.add(id)
              el.style.opacity = '1'
              el.style.transform = 'translateY(0)'
            }
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    const items = container.querySelectorAll('[data-animate]')
    items.forEach(item => {
      const el = item as HTMLElement
      const id = el.dataset.animateId
      if (id) {
        el.style.opacity = '0'
        el.style.transform = 'translateY(20px)'
        el.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out'
        observer.observe(el)
      }
    })

    return () => observer.disconnect()
  }, [])

  return containerRef
}
