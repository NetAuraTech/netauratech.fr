import { type HttpContext } from '@adonisjs/core/http';

export interface FindOptions {
	limit?: number;
	offset?: number;
	orderBy?: string;
	orderDirection?: 'asc' | 'desc';
}

export interface ThrottleOptions {
	max: number;
	window: number;
	key_generator?: (ctx: HttpContext) => string;
}
