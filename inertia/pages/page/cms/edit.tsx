import { useState, useCallback, useEffect, ReactElement } from 'react'
import { Button } from '~/components/atoms/button'
import { Input } from '~/components/atoms/input'
import { Field } from '~/components/molecules/field'
import { useBuilderSync } from '~/hooks/use_builder_sync'
import type { PageContent } from '#types/page'
import type { BuilderOperation } from '#types/builder'
import { urlFor } from '~/client'
import PresenceBar from '~/components/organisms/builder/PresenceBar'
import BlockTree from '~/components/organisms/builder/BlockTree'
import PreviewIframe from '~/components/organisms/builder/PreviewIframe'
import { Head } from '@inertiajs/react'
import { Icon } from '~/components/atoms/icon'
import { Separator } from '~/components/atoms/separator'
import { Heading } from '~/components/atoms/heading'
import { Data } from '@generated/data'
import { router, useForm } from '@inertiajs/react'
import { SharedProps } from '@adonisjs/inertia/types'

interface Props {
  page: Data.Page
  availableRoutes: {
    name: string | undefined
    pattern: string
    params: string[]
  }[]
  availablePages: {
    id: number
    label: string
    default_locale: string
    locales: {
      locale: string
      slug: string
    }[]
  }[]
  availablePostRoutes: {
    name: string | undefined
    pattern: string
    params: string[]
  }[]
}

type PanelMode = 'editor' | 'preview' | 'split'

const STATUS_LABELS = {
  draft: { label: 'Draft', dot: 'bg-edge-strong' },
  published: { label: 'Published', dot: 'bg-success' },
  archived: { label: 'Archived', dot: 'bg-warning' },
} as const

