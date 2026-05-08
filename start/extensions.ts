import { HttpRequest } from '@adonisjs/core/http'

/**
 * Check if the request expects a JSON response based on Accept header
 */
HttpRequest.macro('wantsJSON', function (this: HttpRequest) {
  const acceptsJson = this.accepts(['html', 'json']) === 'json'
  const isInertia = !!this.header('x-inertia')

  return acceptsJson && !isInertia
})

declare module '@adonisjs/core/http' {
  interface HttpRequest {
    wantsJSON(): boolean
  }
}
