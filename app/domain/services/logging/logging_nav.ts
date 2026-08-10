import type { AdminNavEntry } from '#types/nav'

/** Admin navigation entries contributed by the logging domain. */
export const loggingNavEntries: AdminNavEntry[] = [
  {
    label: 'admin.logs.value',
    icon: 'ScrollText',
    route: 'admin.logs.render',
    permission: 'logs.view',
    category: 'settings',
  },
]