export default function PagesEditPage({ page }: Props) {
  const [activeLocale, setActiveLocale] = useState(page.defaultLocale)
  const [panelMode, setPanelMode] = useState<PanelMode>('split')
  const [saving, setSaving] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')

  const currentTranslation =
    page.translations.find((t) => t.locale === activeLocale) ?? page.translations[0]

  const [content, setContent] = useState<PageContent>(currentTranslation?.content ?? { blocks: [] })
  const [title, setTitle] = useState(currentTranslation?.title ?? '')
  const [slug, setSlug] = useState(currentTranslation?.slug ?? '')
  const [metaTitle, setMetaTitle] = useState(currentTranslation?.metaTitle ?? '')
  const [metaDescription, setMetaDescription] = useState(currentTranslation?.metaDescription ?? '')

  useEffect(() => {
    if (!currentTranslation?.id) return
    fetch(`/api/admin/builder/presence/${currentTranslation.id}`, {
      headers: { Accept: 'application/json' },
    })
      .then((r) => r.json())
      .then(({ draft }) => {
        if (draft) setContent(draft)
      })
      .catch(() => {})
  }, [currentTranslation?.id])

  const { presence, connected, currentUserId, emit, acquireLock, releaseLock, getLock, pushDraft } =
    useBuilderSync({
      pageId: page.id,
      translationId: currentTranslation?.id ?? 0,
      content,
      onContentChange: setContent,
    })

  function switchLocale(locale: string) {
    const t = page.translations.find((tr) => tr.locale === locale)
    if (!t) return
    setActiveLocale(locale)
    setContent(t.content)
    setTitle(t.title)
    setSlug(t.slug)
    setMetaTitle(t.metaTitle ?? '')
    setMetaDescription(t.metaDescription ?? '')
    setSaveState('idle')
  }

  function handleContentChange(next: PageContent) {
    setContent(next)
    pushDraft(next)
  }

  /**
   * Emit a granular op to the SSE channel.
   * Called from BlockTree whenever a structural change occurs.
   */
  async function handleBlockOp(op: BuilderOperation) {
    await emit(op)
  }

  const handleSave = useCallback(() => {
    if (saving) return
    setSaving(true)
    setSaveState('idle')

    router.post(
      urlFor('admin.pages_update.execute', { id: page.id }),
      {
        locale: activeLocale,
        title,
        slug,
        content: content as any,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setSaveState('saved')
          setTimeout(() => setSaveState('idle'), 2500)
        },
        onError: () => setSaveState('error'),
        onFinish: () => setSaving(false),
      }
    )
  }, [saving, activeLocale, title, slug, content, metaTitle, metaDescription, page.id])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleSave])
  function handlePublish() {
    router.post(
      urlFor('admin.pages_update.publish', { id: page.id }),
      {
        locale: activeLocale,
      },
      {
        preserveScroll: true,
      }
    )
  }
  function handleUnpublish() {
    router.post(
      urlFor('admin.pages_update.unpublish', { id: page.id }),
      {
        locale: activeLocale,
      },
      {
        preserveScroll: true,
      }
    )
  }

  const showEditor = panelMode === 'editor' || panelMode === 'split'
  const showPreview = panelMode === 'preview' || panelMode === 'split'

  return (
    <>
      <Head title={`Edit — ${currentTranslation?.title ?? 'Page'}`} />
      <div className="flex items-center justify-between h-18 gap-3 p-3">
        <div className="flex items-center gap-3">
          <Button variant="icon" fitContent>
            <Icon name="ArrowLeft" size={24} />
          </Button>
          <div className="w-px h-4 bg-edge" />
          <PresenceBar presence={presence} connected={connected} />
          <div className="w-px h-4 bg-edge" />
          <div className="flex items-center border border-edge rounded-lg overflow-hidden">
            {(['editor', 'split', 'preview'] as PanelMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPanelMode(mode)}
                className={`px-2.5 py-1.5 text-xs border-r border-edge last:border-0 transition-colors ${
                  panelMode === mode
                    ? 'bg-primary-soft text-ink-inverted'
                    : 'text-ink-muted hover:bg-sunken'
                }`}
                title={mode.charAt(0).toUpperCase() + mode.slice(1)}
              >
                {mode === 'editor' ? (
                  <Icon name="ListTree" size={18} />
                ) : mode === 'split' ? (
                  <Icon name="Columns2" size={18} />
                ) : (
                  <Icon name="ScanEye" size={18} />
                )}
              </button>
            ))}
          </div>
        </div>
        <SaveButton state={saveState} saving={saving} onClick={handleSave} />
      </div>
      <div className="flex h-[calc(100vh-4.5rem)] overflow-hidden">
        {showEditor && (
          <div
            className={`flex flex-col overflow-hidden border-r border-edge ${
              panelMode === 'split' ? 'w-auto' : 'flex-1'
            }`}
          >
            <div className="flex items-center gap-0 border-b border-edge bg-canvas px-4 shrink-0">
              {page.translations.map((t) => {
                const cfg = STATUS_LABELS[t.status]
                return (
                  <button
                    key={t.locale}
                    type="button"
                    onClick={() => switchLocale(t.locale)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                      t.locale === activeLocale
                        ? 'border-primary text-ink'
                        : 'border-transparent text-ink-muted hover:text-ink'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {t.locale.toUpperCase()}
                  </button>
                )
              })}
              <AddTranslationButton
                pageId={page.id}
                existingLocales={page.translations.map((t) => t.locale)}
              />
            </div>
            <div className="flex flex-1 overflow-hidden">
              <div className="w-80 shrink-0 border-r border-edge p-3 space-y-3 bg-canvas">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink">Status</span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        currentTranslation?.status === 'published'
                          ? 'text-success'
                          : 'text-ink-muted'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${STATUS_LABELS[currentTranslation?.status ?? 'draft'].dot}`}
                      />
                      {STATUS_LABELS[currentTranslation?.status ?? 'draft'].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentTranslation?.status === 'published' ? (
                      <Button variant="icon_warning" onClick={handleUnpublish}>
                        Unpublish
                      </Button>
                    ) : (
                      <Button variant="icon_success" onClick={handlePublish}>
                        Publish
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      route="admin.page_revisions.index"
                      routeParams={{
                        id: page.id,
                        translationId: currentTranslation?.id,
                      }}
                    >
                      Revisions
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-2">
                  <Heading level={4}>Details</Heading>
                  <Field
                    label="Title"
                    type="text"
                    name="title"
                    defaultValue={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <Field
                    label="Slug"
                    type="text"
                    name="slug"
                    defaultValue={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>
                <Separator />
                <div className="grid gap-2">
                  <Heading level={4}>SEO</Heading>
                  <Field
                    label="Meta title"
                    type="text"
                    name="metaTitle"
                    defaultValue={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Fallback to title"
                  />
                  <Field
                    label="Meta desc."
                    type="textarea"
                    name="metaDescription"
                    defaultValue={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex-1 w-100">
                <BlockTree
                  content={content}
                  onChange={handleContentChange}
                  onOperation={handleBlockOp}
                  getLock={getLock}
                  acquireLock={acquireLock}
                  releaseLock={releaseLock}
                  currentUserId={currentUserId}
                />
              </div>
            </div>
          </div>
        )}
        {showPreview && (
          <div className="flex-1">
            <PreviewIframe
              key={currentTranslation?.id}
              pageId={page.id}
              locale={activeLocale}
              translationId={currentTranslation?.id}
            />
          </div>
        )}
      </div>
    </>
  )
}

function SaveButton({
  state,
  saving,
  onClick,
}: {
  state: string
  saving: boolean
  onClick: () => void
}) {
  if (state === 'saved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success px-3 py-1.5 bg-success-soft rounded-lg border border-success/20">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Saved
      </span>
    )
  }
  if (state === 'error') {
    return (
      <Button variant="icon_danger" onClick={onClick} fitContent>
        Retry
      </Button>
    )
  }
  return (
    <Button variant="primary" onClick={onClick} disabled={saving} fitContent>
      {saving ? 'Saving…' : 'Save'}
    </Button>
  )
}

function AddTranslationButton({
  pageId,
  existingLocales,
}: {
  pageId: number
  existingLocales: string[]
}) {
  const [open, setOpen] = useState(false)
  const form = useForm({ locale: '', slug: '', title: '', seedFromLocale: '' })
  const ALL = ['en', 'fr', 'de', 'es', 'it', 'pt']
  const avail = ALL.filter((l) => !existingLocales.includes(l))
  if (!avail.length) return null

  return (
    <div className="relative ml-auto">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-2 text-xs text-ink-subtle hover:text-primary transition-colors"
      >
        <span className="w-4 h-4 rounded border border-dashed border-edge flex items-center justify-center">
          +
        </span>
        Add locale
      </button>
      {open && (
        <div className="absolute top-10 right-0 z-30 w-52 rounded-xl border border-edge bg-canvas shadow-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-ink">New translation</p>
          <select
            value={form.data.locale}
            onChange={(e) => form.setData('locale', e.target.value)}
            className="w-full text-xs rounded-lg border border-edge bg-canvas px-2 py-1.5 text-ink"
          >
            <option value="">Select locale…</option>
            {avail.map((l) => (
              <option key={l} value={l}>
                {l.toUpperCase()}
              </option>
            ))}
          </select>
          <Input
            name="title"
            type="text"
            defaultValue={form.data.title}
            onChange={(e) => form.setData('title', e.target.value)}
            placeholder="Title"
          />
          <Input
            name="slug"
            type="text"
            defaultValue={form.data.slug}
            onChange={(e) => form.setData('slug', e.target.value)}
            placeholder="slug"
          />
          <select
            value={form.data.seedFromLocale}
            onChange={(e) => form.setData('seedFromLocale', e.target.value)}
            className="w-full text-xs rounded-lg border border-edge bg-canvas px-2 py-1.5 text-ink"
          >
            <option value="">Empty content</option>
            {existingLocales.map((l) => (
              <option key={l} value={l}>
                Copy from {l.toUpperCase()}
              </option>
            ))}
          </select>
          <Button
            variant="primary"
            disabled={!form.data.locale || !form.data.title || !form.data.slug || form.processing}
            onClick={() =>
              form.post(urlFor('admin.page_translations.execute', { id: pageId }), {
                onSuccess: () => setOpen(false),
              })
            }
          >
            Add
          </Button>
        </div>
      )}
    </div>
  )
}

PagesEditPage.layout = (page: ReactElement<SharedProps>) => page
