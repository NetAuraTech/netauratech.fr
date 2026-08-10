import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { GetRobotsTxtAction } from '#actions/core/get_robots_txt_action'

/**
 * Serves `robots.txt` for crawlers.
 *
 * The body is produced by the {@link GetRobotsTxtAction}; this controller is
 * transport only.
 */
@inject()
export default class RobotsController {
  constructor(protected getRobotsTxtAction: GetRobotsTxtAction) {}

  /**
   * `GET /robots.txt`
   *
   * @returns The `robots.txt` body with a plain-text content type.
   */
  async show({ response }: HttpContext) {
    const robotsTxt = await this.getRobotsTxtAction.execute()

    return response.header('Content-Type', 'text/plain').send(robotsTxt)
  }
}
