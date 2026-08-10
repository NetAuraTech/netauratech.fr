import type { AdminNavEntry } from '#types/nav'

/** Admin navigation entries contributed by the file domain. */
export const fileNavEntries: AdminNavEntry[] = [
  {
    label: 'admin.files.value',
    icon: 'Folder',
    route: 'admin.files.render',
    permission: 'files.view',
    category: 'content',
  },
]
