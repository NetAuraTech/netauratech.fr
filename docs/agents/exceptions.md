# Exceptions

Custom exceptions live in `src/{domain}/exceptions/{name}_exception.ts`, one class per error case — co-located with the business module that throws them, and imported through the domain alias (`#identity/exceptions/...`, `#file/exceptions/...`, `#cms/exceptions/...`). Built on AdonisJS's `Exception` base class with a project-specific `handle()` convention layered on top.

> **Kernel exceptions:** cross-domain exceptions shared by several business modules (`row_not_found`, `slug_exists`, `email_already_exists`) live under `src/core/exceptions/`, imported via `#core/exceptions/...`, next to the `BaseHttpException` base class they extend.
>
> **Global handler:** the exception handler itself is delivery-layer and lives in `app/core/exceptions/handler.ts` (wired in `start/kernel.ts`).

## Structure

```typescript
export default class SomethingWrongException extends Exception {
	static status = 409;
	static code = 'E_SOMETHING_WRONG';

	constructor(private detail: string) {
		super(`Human-readable default message with ${detail}.`, {
			status: SomethingWrongException.status,
			code: SomethingWrongException.code,
		});
	}

	async handle(error: this, ctx: HttpContext) {
		const { request, response, session, i18n } = ctx;
		const message = i18n.t(`exceptions.${error.code}`);

		if (request.wantsJSON()) {
			return response.status(error.status).send({
				error: {
					code: error.code,
					message,
					details: { detail: error.detail },
					...(app.inDev && { stack: error.stack }),
				},
			});
		}

		session.flash('error', message);
		return response.redirect().back();
	}
}
```

## Conventions

- `code` is always `E_SCREAMING_SNAKE_CASE`, unique across the app, and maps to a translation key at `exceptions.{code}` in every locale file.
- `status` is a plain HTTP status number matching the error's semantics (409 conflict, 404 not found, 401/403 auth, 422/413 validation, 429 rate limit).
- The constructor's `super()` message is a English fallback default — the actual user-facing message always comes from `i18n.t()` inside `handle()`, never from `error.message` directly.
- `handle()` always branches on `request.wantsJSON()`: JSON API clients get a structured `{ error: { code, message, details? } }` body; everything else gets a flash message + redirect back (or to a specific route when redirecting back doesn't make sense, e.g. `UnauthorizedException` → login page).
- Stack traces are only included in the JSON response when `app.inDev` is true — never leak stack traces in production responses.
- Constructor parameters needed for the message/details (e.g. `email`, `provider`, `slug`) are stored as `private` fields and surfaced via `details` in the JSON branch.
- One exception class per distinct error case — don't reuse a generic exception with a dynamic message for unrelated failures.
