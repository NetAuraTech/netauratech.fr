/**
 * Generic wrapper for a paginated server response.
 *
 * @template T - The type of each item in the `data` array.
 *
 * @example
 * type UserList = Paginated<Data.Identity.User>
 * // { data: Data.Identity.User[]; metadata: MetaData }
 */
export type Paginated<T> = {
	/** The current page's items. */
	data: T[];
	/** Pagination metadata used to render controls and compute offsets. */
	metadata: MetaData;
};

/**
 * Pagination metadata returned alongside a paginated response.
 *
 * All values are 1-based (first page = `1`).
 */
export type MetaData = {
	/** Total number of items across all pages. */
	total: number;
	/** Number of items per page. */
	perPage: number;
	/** The currently active page number. */
	currentPage: number;
	/** The last available page number. */
	lastPage: number;
	/** The first available page number (always `1`). */
	firstPage: number;
};
