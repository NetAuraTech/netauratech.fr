import { useMemo, type MouseEvent } from 'react';
import { cn, tv } from 'tailwind-variants';
import { NavLink } from '../../atoms/nav_link/nav_link';

/**
 * Pagination metadata returned by a paginated query.
 *
 * All values are 1-based (first page = `1`).
 */
export type PaginationMetadata = {
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

/** Active filter key/value pairs carried alongside page navigation. */
export type PaginationFilters = {
	[key: string]: string | number;
};

const pagination = tv({
	base: 'flex flex-wrap items-center justify-between gap-4 px-1',
});

interface PaginationProps {
	/** Pagination metadata (current page, last page, total, etc.). */
	metadata: PaginationMetadata;
	/**
	 * Builds the resolved URL of a given page number. The caller builds it
	 * (e.g. with a typed `urlFor()`, merging the active `filters` into the
	 * query string) — the component never resolves routes.
	 *
	 * Omit it for client-side-only paging (no route navigation): pass
	 * `onClick` instead and every page link resolves to a no-op `#` href that
	 * `onClick` intercepts.
	 */
	buildHref?: (page: number) => string;
	/**
	 * Maximum number of page buttons to show in the middle window before
	 * collapsing into ellipses. Defaults to `5`.
	 */
	showPages?: number;
	/**
	 * Active filter key/value pairs forwarded to `onClick`. Ensures that
	 * navigating between pages preserves the current search and filter state.
	 */
	filters?: PaginationFilters;
	/**
	 * Client-side paging handler. Receives the active `filters` merged with
	 * the target `page`. Used instead of `buildHref` when paging does not
	 * navigate the route.
	 */
	onClick?: (value: PaginationFilters) => void;
	/**
	 * Formats the results summary line (e.g. "Showing 1 to 20 of 84
	 * results"). The resolved string is injected by the caller (e.g. through
	 * the app's translation hook) — the component performs no i18n of its
	 * own. Omit it to hide the summary.
	 */
	summaryText?: (start: number, end: number, total: number) => string;
	/** Accessible title of the previous-page button (e.g. a translated "Previous"). */
	previousTitle?: string;
	/** Accessible title of the next-page button (e.g. a translated "Next"). */
	nextTitle?: string;
	/** Additional Tailwind classes. */
	className?: string;
}

type PageItem = number | '...';

/**
 * Accessible pagination control.
 *
 * Renders an optional results summary and a row of page navigation links.
 * The page window is computed with `useMemo` and collapses distant pages
 * into `…` ellipses, always keeping page 1 and the last page visible.
 *
 * Page links are built as `<NavLink variant="pagination">` from the injected
 * `buildHref` function, or intercepted by `onClick` for client-side paging.
 * The previous (`«`) and next (`»`) arrows are disabled when already at the
 * first or last page respectively.
 *
 * The component is 100% props/children: the summary line and the arrow
 * titles are injected by the caller as resolved strings.
 *
 * @example
 * <Pagination
 *   metadata={users.metadata}
 *   filters={{ search: 'alice' }}
 *   buildHref={(page) => urlFor('admin.identity.users.render', undefined, { qs: { search: 'alice', page } })}
 *   summaryText={(start, end, total) => t('pagination.showing', { start, end, total })}
 *   previousTitle={t('pagination.previous')}
 *   nextTitle={t('pagination.next')}
 * />
 */
export function Pagination(props: PaginationProps) {
	const {
		metadata,
		showPages = 5,
		filters,
		onClick,
		buildHref,
		summaryText,
		previousTitle,
		nextTitle,
		className,
	} = props;
	const hrefFor = (page: number) => (buildHref ? buildHref(page) : '#');

	const { lastPage, perPage, currentPage, total } = metadata;

	const start = (currentPage - 1) * perPage + 1;
	const end = Math.min(currentPage * perPage, total);

	const pages = useMemo<PageItem[]>(() => {
		if (lastPage <= showPages + 2) {
			return Array.from({ length: lastPage }, (_, i) => i + 1);
		}

		let s = Math.max(2, currentPage - 1);
		let e = Math.min(lastPage - 1, currentPage + 1);

		if (currentPage <= 3) e = Math.min(4, lastPage - 1);
		if (currentPage >= lastPage - 2) s = Math.max(lastPage - 3, 2);

		const middle: PageItem[] = [];
		if (s > 2) middle.push('...');
		for (let i = s; i <= e; i++) middle.push(i);
		if (e < lastPage - 1) middle.push('...');

		return [1, ...middle, lastPage];
	}, [currentPage, lastPage, showPages]);

	const handleClick = (e: MouseEvent, page: number) => {
		e.preventDefault();

		if (onClick) {
			onClick({ ...filters, page });
		}
	};

	return (
		<div className={cn(pagination(), className)}>
			{summaryText && <p className="text-sm text-ink-muted tabular-nums">{summaryText(start, end, total)}</p>}

			<nav aria-label="Pagination" className="flex items-center gap-1">
				<NavLink
					variant="pagination"
					label="«"
					href={hrefFor(currentPage - 1)}
					title={previousTitle}
					disabled={currentPage === 1}
					onClick={(e: MouseEvent) => handleClick(e, currentPage - 1)}
				/>
				{pages.map((page, index) =>
					page === '...' ? (
						<span
							key={`ellipsis-${index}`}
							className="grid size-8 place-items-center text-sm text-ink-muted select-none"
						>
							…
						</span>
					) : (
						<NavLink
							key={`page-${page}`}
							variant="pagination"
							label={`${page}`}
							href={hrefFor(page)}
							onClick={onClick ? (e: MouseEvent) => handleClick(e, page) : undefined}
							isActive={currentPage === page}
						/>
					),
				)}
				<NavLink
					variant="pagination"
					label="»"
					href={hrefFor(currentPage + 1)}
					title={nextTitle}
					disabled={currentPage === lastPage}
					onClick={(e: MouseEvent) => handleClick(e, currentPage + 1)}
				/>
			</nav>
		</div>
	);
}
