import { BaseEvent } from '@adonisjs/core/events'
import type { ContactFormSubmission } from '#types/page'

export default class ContactFormSubmitted extends BaseEvent {
  /**
   * Accept event data as constructor parameters
   */
  constructor(public submission: ContactFormSubmission) {
    super()
  }
}
