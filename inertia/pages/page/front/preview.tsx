import { useEffect, useReducer } from 'react'
import { Head } from '@inertiajs/react'
import { applyOperation } from '~/utils/builder_reducer'
import type { ResolvedPageContent } from '#types/page'
import type { BroadcastPayload } from '#types/builder'
import PageRenderer from '~/components/molecules/renderer/page_renderer'
import { Data } from '@generated/data'
import { Transmit } from '@adonisjs/transmit-client'
import { v4 as uuid } from 'uuid'

interface PreviewPageProps {
  page: Data.PageTranslation
  editable: boolean
}

/**
 * Preview page rendered inside the builder iframe.
 *
 * When `editable = true`, it subscribes to the Transmit SSE channel for the
 * translation and applies incoming `BuilderOperation` events via the shared
 * `applyOperation` reducer. This makes the preview update in real-time as
 * any editor (including collaborators) modifies the content.
 *
 * The preview renders the full `PageRenderer` — the same renderer used for
 * the public-facing page — so what you see is exactly what will be published.
 */
export default function PreviewPage({ page, editable }: PreviewPageProps) {
  const [content, dispatch] = useReducer((state: ResolvedPageContent, action: BroadcastPayload) => {
    return applyOperation(state as any, action) as ResolvedPageContent
  }, page.resolved_content)

  useEffect(() => {
    if (!editable) return

    const client = new Transmit({ baseUrl: window.location.origin, uidGenerator: () => uuid() })
    const channel = `admin/pages/${page.pageId}/translations/${page.id}`
    const subscription = client.subscription(channel)

    subscription.create()

    subscription.onMessage<BroadcastPayload>((event) => {
      const ev = event as BroadcastPayload

      if (['UPDATE_PROPS', 'MOVE_BLOCK', 'ADD_BLOCK', 'DELETE_BLOCK'].includes(ev.op)) {
        dispatch(ev)
      }
    })

    return () => {
      subscription.delete()
    }
  }, [editable, page.pageId, page.id])

  return (
    <>
      <Head title={page.metaTitle ?? page.title}>
        {page.metaDescription && <meta name="description" content={page.metaDescription} />}
        {editable && <meta name="x-builder-preview" content="true" />}
      </Head>

      {editable && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'oklch(0.52 0.035 263)',
            color: 'white',
            fontSize: '11px',
            fontFamily: 'monospace',
            padding: '3px 8px',
            textAlign: 'center',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          PREVIEW — {page.locale.toUpperCase()} — Changes sync live
        </div>
      )}

      <div style={editable ? { paddingTop: '22px' } : undefined}>
        <PageRenderer content={content} pageId={page.id} locale={page.locale} />
      </div>
    </>
  )
}
