export interface Translations {
  subject?: string
  greeting?: string
  intro?: string
  action?: string
  outro?: string
  expiry?: string
  footer?: string
  title?: string
  message?: string
  warning?: string
  support?: string
}

export interface MailPayload {
  user: {
    email: string
    locale: string
  }
  translations: Translations
  [key: string]: any
}
