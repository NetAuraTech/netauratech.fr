export type TranslationNodes = {
  [key: string]: string | TranslationNodes
}

export type LoginTranslations = {
  title: string
  sub_title: string
  account: {
    no: string
    create: string
  }
  email: {
    placeholder: string
    value: string
  }
  password: {
    forgot: string
    value: string
  }
  submit: string
  remember_me: string
  or_continue_with: string
}

export type RegisterTranslations = {
  title: string
  sub_title: string
  account: {
    has: string
    login: string
  }
  email: {
    placeholder: string
    value: string
  }
  password: {
    confirmation: {
      help: string
      value: string
    }
    help: string
    value: string
  }
  submit: string
  or_continue_with: string
}

export type ForgotPasswordTranslations = {
  title: string
  sub_title: string
  email: {
    placeholder: string
    value: string
  }
  submit: string
  back_to_login: string
}

export type ResetPasswordTranslations = {
  title: string
  sub_title: string
  password: {
    confirmation: {
      help: string
      value: string
    }
    help: string
    value: string
  }
  submit: string
  back_to_login: string
}

export type DefinePasswordTranslations = {
  title: string
  sub_title: string
  password: {
    confirmation: {
      help: string
      value: string
    }
    help: string
    value: string
  }
  submit: string
}

export type AcceptInvitationTranslations = {
  title: string
  sub_title: string
  banner: {
    title: string
    message: string
  }
  email: {
    value: string
    placeholder: string
    help: string
  }
  username: {
    value: string
    placeholder: string
    help: string
  }
  password: {
    confirmation: {
      help: string
      value: string
    }
    help: string
    value: string
  }
  submit: string
}

export type SettingsProfileTranslations = {
  header: {
    title: string
    sub_title: string
    tabs: {
      profile: string
      account: string
      preferences: string
      admin: string
      logout: string
    }
  }
  avatar: {
    change: string
    value: string
  }
  username: {
    placeholder: string
    value: string
  }
  title: string
  sub_title: string
  submit: string
}

export type SettingsPreferencesTranslations = {
  header: {
    title: string
    sub_title: string
    tabs: {
      profile: string
      account: string
      preferences: string
      admin: string
      logout: string
    }
  }
  appearance: {
    title: string
    sub_title: string
    value: string
  }
  interface: {
    title: string
    sub_title: string
    submit: string
    locale: {
      english: string
      french: string
      value: string
    }
  }
}

export type SettingsAccountTranslations = {
  header: {
    title: string
    sub_title: string
    tabs: {
      profile: string
      account: string
      preferences: string
      admin: string
      logout: string
    }
  }
  email: {
    title: string
    sub_title: string
    value: string
    placeholder: string
    submit: string
    change: {
      cancel: string
      info: {
        title: string
        message: string
      }
      title: string
      sub_title: string
      submit: string
    }
  }
  oauth: {
    title: string
    sub_title: string
    link: string
    unlink: {
      confirm: string
      value: string
    }
    connected: string
    not_connected: string
  }
  password: {
    title: string
    sub_title: string
    current: {
      value: string
    }
    new: {
      help: string
      value: string
    }
    confirm: {
      help: string
      value: string
    }
    submit: string
  }
  delete: {
    title: string
    sub_title: string
    cancel: string
    submit: string
    password: string
    confirm: {
      title: string
      sub_title: string
    }
  }
}

export type EmailChangeTranslations = {
  title: string
  sub_title: string
  cancel: string
  submit: string
  token: string
  info: {
    title: string
    message: string
  }
}

export type AdminUsersIndexTranslations = {
  title: string
  action: string
  search: {
    value: string
    placeholder: string
    filter: string
  }
  roles: {
    value: string
    [k: string]: string
    placeholder: string
  }
  status: {
    verified: string
    unverified: string
    pending_invite: string
    value: string
  }
  empty: string
  register_on: string
  value: string
  value_one: string
  actions: {
    value: string
    show: string
    edit: string
    delete: string
  }
}

export type AdminUsersShowTranslations = {
  title: string
  info: {
    value: string
    email: string
    username: string
  }
  history: {
    value: string
    created_at: string
    updated_at: string
    verified_at: string
  }
  providers: {
    value: string
    connected: string
    not_connected: string
  }
  roles: {
    value: string
    [k: string]: string
    current: string
  }
  permissions: {
    value: string
    category: Record<string, string>
    [key: string]: string | Record<string, string>
  }
  status: {
    verified: string
    unverified: string
    pending_invite: string
  }
  actions: {
    edit: string
    delete: string
  }
}

export type AdminUsersFormTranslations = {
  title: {
    create: string
    edit: string
  }
  roles: {
    value: string
    [k: string]: string
    placeholder: string
  }
  email: {
    value: string
    placeholder: string
  }
  username: {
    value: string
    placeholder: string
  }
  actions: {
    list: string
  }
  submit: string
}

