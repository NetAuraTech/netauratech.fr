import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { contactValidator } from '#validators/contact'
import { events } from '#generated/events'

@inject()
export default class ContactController {
  /**
   * Handles a contact form submission from a `ContactFormBlock`.
   *
   * Validates the payload, dispatches the `ContactFormSubmitted` event which
   * triggers `SendContactFormEmail`
   */
  async execute(ctx: HttpContext) {
    const { request, response, session, i18n } = ctx
    const payload = await contactValidator.validate(request.all())

    await events.page.ContactFormSubmitted.dispatch(payload)

    session.flash('success', i18n.t('page.contact_form.submitted'))

    return response.redirect().back()
  }
}
