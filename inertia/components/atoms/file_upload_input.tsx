import { useRef, useState, useId, ChangeEvent, DragEvent } from 'react'
import { Icon } from '~/components/atoms/icon'
import { Paragraph } from '~/components/atoms/paragraph'
import { humanSize } from '~/utils/file'
import { Label } from '~/components/atoms/label'
import { Button } from '~/components/atoms/button'
import type { CmsFilesTranslations } from '#types/translations'
import { useTranslation } from '~/hooks/use_translation'

interface FileUploadInputProps {
  /** Input name attribute, used when inside a native <form> */
  name?: string
  /** Called when the user picks a file */
  onChange?: (file: File | null) => void
  /** Accepted MIME types or extensions, e.g. "image/*,.pdf" */
  accept?: string
  /** Maximum file size in bytes — shows a validation error if exceeded */
  maxSize?: number
  /** Whether the field is required */
  required?: boolean
  /** Disable the input */
  disabled?: boolean
  /** Optional label shown above the drop zone */
  label?: string
  /** Optional hint shown below the drop zone */
  hint?: string
  translations: CmsFilesTranslations
}

/**
 * Drag-and-drop + click-to-browse file upload input.
 *
 * Renders as an uncontrolled `<input type="file">` so it works seamlessly
 * inside AdonisJS Inertia `<Form>` components. The hidden input is wired to
 * the same `name` prop so the form serialiser picks it up automatically.
 *
 * Features:
 * - Drag-over highlight
 * - Preview for image files, file name + size for non-images
 * - Client-side size validation with an inline error message
 * - Clear button to reset the selection
 *
 * @example
 * // Inside an Inertia Form
 * <Form route="admin.files.upload">
 *   <FileUploadInput name="file" accept="image/*,.pdf" maxSize={10 * 1024 * 1024} required />
 *   <Button type="submit">Upload</Button>
 * </Form>
 *
 * @example
 * // Controlled, outside a form
 * <FileUploadInput onChange={(file) => setFile(file)} accept="image/*" />
 */
export function FileUploadInput(props: FileUploadInputProps) {
  const {
    name = 'file',
    onChange,
    accept,
    maxSize,
    required = false,
    disabled = false,
    label,
    hint,
    translations,
  } = props
  const { t } = useTranslation<CmsFilesTranslations>(translations)
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [sizeError, setSizeError] = useState(false)

  function handleFile(picked: File | null) {
    setSizeError(false)

    if (!picked) {
      setFile(null)
      setPreview(null)
      onChange?.(null)
      return
    }

    if (maxSize && picked.size > maxSize) {
      setSizeError(true)
      return
    }

    setFile(picked)
    onChange?.(picked)

    if (picked.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(picked)
    } else {
      setPreview(null)
    }
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    handleFile(e.target.files?.[0] ?? null)
  }

  function handleClear() {
    if (inputRef.current) inputRef.current.value = ''
    handleFile(null)
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    handleFile(e.dataTransfer.files?.[0] ?? null)

    if (inputRef.current && e.dataTransfer.files.length) {
      const dt = new DataTransfer()
      dt.items.add(e.dataTransfer.files[0])
      inputRef.current.files = dt.files
    }
  }

  const isImage = file?.type.startsWith('image/')
  const hasFile = file !== null

  const dropZoneClasses = [
    'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors cursor-pointer p-6',
    isDragging
      ? 'border-primary bg-primary-soft/30'
      : hasFile && !sizeError
        ? 'border-primary-soft bg-primary-soft/10'
        : sizeError
          ? 'border-danger bg-danger-soft/20'
          : 'border-edge hover:border-primary-soft hover:bg-sunken',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="grid gap-1.5">
      {label && <Label label={label} htmlFor={name} required={required} />}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-labelledby={label ? `${id}-label` : undefined}
        className={dropZoneClasses}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          name={name}
          accept={accept}
          required={required}
          disabled={disabled}
          className="sr-only"
          onChange={handleInputChange}
        />

        {hasFile && !sizeError ? (
          <div
            className="flex flex-col items-center gap-2 w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {isImage && preview ? (
              <img
                src={preview}
                alt={file.name}
                className="max-h-32 max-w-full rounded-lg object-contain border border-edge"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-sunken border border-edge flex items-center justify-center">
                <Icon name="FileText" size={22} className="text-ink-muted" />
              </div>
            )}
            <div className="text-center">
              <p className="text-sm font-medium text-ink truncate max-w-xs">{file.name}</p>
              <p className="text-xs text-ink-muted mt-0.5">{humanSize(file.size)}</p>
            </div>
            <Button
              type="button"
              variant="icon_danger"
              fitContent
              onClick={handleClear}
              title={t('upload.remove')}
            >
              <Icon name="Trash" size={18} />
            </Button>
          </div>
        ) : (
          <>
            <div
              className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors ${
                sizeError ? 'bg-danger-soft border-danger/30' : 'bg-sunken border-edge'
              }`}
            >
              <Icon
                name={sizeError ? 'CircleAlert' : isDragging ? 'CloudDownload' : 'Upload'}
                size={22}
                className={sizeError ? 'text-danger' : 'text-ink-muted'}
              />
            </div>
            <div className="text-center space-y-1">
              {sizeError ? (
                <Paragraph variant="error">
                  {t('upload.error.size', {
                    max: humanSize(maxSize ?? 0),
                  })}
                </Paragraph>
              ) : (
                <>
                  <Paragraph variant="ink">{t('upload.help')}</Paragraph>
                  {accept && <Paragraph variant="muted">{accept.replace(/,/g, ', ')}</Paragraph>}
                  {maxSize && (
                    <Paragraph variant="muted">
                      {t('upload.max_size', {
                        size: humanSize(maxSize),
                      })}
                    </Paragraph>
                  )}
                </>
              )}
            </div>
            {sizeError && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setSizeError(false)
                }}
                className="text-xs text-ink-muted hover:text-ink transition-colors"
              >
                {t('upload.try_again')}
              </button>
            )}
          </>
        )}
      </div>
      {hint && !sizeError && <Paragraph variant="muted">{hint}</Paragraph>}
    </div>
  )
}