export type AdminFilesTranslations = {
  title: string
  action: {
    upload: string
    folders: string
  }
  search: {
    value: string
    placeholder: string
    type: {
      value: string
      options: {
        placeholder: string
        image: string
        video: string
        audio: string
        pdf: string
      }
    }
    filter: string
  }
  folders: {
    all: string
  }
  name: string
  type: string
  size: string
  uploaded_at: string
  upload: {
    value: string
    remove: string
    help: string
    max_size: string
    try_again: string
    error: {
      size: string
    }
  }
  alts: {
    title: string
    close: string
    add: string
    edit: string
    delete: {
      value: string
      confirm: string
    }
    empty: string
    form: {
      locale: {
        value: string
      }
      key: {
        value: string
        placeholder: string
      }
      alt_text: {
        value: string
        placeholder: string
      }
      cancel: string
      submit: string
      update: string
    }
  }
  actions: {
    value: string
    show: string
    delete: {
      value: string
      confirm: string
    }
  }
}

export type AdminFileFoldersTranslations = {
  title: string
  action: string
  browse: string
  help: string
  name: {
    root: string
    sub: string
  }
  empty: {
    value: string
    help: string
  }
  actions: {
    add: string
    create: string
    update: string
    cancel: string
    rename: string
    delete: {
      value: string
      confirm: string
    }
  }
}

export type AdminTemplatesTranslations = {
  title: string
  actions: {
    edit: string
    regenerate: string
  }
  create_guidance: {
    value: string
    from_page: string
  }
  empty: {
    value: string
    help: string
  }
  thumbnail: {
    placeholder: string
  }
  search: {
    value: string
    placeholder: string
    type: {
      value: string
      placeholder: string
      page: string
      block: string
    }
    filter: string
  }
  delete: {
    value: string
    confirm: string
  }
}

export type AdminTemplatesEditTranslations = {
  title: string
  back: string
  form: {
    name: string
    description: string
    thumbnail: {
      value: string
      replace: string
      remove: string
      regenerate: string
      regenerating: string
      placeholder: string
    }
    submit: string
    cancel: string
  }
  preview: {
    value: string
    empty: string
    block: string
    page: string
  }
}

export type AdminPagesIndexTranslations = {
  title: string
  action: string
  search: {
    value: string
    placeholder: string
    filter: string
  }
  status: {
    all: string
    draft: string
    published: string
    archived: string
    value: string
  }
  locale: {
    value: string
    all: string
  }
  page_title: string
  slug: string
  empty: string
  value: string
  value_one: string
  actions: {
    value: string
    show: string
    edit: string
    delete: {
      confirm: string
      value: string
    }
  }
}

export type AdminPagesCreateTranslations = {
  title: string
  action: string
  details: string
  seo: {
    value: string
    help: string
  }
  page_title: {
    value: string
    placeholder: string
  }
  slug: string
  locale: string
  meta: {
    title: {
      value: string
      placeholder: string
    }
    description: {
      value: string
      placeholder: string
    }
  }
  submit: string
}

export type AdminPagesShowTranslations = {
  title: string
  actions: {
    back: string
    edit: string
    show: string
    delete: {
      confirm: string
      value: string
    }
  }
  status: {
    draft: string
    published: string
    archived: string
  }
  meta: {
    value: string
    title: string
    id: string
    locale: string
    translations: string
    created: string
    updated: string
  }
  revision: {
    value: string
    view: string
  }
  homepage: {
    value: string
    confirm: string
    submit: string
    help: {
      title: {
        not_set: string
        set: string
      }
      message: {
        not_set: string
        set: string
      }
    }
  }
  last_update: string
  translation: string
  default: string
}

export type AdminPagesRevisionTranslations = {
  title: string
  actions: {
    value: string
    back: string
    restore: {
      value: string
      confirm: string
    }
    unpin: string
    pin: string
  }
  help: string
  index: string
  created: {
    at: string
    by: string
  }
  empty: {
    value: string
    help: string
  }
  latest: string
}

export type PageEditorTranslations = {
  status: {
    value: string
    draft: string
    published: string
    archived: string
  }
  mode: {
    editor: string
    split: string
    preview: string
  }
  toolbar: {
    apply_template: string
    save_as_template: string
    unpublish: string
    publish: string
    revisions: string
  }
  sidebar: {
    details: string
    seo: string
  }
  form: {
    title: {
      value: string
      placeholder: string
      slug_placeholder: string
    }
    meta_title: {
      value: string
      placeholder: string
    }
    meta_description: {
      value: string
      placeholder: string
    }
  }
  save: {
    button: string
    saving: string
    saved: string
    retry: string
  }
  locale: {
    add: string
    new_translation: string
    select: string
    empty_content: string
    copy_from: string
    add_button: string
  }
  blocktree: {
    select_to_configure: string
    insert_template: string
    add_block: string
    save_as_template: string
  }
  block_picker: {
    title: string
    search_placeholder: string
    no_results: string
  }
  template_picker: {
    title: string
    empty: string
    type_placeholder: string
    page: string
    block: string
  }
  save_page_template: {
    title: string
    name_label: string
    name_placeholder: string
    submit: string
    error: string
    reminder: string
  }
  apply_page_template: {
    title: string
    warning: string
    apply_button: string
  }
  save_block_template: {
    title: string
    name_label: string
    name_placeholder: string
    submit: string
    exists_warning: string
    overwrite: string
    cancel: string
  }
  blocks: {
    section: { label: string; description: string }
    grid: { label: string; description: string }
    flex: { label: string; description: string }
    title: { label: string; description: string }
    paragraph: { label: string; description: string }
    button: { label: string; description: string }
    separator: { label: string; description: string }
    icon: { label: string; description: string }
    form: { label: string; description: string }
    field: { label: string; description: string }
    htmltext: { label: string; description: string }
    image: { label: string; description: string }
    video: { label: string; description: string }
    carousel: { label: string; description: string }
    list: { label: string; description: string }
    quote: { label: string; description: string }
    iframe: { label: string; description: string }
  }
}

