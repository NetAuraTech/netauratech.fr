import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

/**
 * Ambient WebGL field for the studio hero: a sparse drift of violet motes
 * over the near-black opening. It is atmosphere, not content — text sits
 * above it, pointer-events pass through, and it renders a single static
 * frame under `prefers-reduced-motion`. WebGL-unavailable builds simply
 * leave the hero black; nothing depends on it.
 */
export function AmbientField({ className = '' }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [ok, setOk] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let renderer: THREE.WebGLRenderer | null = null
    let raf = 0
    let disposed = false

    const cleanup = () => {
      disposed = true
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      if (renderer) renderer.dispose()
    }

    const resize = () => {
      if (!renderer || !host) return
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(host.clientWidth, host.clientHeight)
    }

    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      if (!gl) return () => undefined

      renderer = new THREE.WebGLRenderer({ canvas, antialias: !reduceMotion, alpha: true })
      renderer.setClearColor(0x000000, 0)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      host.appendChild(canvas)
      resize()
      setOk(true)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(
        55,
        host.clientWidth / Math.max(host.clientHeight, 1),
        0.1,
        40
      )
      camera.position.z = 6

      const geometry = new THREE.BufferGeometry()
      const count = reduceMotion ? 40 : 110
      const positions = new Float32Array(count * 3)
      const sizes = new Float32Array(count)
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 14
        positions[i * 3 + 1] = (Math.random() - 0.5) * 8
        positions[i * 3 + 2] = -Math.random() * 5 + 0.5
        sizes[i] = Math.random() * 0.5 + 0.15
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

      const material = new THREE.PointsMaterial({
        color: 0x8f7bff,
        size: 0.07,
        sizeAttenuation: true,
        transparent: true,
        opacity: reduceMotion ? 0.3 : 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const points = new THREE.Points(geometry, material)
      scene.add(points)

      const draw = (t: number) => {
        if (disposed) return
        points.rotation.y = t * 0.02
        points.position.y = Math.sin(t * 0.3) * 0.12
        renderer!.render(scene, camera)
      }

      if (reduceMotion) {
        draw(0)
      } else {
        const clock = new THREE.Clock()
        const loop = () => {
          raf = window.requestAnimationFrame(loop)
          draw(clock.getElapsedTime())
        }
        raf = window.requestAnimationFrame(loop)
      }

      window.addEventListener('resize', resize)
      return cleanup
    } catch (error) {
      if (ok) setOk(false)
      return cleanup
    }
  }, [])

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ opacity: ok ? 1 : 0 }}
    />
  )
}
