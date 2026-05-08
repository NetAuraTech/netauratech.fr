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

export type CmsUsersIndexTranslations = {
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

export type CmsUsersShowTranslations = {
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

export type CmsUsersFormTranslations = {
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

export type CmsFilesTranslations = {
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

export type CmsFileFoldersTranslations = {
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

export type CmsTemplatesTranslations = {
  title: string
  empty: {
    value: string
    help: string
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

export type CmsPagesIndexTranslations = {
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

export type CmsPagesCreateTranslations = {
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

export type CmsPagesShowTranslations = {
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

export type CmsPagesRevisionTranslations = {
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
  }
}

export type CmsTranslations = {
  category: {
    content: string
    access_control: string
  }
  dashboard: string
  pages: string
  templates: string
  files: string
  users: string
}
