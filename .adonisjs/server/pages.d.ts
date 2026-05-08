import '@adonisjs/inertia/types'

import type React from 'react'
import type { Prettify } from '@adonisjs/core/types/common'

type ExtractProps<T> =
  T extends React.FC<infer Props>
    ? Prettify<Omit<Props, 'children'>>
    : T extends React.Component<infer Props>
      ? Prettify<Omit<Props, 'children'>>
      : never

declare module '@adonisjs/inertia/types' {
  export interface InertiaPages {
    'auth/cms/form': ExtractProps<(typeof import('../../inertia/pages/auth/cms/form.tsx'))['default']>
    'auth/cms/index': ExtractProps<(typeof import('../../inertia/pages/auth/cms/index.tsx'))['default']>
    'auth/cms/show': ExtractProps<(typeof import('../../inertia/pages/auth/cms/show.tsx'))['default']>
    'auth/front/accept_invitation': ExtractProps<(typeof import('../../inertia/pages/auth/front/accept_invitation.tsx'))['default']>
    'auth/front/define_password': ExtractProps<(typeof import('../../inertia/pages/auth/front/define_password.tsx'))['default']>
    'auth/front/forgot_password': ExtractProps<(typeof import('../../inertia/pages/auth/front/forgot_password.tsx'))['default']>
    'auth/front/login': ExtractProps<(typeof import('../../inertia/pages/auth/front/login.tsx'))['default']>
    'auth/front/register': ExtractProps<(typeof import('../../inertia/pages/auth/front/register.tsx'))['default']>
    'auth/front/reset_password': ExtractProps<(typeof import('../../inertia/pages/auth/front/reset_password.tsx'))['default']>
    'core/cms/dashboard': ExtractProps<(typeof import('../../inertia/pages/core/cms/dashboard.tsx'))['default']>
    'errors/not_found': ExtractProps<(typeof import('../../inertia/pages/errors/not_found.tsx'))['default']>
    'errors/server_error': ExtractProps<(typeof import('../../inertia/pages/errors/server_error.tsx'))['default']>
    'file/cms/folders': ExtractProps<(typeof import('../../inertia/pages/file/cms/folders.tsx'))['default']>
    'file/cms/index': ExtractProps<(typeof import('../../inertia/pages/file/cms/index.tsx'))['default']>
    'page/cms/create': ExtractProps<(typeof import('../../inertia/pages/page/cms/create.tsx'))['default']>
    'page/cms/edit': ExtractProps<(typeof import('../../inertia/pages/page/cms/edit.tsx'))['default']>
    'page/cms/index': ExtractProps<(typeof import('../../inertia/pages/page/cms/index.tsx'))['default']>
    'page/cms/revisions': ExtractProps<(typeof import('../../inertia/pages/page/cms/revisions.tsx'))['default']>
    'page/cms/show': ExtractProps<(typeof import('../../inertia/pages/page/cms/show.tsx'))['default']>
    'page/front/preview': ExtractProps<(typeof import('../../inertia/pages/page/front/preview.tsx'))['default']>
    'page/front/show': ExtractProps<(typeof import('../../inertia/pages/page/front/show.tsx'))['default']>
    'settings/account/front/email_change': ExtractProps<(typeof import('../../inertia/pages/settings/account/front/email_change.tsx'))['default']>
    'settings/account/front/index': ExtractProps<(typeof import('../../inertia/pages/settings/account/front/index.tsx'))['default']>
    'settings/preferences/front/index': ExtractProps<(typeof import('../../inertia/pages/settings/preferences/front/index.tsx'))['default']>
    'settings/profile/front/index': ExtractProps<(typeof import('../../inertia/pages/settings/profile/front/index.tsx'))['default']>
    'template/cms/index': ExtractProps<(typeof import('../../inertia/pages/template/cms/index.tsx'))['default']>
  }
}
