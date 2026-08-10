import { useState, SubmitEvent, useEffect } from 'react'
import { Button } from '~/components/atoms/button'
import { Icon } from '~/components/atoms/icon'
import { Paragraph } from '~/components/atoms/paragraph'
import type { Data } from '@generated/data'
import { Field } from '~/components/molecules/field'
import { SelectOption } from '~/components/atoms/select_option'
import { toast } from 'sonner'
import type { AdminFilesTranslations } from '#types/translations'
import { locales, useTranslation } from '~/hooks/use_translation'
import { usePage } from '@inertiajs/react'
import { SharedProps } from '@adonisjs/inertia/types'
import { Form } from '@adonisjs/inertia/react'

interface FileAlt {
  locale: string
  key: string
  value: string
}

interface FileAltEditorProps {
  file: Data.File
  translations: AdminFilesTranslations
}

/**
 * Inline editor for a file's named alt texts.
 *
 * Displays all existing `(locale, key, value)` triplets and lets the user
 * add new ones or delete existing ones via the API routes:
 *   PATCH  /files/:id/alts  → upsertAlt
 *   DELETE /files/:id/alts  → deleteAlt
 *
 * Each row shows the locale and key as read-only labels and the value as an
 * editable input. Saving is triggered by the row's "Save" button or by
 * pressing Enter. The list is refreshed automatically via Inertia.
 */
