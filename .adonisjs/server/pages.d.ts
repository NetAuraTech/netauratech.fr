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
    'auth/admin/form': ExtractProps<(typeof import('../../inertia/pages/auth/admin/form.tsx'))['default']>
    'auth/admin/index': ExtractProps<(typeof import('../../inertia/pages/auth/admin/index.tsx'))['default']>
    'auth/admin/show': ExtractProps<(typeof import('../../inertia/pages/auth/admin/show.tsx'))['default']>
    'auth/front/accept_invitation': ExtractProps<(typeof import('../../inertia/pages/auth/front/accept_invitation.tsx'))['default']>
    'auth/front/define_password': ExtractProps<(typeof import('../../inertia/pages/auth/front/define_password.tsx'))['default']>
    'auth/front/forgot_password': ExtractProps<(typeof import('../../inertia/pages/auth/front/forgot_password.tsx'))['default']>
    'auth/front/login': ExtractProps<(typeof import('../../inertia/pages/auth/front/login.tsx'))['default']>
    'auth/front/register': ExtractProps<(typeof import('../../inertia/pages/auth/front/register.tsx'))['default']>
    'auth/front/reset_password': ExtractProps<(typeof import('../../inertia/pages/auth/front/reset_password.tsx'))['default']>
    'core/admin/dashboard.spec': ExtractProps<(typeof import('../../inertia/pages/core/admin/dashboard.spec.tsx'))['default']>
    'core/admin/dashboard': ExtractProps<(typeof import('../../inertia/pages/core/admin/dashboard.tsx'))['default']>
    'core/front/home': ExtractProps<(typeof import('../../inertia/pages/core/front/home.tsx'))['default']>
    'errors/not_found': ExtractProps<(typeof import('../../inertia/pages/errors/not_found.tsx'))['default']>
    'errors/server_error': ExtractProps<(typeof import('../../inertia/pages/errors/server_error.tsx'))['default']>
    'file/admin/folders': ExtractProps<(typeof import('../../inertia/pages/file/admin/folders.tsx'))['default']>
    'file/admin/index': ExtractProps<(typeof import('../../inertia/pages/file/admin/index.tsx'))['default']>
    'log/admin/index': ExtractProps<(typeof import('../../inertia/pages/log/admin/index.tsx'))['default']>
    'maintenance/admin/index': ExtractProps<(typeof import('../../inertia/pages/maintenance/admin/index.tsx'))['default']>
    'maintenance/front/index': ExtractProps<(typeof import('../../inertia/pages/maintenance/front/index.tsx'))['default']>
    'permission/admin/form': ExtractProps<(typeof import('../../inertia/pages/permission/admin/form.tsx'))['default']>
    'permission/admin/index': ExtractProps<(typeof import('../../inertia/pages/permission/admin/index.tsx'))['default']>
    'role/admin/form': ExtractProps<(typeof import('../../inertia/pages/role/admin/form.tsx'))['default']>
    'role/admin/index': ExtractProps<(typeof import('../../inertia/pages/role/admin/index.tsx'))['default']>
    'role/admin/show': ExtractProps<(typeof import('../../inertia/pages/role/admin/show.tsx'))['default']>
    'settings/account/front/email_change': ExtractProps<(typeof import('../../inertia/pages/settings/account/front/email_change.tsx'))['default']>
    'settings/account/front/index': ExtractProps<(typeof import('../../inertia/pages/settings/account/front/index.tsx'))['default']>
    'settings/preferences/front/index': ExtractProps<(typeof import('../../inertia/pages/settings/preferences/front/index.tsx'))['default']>
    'settings/profile/front/index': ExtractProps<(typeof import('../../inertia/pages/settings/profile/front/index.tsx'))['default']>
  }
}
