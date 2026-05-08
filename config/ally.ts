import env from '#start/env'
import { defineConfig, services } from '@adonisjs/ally'
import type { OAuthProvider } from '#types/auth'

function getCallbackUrl(provider: OAuthProvider) {
  return `${env.get('APP_URL')}/oauth/${provider}/callback`
}

const allyConfig = defineConfig({
  facebook: services.facebook({
    clientId: env.get('FACEBOOK_CLIENT_ID') || 'dummy',
    clientSecret: env.get('FACEBOOK_CLIENT_SECRET') || 'dummy',
    callbackUrl: getCallbackUrl('facebook'),
  }),
  github: services.github({
    clientId: env.get('GITHUB_CLIENT_ID') || 'dummy',
    clientSecret: env.get('GITHUB_CLIENT_SECRET') || 'dummy',
    callbackUrl: getCallbackUrl('github'),
  }),
  google: services.google({
    clientId: env.get('GOOGLE_CLIENT_ID') || 'dummy',
    clientSecret: env.get('GOOGLE_CLIENT_SECRET') || 'dummy',
    callbackUrl: getCallbackUrl('google'),
  }),
})

export default allyConfig

declare module '@adonisjs/ally/types' {
  interface SocialProviders extends InferSocialProviders<typeof allyConfig> {}
}
