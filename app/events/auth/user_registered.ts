import { BaseEvent } from '@adonisjs/core/events'
import type User from '#models/auth/user'

export default class UserRegistered extends BaseEvent {
  /**
   * Accept event data as constructor parameters
   */
  constructor(public user: User) {
    super()
  }
}
