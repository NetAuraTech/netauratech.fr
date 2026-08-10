import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { ListLogEntriesAction } from '#actions/log/list_log_entries_action'
import { listLogsValidator } from '#validators/log'
import { I18nService } from '#services/i18n_service'
import LogEntryTransformer from '#transformers/log_entry_transformer'
import { stripEmptyStrings } from '#helpers/core/strip_empty_strings'
import { extractPagination } from '#helpers/pagination/extract_pagination'
import { buildLogsListPayload } from '#helpers/i18n_payloads/logs_list'

/**
 * Logs controller for the admin UI.
 * Renders the paginated, filterable application log viewer.
 */
@inject()
export default class LogsController {
  constructor(
    protected i18n: I18nService,
    protected listLogEntriesAction: ListLogEntriesAction
  ) {}

  /**
   * Render the logs list page (Inertia).
   */
  async render(ctx: HttpContext) {
    const { inertia, request } = ctx

    const pagination = await extractPagination(request)
    const data = stripEmptyStrings(request.all())
    const payload = await listLogsValidator.validate(data)

    const entries = await this.listLogEntriesAction.execute({
      ...payload,
      ...pagination,
    })

    return inertia.render('log/admin/index', {
      entries: LogEntryTransformer.paginate(entries.all(), entries.getMeta()),
      filters: {
        ...payload,
        from: payload.from?.toISODate() ?? undefined,
        to: payload.to?.toISODate() ?? undefined,
      },
      translations: buildLogsListPayload(this.i18n),
    })
  }
}
