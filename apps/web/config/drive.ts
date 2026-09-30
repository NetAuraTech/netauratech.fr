import app from '@adonisjs/core/services/app';
import { defineConfig, services } from '@adonisjs/drive';
import env from '#start/env';

const driveConfig = defineConfig({
	default: env.get('DRIVE_DISK'),

	/**
	 * The services object can be used to configure multiple file system
	 * services each using the same or a different driver.
	 */
	services: {
		fs: services.fs({
			location: app.makePath('storage'),
			serveFiles: true,
			routeBasePath: '/uploads',
			visibility: 'public',
		}),
		s3: services.s3({
			credentials: {
				accessKeyId: env.get('AWS_ACCESS_KEY_ID') || '',
				secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY') || '',
			},
			region: env.get('AWS_REGION'),
			bucket: env.get('S3_BUCKET') || '',
			visibility: 'public',
		}),
		r2: services.s3({
			credentials: {
				accessKeyId: env.get('R2_KEY') || '',
				secretAccessKey: env.get('R2_SECRET') || '',
			},
			region: 'auto',
			bucket: env.get('R2_BUCKET') || '',
			endpoint: env.get('R2_ENDPOINT'),
			cdnUrl: env.get('R2_PUBLIC_URL'),
			forcePathStyle: true,
			supportsACL: false,
			visibility: 'public',
		}),
		/**
		 * Private R2 disk for the backup system. Points to a dedicated bucket
		 * that must NOT be exposed through a public custom domain.
		 */
		'r2-backup': services.s3({
			credentials: {
				accessKeyId: env.get('R2_KEY') || '',
				secretAccessKey: env.get('R2_SECRET') || '',
			},
			region: 'auto',
			bucket: env.get('BACKUP_R2_BUCKET') || '',
			endpoint: env.get('R2_ENDPOINT'),
			forcePathStyle: true,
			supportsACL: false,
			visibility: 'private',
		}),
	},
});

export default driveConfig;

declare module '@adonisjs/drive/types' {
	export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}
