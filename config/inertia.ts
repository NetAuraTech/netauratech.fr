import { defineConfig } from '@adonisjs/inertia'
import app from '@adonisjs/core/services/app'

const inertiaConfig = defineConfig({
  /**
   * Server-side rendering options
   */
  ssr: {
    /**
     * Toggle SSR mode for Inertia pages.
     */
    enabled: true,

    /**
     * Entry file used by the SSR server build.
     */
    entrypoint: `${app.inProduction ? 'ssr/ssr.js' : 'inertia/ssr.tsx'}`,
  },
})

export default inertiaConfig
