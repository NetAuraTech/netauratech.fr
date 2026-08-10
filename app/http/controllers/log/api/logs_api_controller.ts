import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { ListLogEntriesAction } from '#actions/log/list_log_entries_action'
import { listLogsValidator } from '#validators/log'
import LogEntryTransformer from '#transformers/log_entry_transformer'
import { stripEmptyStrings } from '#helpers/core/strip_empty_strings'
import { extractPagination } from '#helpers/pagination/extract_pagination'

/**
 * GET /api/v1/admin/logs — paginated, filterable application log entries.
 */
@inject()
export default class LogsApiController {
  constructor(protected listLogEntriesAction: ListLogEntriesAction) {}

  async index({ request, serialize }: HttpContext) {
    const pagination = await extractPagination(request)
    const data = stripEmptyStrings(request.all())
    const payload = await listLogsValidator.validate(data)

    const entries = await this.listLogEntriesAction.execute({
      ...payload,
      ...pagination,
    })

    return serialize(LogEntryTransformer.paginate(entries.all(), entries.getMeta()))
  }
}
