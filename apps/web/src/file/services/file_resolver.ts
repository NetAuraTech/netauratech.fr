import i18nManager from '@adonisjs/i18n/services/main';
import { File as FileDomain } from '#file/domain/file';
import { classifyFileType } from '#file/services/file_type';
import { ImageOptimizerService } from '#file/services/image_optimizer_service';
import { StorageService } from '#file/services/storage_service';
import type { FileDisplayIntent, ResolvedFile } from '#types/file';

/**
 * Resolves a domain {@link FileDomain} into the render-ready `ResolvedFile`
 * prop shape shared by CMS pages and manual fronts.
 *
 * All async lookups (public URL, responsive variants) and the alt resolution
 * (via the entity's shared priority chain) happen server-side, so the React
 * front receives plain data with no further DB or storage calls. The display
 * intent's locale defaults to the i18n default locale when omitted.
 *
 * @param file - The domain file with its alts relation loaded
 * @param intent - Optional display intent (`locale`, `altKey`, `altOverride`)
 * @param imageOptimizer - Overridable optimizer for testability
 * @returns A {@link ResolvedFile} safe to serialize into Inertia props
 *
 * @example
 * const prop = await resolveFileForRender(file, { locale: 'en', altKey: 'hero' })
 */
export async function resolveFileForRender(
	file: FileDomain,
	intent: Partial<FileDisplayIntent> = {},
	imageOptimizer: ImageOptimizerService = new ImageOptimizerService(),
): Promise<ResolvedFile> {
	const storageService = new StorageService();
	const url = await storageService.url(file.path, file.disk);
	const locale = intent.locale ?? i18nManager.defaultLocale;
	const alt = file.resolveAlt(locale, i18nManager.defaultLocale, intent.altKey ?? null, intent.altOverride ?? null);
	const optimized = await imageOptimizer.optimize(file);

	return {
		id: file.id.value,
		url,
		filename: file.filename,
		mimeType: file.mimeType,
		extension: file.extension,
		size: file.size,
		type: classifyFileType(file.mimeType),
		alt,
		width: optimized.width,
		height: optimized.height,
		variants: optimized.variants,
	};
}
