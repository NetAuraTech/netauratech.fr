import { useRef, useState, useEffect, useCallback, CSSProperties } from 'react'

type Viewport = 'mobile' | 'tablet' | 'desktop' | 'full'

const VIEWPORTS: Record<Viewport, { width: string; label: string; icon: string }> = {
  mobile: { width: '375px', label: 'Mobile', icon: '📱' },
  tablet: { width: '768px', label: 'Tablet', icon: '⬜' },
  desktop: { width: '1280px', label: 'Desktop', icon: '🖥' },
  full: { width: '100%', label: 'Full', icon: '⤢' },
}

interface PreviewIframeProps {
  pageId: number
  locale: string
  translationId: number
}

/**
 * Iframe-based live preview panel for the CMS page builder.
 *
 * Fetches a short-lived HMAC token from the server and embeds the
 * `/admin/pages/preview/:pageId?locale=:locale&token=:token` URL in an iframe.
 *
 * The token has a 5-minute TTL. When it expires (detectable by the iframe
 * returning a 401), the component automatically refreshes it.
 *
 * Toolbar:
 * - Viewport presets (Mobile / Tablet / Desktop / Full)
 * - Refresh button
 * - Open-in-new-tab link
 */
export default function PreviewIframe({ pageId, locale, translationId }: PreviewIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [token, setToken] = useState<string | null>(null)
  const [viewport, setViewport] = useState<Viewport>('full')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // ─── Token management ─────────────────────────────────────────────────────

  const fetchToken = useCallback(async () => {
    setError(false)
    try {
      const res = await fetch(
        `/api/admin/page/preview/token?pageId=${pageId}&locale=${locale}&translationId=${translationId}`,
        {
          headers: { Accept: 'application/json' },
        }
      )
      const data = await res.json()
      setToken(data.token)
    } catch {
      setError(true)
    }
  }, [pageId, locale])

  useEffect(() => {
    fetchToken()
    // Refresh token 30s before TTL expires (every 4.5 min)
    const interval = setInterval(fetchToken, 4.5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchToken])

  // ─── Iframe load handlers ─────────────────────────────────────────────────

  function handleLoad() {
    setLoading(false)
    // Check if the iframe returned a 401 (token expired)
    try {
      const iframeDoc = iframeRef.current?.contentDocument
      if (iframeDoc && iframeDoc.title === '401') {
        fetchToken()
      }
    } catch {
      // Cross-origin — can't inspect document, ignore
    }
  }

  function handleRefresh() {
    setLoading(true)
    fetchToken()
  }

  const src = token
    ? `/admin/pages/preview/${pageId}?locale=${locale}&translationId=${translationId}&token=${token}`
    : null

  const vpConfig = VIEWPORTS[viewport]
  const iframeStyle: CSSProperties = {
    width: vpConfig.width,
    maxWidth: '100%',
    height: '100%',
    border: 'none',
    transition: 'width 0.2s ease',
  }

  return (
    <div className="flex flex-col h-full bg-sunken">
      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-edge bg-canvas shrink-0">
        {/* Viewport presets */}
        <div className="flex items-center gap-0.5 border border-edge rounded-lg overflow-hidden">
          {(Object.entries(VIEWPORTS) as [Viewport, (typeof VIEWPORTS)[Viewport]][]).map(
            ([key, vp]) => (
              <button
                key={key}
                type="button"
                onClick={() => setViewport(key)}
                title={vp.label}
                className={`px-2 py-1 text-xs transition-colors ${
                  viewport === key
                    ? 'bg-primary-soft text-primary-deep'
                    : 'text-ink-muted hover:bg-sunken'
                }`}
              >
                {vp.icon}
              </button>
            )
          )}
        </div>

        {/* URL bar (decorative + locale indicator) */}
        <div className="flex-1 mx-2 px-2 py-1 rounded-lg bg-sunken border border-edge text-xs text-ink-muted truncate">
          <span className="text-ink-subtle mr-1 font-mono">[{locale.toUpperCase()}]</span>
          /preview/page-{pageId}
        </div>

        {/* Refresh */}
        <button
          type="button"
          onClick={handleRefresh}
          title="Refresh preview"
          className="p-1.5 rounded-lg text-ink-muted hover:bg-sunken transition-colors"
        >
          <svg
            className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>

        {/* Open in new tab */}
        {src && (
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            title="Open preview in new tab"
            className="p-1.5 rounded-lg text-ink-muted hover:bg-sunken transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        )}
      </div>

      {/* ── Preview area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex justify-center overflow-hidden relative">
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-canvas">
            <p className="text-sm text-ink-muted">Failed to load preview</p>
            <button
              type="button"
              onClick={handleRefresh}
              className="text-xs text-primary-mid hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {!error && !src && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-primary-mid border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {src && (
          <>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-canvas/80 z-10">
                <div className="w-5 h-5 border-2 border-primary-mid border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={src}
              style={iframeStyle}
              onLoad={handleLoad}
              title="Page preview"
              sandbox="allow-same-origin allow-scripts allow-forms"
            />
          </>
        )}
      </div>
    </div>
  )
}
