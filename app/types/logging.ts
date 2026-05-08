export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export enum LogCategory {
  AUTH = 'auth',
  API = 'api',
  DATABASE = 'database',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  BUSINESS = 'business',
  SYSTEM = 'system',
}

export interface LogContext {
  userId?: number
  userEmail?: string
  ip?: string
  userAgent?: string
  method?: string
  url?: string
  statusCode?: number
  duration?: number
  [key: string]: any
}

export interface LogEntry {
  message: string
  level?: LogLevel
  category?: LogCategory
  context?: LogContext
  error?: Error
  metadata?: Record<string, any>
}
