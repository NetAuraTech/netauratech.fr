import { type LucidModel, type ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import { DEFAULT_PAGINATION, type PaginationFilters } from '#types/pagination'

/**
 * Infers the Lucid query builder type for a given model by leveraging
 * TypeScript's `ReturnType` utility, avoiding any direct dependency on
 * Lucid's internal unexported types.
 *
 * @typeParam Model - A class extending {@link LucidModel}.
 */
type QueryBuilderOf<Model extends LucidModel> = ModelQueryBuilderContract<
  Model,
  InstanceType<Model>
>

/**
 * Describes a single filter that is conditionally applied to a query
 * based on whether its associated `value` is truthy.
 *
 * This pattern replaces scattered `if (filters.x)` blocks inside each
 * service method with a declarative list of filters that the pagination
 * service evaluates automatically.
 *
 * @typeParam Model - A class extending {@link LucidModel}, used to type
 *                   the query builder passed to `apply`.
 *
 * @example
 * ```ts
 * const filter: ConditionalFilter<typeof User> = {
 *   value: filters.search,
 *   apply: (q) => q.whereILike('email', `%${filters.search}%`),
 * }
 * ```
 */
export interface ConditionalFilter<Model extends LucidModel> {
  /**
   * The runtime value that determines whether this filter is active.
   * When falsy (`undefined`, `null`, `''`, `0`, `false`), the filter
   * is skipped entirely and `apply` is never called.
   */
  value: unknown

  /**
   * Mutates the query builder to apply the filter constraint.
   * Called only when {@link ConditionalFilter.value} is truthy.
   *
   * @param query - The active Lucid query builder for the model.
   */
  apply: (query: QueryBuilderOf<Model>) => void
}

/**
 * Options accepted by {@link PaginationService.paginate}.
 *
 * @typeParam Model - A class extending {@link LucidModel}. TypeScript infers
 *                   this automatically from the `query` parameter, so you
 *                   rarely need to provide it explicitly.
 */
export interface PaginateOptions<Model extends LucidModel> {
  /**
   * The base Lucid query builder, already configured with all static
   * clauses: `preload`, `withCount`, `join`, `orderBy`, etc.
   *
   * Only conditional (filter-driven) clauses should be left out here;
   * they belong in {@link PaginateOptions.conditionalFilters} instead.
   *
   * @example
   * ```ts
   * query: User.query()
   *   .preload('role')
   *   .orderBy('created_at', 'desc')
   * ```
   */
  query: QueryBuilderOf<Model>

  /**
   * The raw filter object from the request, containing at least the
   * optional `page` and `perPage` fields.
   *
   * Any extra properties (e.g. `search`, `role`) are used exclusively
   * inside {@link PaginateOptions.conditionalFilters} and are not read
   * directly by the pagination service.
   */
  filters: PaginationFilters

  /**
   * An optional list of {@link ConditionalFilter} entries evaluated in
   * declaration order. Each filter is applied to the query only when its
   * `value` is truthy, keeping service methods free of repetitive `if`
   * blocks.
   *
   * @default []
   *
   * @example
   * ```ts
   * conditionalFilters: [
   *   {
   *     value: filters.search,
   *     apply: (q) =>
   *       q.where((builder) => {
   *         builder
   *           .whereILike('email', `%${filters.search}%`)
   *           .orWhereILike('username', `%${filters.search}%`)
   *       }),
   *   },
   *   {
   *     value: filters.role,
   *     apply: (q) => q.where('role_id', filters.role),
   *   },
   * ]
   * ```
   */
  conditionalFilters?: ConditionalFilter<Model>[]
}

/**
 * Generic, model-agnostic pagination service for AdonisJS / Lucid.
 *
 * Centralises the recurring pagination boilerplate — resolving page/perPage
 * defaults and evaluating conditional filters — so individual service methods
 * only need to declare *what* to query, not *how* to paginate it.
 *
 * @example Basic usage in a service method
 * ```ts
 * async list(filters: UserListFilters) {
 *   return PaginationService.paginate({
 *     query: User.query()
 *       .preload('role')
 *       .orderBy('created_at', 'desc'),
 *     filters,
 *     conditionalFilters: [
 *       {
 *         value: filters.search,
 *         apply: (q) =>
 *           q.where((builder) => {
 *             builder
 *               .whereILike('email', `%${filters.search}%`)
 *               .orWhereILike('username', `%${filters.search}%`)
 *           }),
 *       },
 *       {
 *         value: filters.role,
 *         apply: (q) => q.where('role_id', filters.role),
 *       },
 *     ],
 *   })
 * }
 * ```
 */
export class PaginationService {
  /**
   * Applies conditional filters to the provided query builder and executes
   * it as a paginated query.
   *
   * **Execution order:**
   * 1. Resolve `page` and `perPage` from `filters`, falling back to
   *    {@link DEFAULT_PAGINATION} for any missing value.
   * 2. Iterate over `conditionalFilters` in declaration order; call
   *    `filter.apply(query)` for every entry whose `value` is truthy.
   * 3. Execute `query.paginate(page, perPage)` and return the result.
   *
   * @typeParam Model - Inferred from `query`; no need to provide explicitly.
   *
   * @param options - See {@link PaginateOptions}.
   * @returns A promise resolving to a `ModelPaginatorContract<InstanceType<Model>>`,
   *          correctly typed with the model instance — the same object returned
   *          by a raw `.paginate()` call, fully serialisable via `.toJSON()` or
   *          `.serialize()`.
   */
  paginate<Model extends LucidModel>({
    query,
    filters,
    conditionalFilters = [],
  }: PaginateOptions<Model>) {
    const page = filters.page || DEFAULT_PAGINATION.page
    const perPage = filters.perPage || DEFAULT_PAGINATION.perPage

    for (const filter of conditionalFilters) {
      if (filter.value) {
        filter.apply(query)
      }
    }

    return query.paginate(page, perPage)
  }
}
