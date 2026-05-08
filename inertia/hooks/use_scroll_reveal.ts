import { useCallback, useEffect, useRef } from 'react'

export function useScrollReveal<T extends HTMLElement = HTMLElement>(threshold = 0.08) {
  const refs = useRef<T[]>([])

  const addRef = useCallback((el: T | null) => {
    if (el) {
      refs.current = [...new Set([...refs.current, el])]
    }
  }, [])

  useEffect(() => {
    const elements = refs.current

    if (!elements.length) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('in'), i * 80)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold }
    )

    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [threshold, refs])

  return addRef
}
