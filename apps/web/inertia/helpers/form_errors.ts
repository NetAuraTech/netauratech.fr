import type { ErrorValue } from '@inertiajs/core';

/**
 * An errors map that tolerates fields absent from the route's declared body.
 *
 * Every value is an {@link ErrorValue} (a `string` in this app), so widening
 * to a free-form string index loses no meaningful precision.
 */
export type LooseFormErrors = Record<string, ErrorValue | undefined>;

/**
 * Widens Inertia v5's strictly-typed form `errors` map so fields the route
 * body does not model remain readable.
 *
 * The v5 `Form` types `errors` from the route's declared body. Two kinds of
 * submitted fields are legitimately absent from that body while still being
 * returned as errors:
 *
 * - VineJS `.confirmed()` confirmation fields (e.g. `password_confirmation`),
 *   which `InferInput` does not model.
 * - Fields the route-registry codegen does not yet infer for some routes.
 *
 * @param errors - The strictly-typed `errors` object from the Form render prop.
 * @returns The same object, typed as a {@link LooseFormErrors} map.
 *
 * @example
 * <Form action={urlFor('auth.register.execute')}>
 *   {(({ errors: strict, processing }) => {
 *     const errors = toLooseErrors(strict)
 *     return (
 *       <Field
 *         name="password_confirmation"
 *         errorMessage={errors.password_confirmation}
 *       />
 *     )
 *   })}
 * </Form>
 */
export function toLooseErrors(errors: object): LooseFormErrors {
	return errors as LooseFormErrors;
}
