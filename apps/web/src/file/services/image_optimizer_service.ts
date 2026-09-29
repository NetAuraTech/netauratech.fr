import app from '@adonisjs/core/services/app';
import drive from '@adonisjs/drive/services/main';
import sharp, { type Sharp } from 'sharp';
import type { StorageDisk } from '#types/file';

/**
 * The storage-location surface of a file needed for image optimization.
 *
 * Both the Lucid `File` model and the domain {@link File} entity satisfy this
 * shape structurally, so the service stays decoupled from the persistence
 * layer.
 */
export interface OptimizableFile {
	/** MIME type of the original image */
	mimeType: string;
	/** Storage disk the original image lives on */
	disk: StorageDisk;
	/** Full storage path of the original image */
	path: string;
	/** Stored filename of the original image */
	filename: string;
}

/**
 * Result of the image optimization process.
 * Includes extracted dimensions and the map of generated variants.
 */
export interface OptimizedImageResult {
	/** Original image width in pixels */
	width?: number;
	/** Original image height in pixels */
	height?: number;
	/** Map of target widths (e.g. 400) to their public variant URLs */
	variants: Record<number, string>;
}

/**
 * Service responsible for server-side image optimization and responsive variant generation.
 *
 * This service ensures that high-quality, pre-resized WebP versions of uploaded images
 * exist on the storage disk. It uses Sharp for high-performance image processing
 * and extracts metadata to prevent Layout Shift (CLS) on the front-end.
 */
export class ImageOptimizerService {
	/**
	 * Optimizes an image by extracting its dimensions and ensuring responsive variants exist.
	 *
	 * The process follows these steps:
	 * 1. Check if the file is a compatible image.
	 * 2. Extract metadata (width/height) from the original file.
	 * 3. For each requested width, check if a physical variant file exists (e.g., filename-400.webp).
	 * 4. If a variant is missing, generate it using Sharp with high-quality settings (Lanczos3, 90% quality).
	 * 5. Return the metadata and public URLs for all variants.
	 *
	 * @param file - The storage-location surface of the original image.
	 * @param widths - Array of target widths to generate. Defaults to [400, 800, 1200].
	 * @returns A promise resolving to the optimization results (dimensions + variants).
	 */
	public async optimize(file: OptimizableFile, widths: number[] = [400, 800, 1200]): Promise<OptimizedImageResult> {
		const result: OptimizedImageResult = {
			variants: {},
		};

		// Skip non-image files or SVGs (which are already responsive by nature)
		if (!file.mimeType.startsWith('image/') || file.mimeType === 'image/svg+xml') {
			return result;
		}

		try {
			const d = drive.use(file.disk);
			const originalPath = file.path;

			// Ensure the original file is still present on the storage disk
			if (!(await d.exists(originalPath))) {
				return result;
			}

			// Initialize Sharp. For local storage, we use the absolute path for better stability
			// on certain Linux environments compared to Buffer-based processing.
			let sharpInstance: Sharp;
			if (file.disk === 'fs') {
				sharpInstance = sharp(app.makePath('storage', originalPath), { failOn: 'none' });
			} else {
				const rawData = await d.getBytes(originalPath);
				sharpInstance = sharp(Buffer.from(rawData), { failOn: 'none' });
			}

			// Extract original dimensions to provide to the front-end for CLS prevention
			const metadata = await sharpInstance.metadata();
			result.width = metadata.width;
			result.height = metadata.height;

			const dir = originalPath.substring(0, originalPath.lastIndexOf('/'));
			const baseName = file.filename.substring(0, file.filename.lastIndexOf('.'));

			for (const width of widths) {
				// Prevent generating variants larger than the original source image
				if (result.width && width > result.width) {
					continue;
				}

				const variantPath = `${dir}/${baseName}-${width}.webp`;
				const exists = await d.exists(variantPath);

				if (!exists) {
					try {
						// Generate the missing variant. We clone the instance to keep the original
						// metadata/buffer available for the next width in the loop.
						const resizedBuffer = await sharpInstance
							.clone()
							.resize({
								width,
								withoutEnlargement: true,
								kernel: sharp.kernel.lanczos3, // High-quality downsampling
							})
							.webp({
								quality: 100,
								smartSubsample: true, // Preserves fine details and color accuracy
								effort: 6, // Balanced compression effort
							})
							.toBuffer();

						await d.put(variantPath, resizedBuffer, {
							contentType: 'image/webp',
							visibility: 'public',
						});
					} catch (error) {
						console.error(
							`[ImageOptimizerService] Sharp failed for ${file.filename} (width: ${width}):`,
							error.message,
						);
						continue;
					}
				}

				// Store the public URL of the variant
				result.variants[width] = await d.getUrl(variantPath);
			}
		} catch (globalError) {
			console.error(`[ImageOptimizerService] Global error for ${file.filename}:`, globalError.message);
		}

		return result;
	}
}
