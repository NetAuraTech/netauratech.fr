import { type HttpContext } from '@adonisjs/core/http'

export const TOKEN_TYPES = {
  PASSWORD_RESET: 'PASSWORD_RESET',
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  EMAIL_CHANGE: 'EMAIL_CHANGE',
  PENDING_INVITE: 'PENDING_INVITE',
} as const

export type TokenType = (typeof TOKEN_TYPES)[keyof typeof TOKEN_TYPES]

export interface FindOptions {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

export type FullToken = `${string}.${string}`

export interface ThrottleOptions {
  max: number
  window: number
  key_generator?: (ctx: HttpContext) => string
}
