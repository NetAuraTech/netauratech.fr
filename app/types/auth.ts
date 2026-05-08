import { type FullToken } from '#types/core'

export interface RegisterPayload {
  email: string
  password: string
  locale: string
}

export interface ResetPasswordPayload {
  token: FullToken
  password: string
}

export type OAuthProvider = 'github' | 'google' | 'facebook'
