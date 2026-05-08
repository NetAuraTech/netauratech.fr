import { useState } from 'react'
import type { ContactFormField } from '#types/page'

interface UseContactFormOptions {
  pageId: number
  locale: string
  recipientEmail: string
  fields: ContactFormField[]
}

interface FieldState {
  value: string
  error: string | null
}

type FormState = Record<string, FieldState>

/**
 * Manages the state and submission logic for `ContactFormBlock`.
 *
 * Handles field values, front-end required validation, POST submission to
 * `/contact`, and the success/error feedback state.
 */
export function useContactForm({ pageId, locale, recipientEmail, fields }: UseContactFormOptions) {
  const [formState, setFormState] = useState<FormState>(() =>
    Object.fromEntries(fields.map((f) => [f.name, { value: '', error: null }]))
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  function setValue(name: string, value: string) {
    setFormState((prev) => ({
      ...prev,
      [name]: { value, error: null },
    }))
  }

  function validate(): boolean {
    let valid = true
    const next: FormState = { ...formState }

    for (const field of fields) {
      if (field.required && !formState[field.name]?.value.trim()) {
        next[field.name] = { ...next[field.name], error: 'This field is required' }
        valid = false
      }
    }

    setFormState(next)
    return valid
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)

    if (!validate()) return

    setIsSubmitting(true)

    try {
      const res = await fetch('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          pageId,
          locale,
          recipientEmail,
          fields: fields.map((f) => ({
            name: f.name,
            value: formState[f.name]?.value ?? '',
          })),
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setIsSuccess(true)
      } else {
        setServerError(data.error?.message ?? 'An unexpected error occurred.')
      }
    } catch {
      setServerError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return { formState, setValue, submit, isSubmitting, isSuccess, serverError }
}
