import { inject } from '@adonisjs/core'
import env from '#start/env'

/**
 * Generate a robots.txt string for the site.
 */
@inject()
export class GetRobotsTxtAction {
  /**
   * Execute robots.txt generation.
   *
   * @returns The complete robots.txt string.
   */
  async execute(): Promise<string> {
    const appUrl = env.get('APP_URL') ?? 'http://localhost:3000'
    return this.buildRobotsTxt(appUrl)
  }

  /**
   * Constructs the robots.txt content.
   */
  buildRobotsTxt(appUrl: string): string {
    const lines = ['User-agent: *', 'Allow: /', `Sitemap: ${appUrl}/sitemap.xml`]
    return lines.join('\n') + '\n'
  }
}
