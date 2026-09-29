import { randomUUID } from 'node:crypto';
import { readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { inject } from '@adonisjs/core';
import { withTransaction } from '#core/services/with_transaction';
import FileTooLargeException from '#file/exceptions/file_too_large_exception';
import InvalidExtensionException from '#file/exceptions/invalid_extension_exception';
import { FileRepository } from '#file/repositories/file_repository';
import { StorageService } from '#file/services/storage_service';
import { LogService } from '#log/services/log_service';
import env from '#start/env';
import type CmsFile from '#file/models/file';
import type { MultipartFile } from '@adonisjs/core/types/bodyparser';

interface UploadFilePayload {
	file: MultipartFile;
	folderId?: number | null;
	uploadedBy?: number | null;
}

/**
 * Upload a file to storage and create its metadata record.
 */
@inject()
export class UploadFileAction {
	constructor(
		protected fileRepository: FileRepository,
		protected storageService: StorageService,
		protected logService: LogService,
	) {}

	/**
	 * Execute file upload.
	 *
	 * @param payload - Multipart file and optional folder/user context.
	 * @returns The newly created {@link CmsFile} record.
	 * @throws {FileTooLargeException} When the file exceeds the size limit.
	 * @throws {InvalidExtensionException} When the file extension is not allowed.
	 */
	async execute(payload: UploadFilePayload): Promise<CmsFile> {
		const { file } = payload;
		const maxSizeBytes = env.get('MAX_UPLOAD_SIZE', 10) * 1024 * 1024;
		const allowedExtensions = env
			.get('CMS_ALLOWED_EXTENSIONS', 'jpg,jpeg,png,gif,webp,pdf,svg,mp4,mp3,zip')
			.split(',')
			.map((e: string) => e.trim().toLowerCase());
		const ext = file.extname?.toLowerCase() ?? '';

		if (file.size > maxSizeBytes) throw new FileTooLargeException();
		if (!allowedExtensions.includes(ext)) throw new InvalidExtensionException(ext);

		const disk = this.storageService.disk();
		const filename = `${randomUUID()}.${ext}`;
		const tmpPath = path.join(process.cwd(), 'tmp', filename);
		const storagePath = this.storageService.buildPath(`files/${filename}`);

		await file.move(path.join(process.cwd(), 'tmp'), { name: filename });
		const contents = await readFile(tmpPath);

		await this.storageService.upload(contents, storagePath, disk, {
			contentType: file.type ? `${file.type}/${file.subtype}` : undefined,
		});
		await unlink(tmpPath).catch(() => {});

		const record = await withTransaction(async () => {
			return this.fileRepository.create({
				filename,
				originalName: file.clientName,
				mimeType: file.type ? `${file.type}/${file.subtype}` : 'application/octet-stream',
				extension: ext,
				size: file.size,
				path: storagePath,
				disk,
				folderId: payload.folderId,
				uploadedBy: payload.uploadedBy ?? null,
			});
		});

		this.logService.logBusiness(
			'file.uploaded',
			{ userId: payload.uploadedBy ?? undefined },
			{ fileId: record.id, filename: record.originalName, disk },
		);
		return record;
	}
}