export function FileAltEditor(props: FileAltEditorProps) {
  const { file, translations } = props
  const [adding, setAdding] = useState(false)
  const [alts, setAlts] = useState<FileAlt[]>([])
  const { t } = useTranslation<AdminFilesTranslations>(translations)

  const pageProps = usePage<SharedProps>().props

  function rowKey(locale: string, key: string) {
    return `${locale}:${key}`
  }

  useEffect(() => {
    setAlts((file as any).alts ?? [])
  }, [file])

  const handleDelete = async (e: SubmitEvent<HTMLFormElement>) => {
    const data = Object.fromEntries(new FormData(e.target)) as {
      locale: string
      key: string
      value: string
    }

    const response = await fetch(e.target.action, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': pageProps.csrfToken,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const data = await response.json()
      toast.error(data.error.message)

      return
    }

    setAlts(alts.filter((alt) => rowKey(alt.locale, alt.key) !== rowKey(data.locale, data.key)))

    toast.success(response.text())
  }

  const handleSubmit = async (
    e: SubmitEvent<HTMLFormElement>,
    callback: (value: boolean) => void
  ) => {
    const data = Object.fromEntries(new FormData(e.target)) as {
      locale: string
      key: string
      value: string
    }

    const response = await fetch(e.target.action, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': pageProps.csrfToken,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const data = await response.json()
      toast.error(data.error.message)

      return
    }

    setAlts((currentAlts) => {
      const exists = currentAlts.some((alt) => alt.locale === data.locale && alt.key === data.key)

      if (exists) {
        return currentAlts.map((alt) =>
          alt.locale === data.locale && alt.key === data.key ? data : alt
        )
      }

      return [...currentAlts, data]
    })

    callback(false)

    toast.success(response.text())
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
          {t('alts.title')}
        </p>
        <Button
          type="button"
          variant="icon"
          fitContent
          onClick={() => setAdding(!adding)}
          title={adding ? t('alts.close') : t('alts.add')}
        >
          <Icon name={adding ? 'X' : 'Plus'} size={14} />
        </Button>
      </div>
      {adding && (
        <Form
          onSubmitCapture={async (e) => {
            e.stopPropagation()
            e.preventDefault()

            await handleSubmit(e, setAdding)
          }}
          route={'admin.files.upsert_alt'}
          routeParams={{ id: file.id }}
          className="grid gap-2 rounded border border-primary-soft bg-primary-soft/20 p-3"
        >
          {({ processing }) => (
            <>
              <Field
                type="select"
                label={t('alts.form.locale.value')}
                name="locale"
                required
                sanitize
              >
                {locales.map((l) => (
                  <SelectOption key={l} value={l} label={l.toUpperCase()} />
                ))}
              </Field>
              <Field
                type="text"
                name="key"
                label={t('alts.form.key.value')}
                placeholder={t('alts.form.key.placeholder')}
                required
                sanitize
              />
              <Field
                type="textarea"
                name="value"
                label={t('alts.form.alt_text.value')}
                placeholder={t('alts.form.alt_text.placeholder')}
                required
                sanitize
              />
              <div className="flex gap-1.5 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  fitContent
                  onClick={() => setAdding(false)}
                  disabled={processing}
                >
                  {t('alts.form.cancel')}
                </Button>
                <Button type="submit" variant="primary" fitContent disabled={processing}>
                  {t('alts.form.submit')}
                </Button>
              </div>
            </>
          )}
        </Form>
      )}
      {alts.length === 0 && !adding ? (
        <Paragraph variant="muted">{t('alts.empty')}</Paragraph>
      ) : (
        <div className="grid gap-1">
          {alts.map((alt) => (
            <AltRow
              key={`alt-${alt.locale}-${alt.key}`}
              alt={alt}
              file={file}
              rowKey={rowKey}
              handleSubmit={handleSubmit}
              handleDelete={handleDelete}
              translations={translations}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const AltRow = (props: {
  file: Data.File
  alt: FileAlt
  rowKey: (locale: string, key: string) => string
  handleSubmit: (event: SubmitEvent<HTMLFormElement>, callback: (value: boolean) => void) => void
  handleDelete: (event: SubmitEvent<HTMLFormElement>) => void
  translations: AdminFilesTranslations
}) => {
  const { file, alt, rowKey, handleSubmit, handleDelete, translations } = props
  const { t } = useTranslation<AdminFilesTranslations>(translations)
  const k = rowKey(alt.locale, alt.key)
  const [isEditing, setIsEditing] = useState<boolean>(false)

  return (
    <div key={k} className="rounded-lg border border-edge bg-canvas px-2 py-1.5 group">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-xs font-semibold text-ink-muted bg-sunken border border-edge px-1.5 py-0.5 rounded uppercase w-8 text-center">
            {alt.locale}
          </span>
          <span className="text-xs text-ink-muted font-mono shrink-0 w-20 truncate" title={alt.key}>
            {alt.key}
          </span>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button type="button" variant="icon" fitContent onClick={() => setIsEditing(false)}>
                <Icon name="X" size={14} />
              </Button>
            </>
          ) : (
            <>
              <Button
                type="submit"
                variant="icon_warning"
                fitContent
                title={t('alts.edit')}
                onClick={() => setIsEditing(true)}
              >
                <Icon name="Pen" size={18} />
              </Button>
              <Form
                onSubmitCapture={async (e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  const confirmed = window.confirm(t('alts.delete.confirm'))

                  if (confirmed) {
                    handleDelete(e)
                  }
                }}
                route="admin.files.delete_alt"
                routeParams={{ id: file.id }}
              >
                {({ processing }) => (
                  <>
                    <input type="hidden" name="locale" id="locale" defaultValue={alt.locale} />
                    <input type="hidden" name="key" id="key" defaultValue={alt.key} />
                    <Button
                      type="submit"
                      variant="icon_danger"
                      fitContent
                      title={t('alts.delete.value')}
                      disabled={processing}
                    >
                      <Icon name="Trash" size={18} />
                    </Button>
                  </>
                )}
              </Form>
            </>
          )}
        </div>
      </div>
      {isEditing ? (
        <Form
          onSubmitCapture={async (e) => {
            e.stopPropagation()
            e.preventDefault()

            handleSubmit(e, setIsEditing)
          }}
          className="grid gap-2"
          route={'admin.files.upsert_alt'}
          routeParams={{ id: file.id }}
        >
          {({ processing }) => (
            <>
              <input type="hidden" name="locale" id="locale" defaultValue={alt.locale} />
              <input type="hidden" name="key" id="key" defaultValue={alt.key} />
              <Field
                type="textarea"
                name="value"
                label={t('alts.form.alt_text.value')}
                placeholder={t('alts.form.alt_text.placeholder')}
                required
                sanitize
                defaultValue={alt.value}
              />
              <Button type="submit" variant="primary" fitContent disabled={processing}>
                {t('alts.form.update')}
              </Button>
            </>
          )}
        </Form>
      ) : (
        <Paragraph>{alt.value}</Paragraph>
      )}
    </div>
  )
}