export type CommonTranslations = {
  pagination: {
    showing: string
    previous: string
    next: string
  }
  validation: {
    required: string
    email: string
    min_length: string
    max_length: string
    matches: string
    one_of: string
    slug_format: string
  }
}

export type AdminDashboardTranslations = {
  title: string
  cards: {
    users: string
    pages: string
    translations: string
    files: string
    templates: string
    published_locales: string
    folders: string
    no_role: string
  }
  status: {
    draft: string
    published: string
    archived: string
  }
  recent: {
    published_pages: string
    uploads: string
    empty: string
  }
  view_all: string
}

export type AdminRolesIndexTranslations = {
  title: string
  search: {
    value: string
    placeholder: string
    filter: string
  }
  create: {
    title: string
  }
  table: {
    name: string
    slug: string
    permissions: string
    users: string
  }
  actions: {
    value: string
    show: string
    edit: string
    delete: string
  }
  delete: {
    confirm: string
  }
  system: {
    value: string
    hint: string
  }
  empty: string
  roles: TranslationNodes
}

export type AdminRolesFormTranslations = {
  title: {
    create: string
    edit: string
  }
  name: {
    value: string
    placeholder: string
  }
  slug: {
    value: string
    placeholder: string
  }
  description: {
    value: string
    placeholder: string
  }
  submit: string
  actions: {
    list: string
  }
  permissions: {
    value: string
    system_hint: string
    categories: TranslationNodes
    items: TranslationNodes
  }
}

export type AdminRolesShowTranslations = {
  title: string
  name: {
    value: string
  }
  slug: {
    value: string
  }
  description: {
    value: string
  }
  system: {
    value: string
    hint: string
  }
  users: {
    value: string
    empty: string
    table: {
      username: string
      email: string
    }
    actions: string
    show: string
  }
  permissions: {
    value: string
    categories: TranslationNodes
    items: TranslationNodes
  }
  actions: {
    list: string
    edit: string
    delete: string
  }
  delete: {
    confirm: string
  }
  roles: TranslationNodes
}

export type AdminPermissionsIndexTranslations = {
  title: string
  create: {
    title: string
  }
  table: {
    name: string
    slug: string
    description: string
  }
  actions: {
    value: string
    edit: string
    delete: string
  }
  delete: {
    confirm: string
  }
  system: {
    value: string
    hint: string
  }
  empty: string
  categories: TranslationNodes
  items: TranslationNodes
}

export type AdminPermissionsFormTranslations = {
  title: {
    create: string
    edit: string
  }
  name: {
    value: string
    placeholder: string
  }
  slug: {
    value: string
    placeholder: string
  }
  category: {
    value: string
    placeholder: string
  }
  description: {
    value: string
    placeholder: string
  }
  submit: string
  actions: {
    list: string
  }
}

export type AdminLogsIndexTranslations = {
  title: string
  empty: string
  logged_on: string
  search: {
    value: string
    placeholder: string
    filter: string
  }
  level: {
    value: string
    placeholder: string
    debug: string
    info: string
    warn: string
    error: string
    fatal: string
  }
  category: {
    value: string
    placeholder: string
    system: string
    security: string
    business: string
    auth: string
    api: string
    database: string
    performance: string
  }
  date: {
    from: string
    to: string
  }
  context: {
    value: string
    empty: string
    view: string
  }
  columns: {
    level: string
    category: string
    message: string
    actor: string
    date: string
  }
}

export type MaintenanceTranslations = {
  title: string
  default_message: string
  retry_in: string
  retry_now: string
}

export type AdminMaintenanceTranslations = {
  title: string
  sub_title: string
  status: {
    label: string
    inactive: string
    active_redis: string
    active_memory: string
  }
  source: {
    redis: string
    memory: string
    memory_warning: string
    redis_unavailable: string
  }
  toggle: {
    label: string
    enable: string
    disable: string
    is_enabled: string
    is_disabled: string
  }
  message: {
    label: string
    placeholder: string
    value: string
  }
  allowed_ips: {
    label: string
    placeholder: string
    help: string
  }
  schedule: {
    title: string
    enable: string
    start: string
    end: string
    help: string
  }
  submit: string
  memory: {
    title: string
    description: string
  }
  redis_down: {
    title: string
    description: string
    help: string
  }
}

/** Translations for the hand-written front home page (`core/front/home`). */
export type HomeTranslations = {
  welcome: string
  tagline: string
}
