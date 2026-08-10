import i18nManager from '@adonisjs/i18n/services/main'
import type File from '#models/file/file'
import { ImageOptimizerService } from '#services/file/image_optimizer_service'
import { classifyFileType } from '#services/file/file_type'
import type { FileDisplayIntent, ResolvedFile } from '#types/file'

/**
 * Resolves a loaded {@link File} into the render-ready `ResolvedFile` prop
 * shape shared by CMS pages and manual fronts.
 *
 * All async lookups (public URL, responsive variants) and the alt resolution
 * (via the model's shared priority chain) happen server-side, so the React
 * front receives plain data with no further DB or storage calls. The display
 * intent's locale defaults to the i18n default locale when omitted.
 *
 * @param file - The file model instance with its alts relation loaded
 * @param intent - Optional display intent (`locale`, `altKey`, `altOverride`)
 * @param imageOptimizer - Overridable optimizer for testability
 * @returns A {@link ResolvedFile} safe to serialize into Inertia props
 *
 * @example
 * const prop = await resolveFileForRender(file, { locale: 'en', altKey: 'hero' })
 */
export async function resolveFileForRender(
  file: File,
  intent: Partial<FileDisplayIntent> = {},
  imageOptimizer: ImageOptimizerService = new ImageOptimizerService()
): Promise<ResolvedFile> {
  const url = await file.url()
  const locale = intent.locale ?? i18nManager.defaultLocale
  const alt = file.resolveAlt(locale, intent.altKey ?? null, intent.altOverride ?? null)
  const optimized = await imageOptimizer.optimize(file)

  return {
    id: file.id,
    url,
    filename: file.filename,
    mimeType: file.mimeType,
    extension: file.extension,
    size: file.size as number,
    type: classifyFileType(file.mimeType),
    alt,
    width: optimized.width,
    height: optimized.height,
    variants: optimized.variants,
  }
}
