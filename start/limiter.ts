/*
|--------------------------------------------------------------------------
| Define HTTP limiters
|--------------------------------------------------------------------------
|
| The "limiter.define" method creates an HTTP middleware to apply rate
| limits on a route or a group of routes. Feel free to define as many
| throttle middleware as needed.
|
*/

import limiter from '@adonisjs/limiter/services/main'
import app from '@adonisjs/core/services/app'

export const throttle = (max: number = 10, limit: string | number = '1 minute') =>
  limiter.define('global', () => {
    return limiter
      .allowRequests(max)
      .every(limit)
      .limitExceeded((error) => {
        error.handle = async (throttleError, ctx): Promise<void> => {
          const { request, response, session, i18n } = ctx

          const message = i18n.t(`exceptions.${error.code}`, {
            limit: throttleError.response.limit,
            remaining: throttleError.response.remaining,
            availableIn: Math.ceil(throttleError.response.availableIn / 60),
          })

          if (request.wantsJSON()) {
            return response.status(error.status).send({
              error: {
                code: error.code,
                message: message,
                details: {
                  limit: throttleError.response.limit,
                  remaining: throttleError.response.remaining,
                  availableIn: Math.ceil(throttleError.response.availableIn / 60),
                },
                ...(app.inDev && { stack: error.stack }),
              },
            })
          }

          session.flash('error', message)
          return response.redirect().back()
        }
      })
  })
