import { inject } from '@adonisjs/core';
import { ListLogEntriesAction } from '#log/actions/log/list_log_entries_action';
import { extractPagination } from '#transport/core/helpers/extract_pagination';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';
import { stripEmptyStrings } from '#transport/core/helpers/strip_empty_strings';
import { buildLogsListPayload } from '#transport/log/helpers/i18n_payloads/logs_list';
import LogEntryTransformer from '#transport/log/transformers/log_entry_transformer';
import { listLogsValidator } from '#transport/log/validators/log';
import type { HttpContext } from '@adonisjs/core/http';

/**
 * Logs controller for the admin UI.
 * Renders the paginated, filterable application log viewer.
 */
@inject()
export default class LogsController {
	constructor(
		protected i18n: I18nService,
		protected listLogEntriesAction: ListLogEntriesAction,
	) {}

	/**
	 * Render the logs list page (Inertia).
	 */
	async render(ctx: HttpContext) {
		const { inertia, request } = ctx;

		const pagination = await extractPagination(request);
		const data = stripEmptyStrings(request.all());
		const payload = await listLogsValidator.validate(data);

		const entries = await this.listLogEntriesAction.execute({
			...payload,
			...pagination,
		});

		return renderInertiaPage(inertia, 'log/admin/index', {
			entries: LogEntryTransformer.paginate(entries.all(), entries.getMeta()),
			filters: {
				...payload,
				from: payload.from?.toISODate() ?? undefined,
				to: payload.to?.toISODate() ?? undefined,
			},
			translations: buildLogsListPayload(this.i18n),
		});
	}
}
