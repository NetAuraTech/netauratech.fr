# Domain Actions

One action = one business operation. Lives in `src/{domain}/actions/{area}/{verb}_action.ts` — co-located with the domain's models, repositories and services, and imported through the domain alias (`#cms/actions/...`, `#identity/actions/...`, `#file/actions/...`). Owns a single use-case, delegates persistence to repositories, and exposes exactly one public method: `async execute(payload): Promise<T>`.

## Structure

```typescript
import { inject } from '@adonisjs/core';
import type File from '#file/models/file';
import { FileRepository } from '#file/repositories/file_repository';
import { LogService } from '#log/services/log_service';
import { withTransaction } from '#core/services/with_transaction';

interface CreateSomethingPayload {
	name: string;
	userId: number;
}

/**
 * One-line summary of what the action does.
 *
 * Optional second paragraph for non-obvious behavior, invariants,
 * or why a particular approach was taken.
 */
@inject()
export class CreateSomethingAction {
	constructor(
		protected repository: FileRepository,
		protected logService: LogService,
	) {}

	/**
	 * Execute the operation.
	 *
	 * @param payload - Description of the payload fields.
	 * @returns What is returned, including null/undefined semantics.
	 * @throws {TypedException} When and why.
	 *
	 * @example
	 * const result = await createSomethingAction.execute({ name: 'test', userId: 1 })
	 */
	async execute(payload: CreateSomethingPayload): Promise<File> {
		// 1. validate / check invariants, throw typed exception if violated
		// 2. delegate persistence to this.repository
		// 3. this.logService.logBusiness/logAuth/logSecurity(event, { userId }, metadata?)
		// 4. return a model, primitive, or void — never an HTTP response
	}
}
```

## Conventions

- **Single method**: Each action has exactly one public `execute(payload)` method. No additional public methods.
- **Payload contract**: A single typed object parameter named `<ActionName>Payload`, colocated in the same file. No variadic or positional arguments.
- **Constructor injection**: Use `@inject()` decorator and constructor injection for repositories and services. Prefer `protected` modifier on injected dependencies.
- **Return types**: Model instance, primitive, or `void`. Never HTTP responses or Inertia payloads.
- **Error handling**: Typed exceptions from `src/{domain}/exceptions/` (or `src/core/exceptions/` for cross-domain ones) or coded errors with `{ code: 'E_...' }`.
- **Logging**: Call LogService on meaningful mutations per `docs/agents/logging.md`; not on reads.

## Action Variants

| Variant                 | Trait                                                                                | Example                                                  |
| ----------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| **Standard action**     | Mutates state, orchestrates repos                                                    | `CreateUserAction`, `UploadFileAction`                   |
| **Read-only action**    | Queries only, no mutation                                                            | `ListUsersAction`, `FindPageBySlugAction`                |
| **Mail-sending action** | Sends mail directly through the mail client (spec-driven token mails — no event bus) | `SendEmailVerificationAction`, `SendPasswordResetAction` |

## Transactions

Mutating actions that touch multiple repositories or perform multi-step operations should wrap their work in `withTransaction()`. Read-only actions never use transactions.

```typescript
import { withTransaction } from '#core/services/with_transaction'

async execute(payload: CreatePagePayload): Promise<Page> {
  return withTransaction(async () => {
    const page = await this.pageRepository.create(pageData)
    await this.translationRepository.create(translationData)
    return this.pageRepository.findByIdOrFail(page.id)
  })
}
```

The `withTransaction()` utility starts a Lucid database transaction and binds it to the async-local `transactionContext`. All repository methods called inside the callback automatically use the transaction without explicit parameter threading.

## Naming

- File: `<verb>_<noun>_action.ts` — e.g., `create_user_action.ts`, `list_pages_action.ts`
- Class: PascalCase version of the file name — e.g., `CreateUserAction`, `ListPagesAction`
- Payload interface: `<ClassName>Payload` — e.g., `CreateUserPayload`, `ListPagesPayload`

## Dependencies

- **Actions depend on repositories** for data persistence.
- **Actions may depend on infrastructure services** when needed (StorageService, CacheService, ImageOptimizerService).
- **Actions may depend on domain services** — when a use case's logic is owned by a service (or shared by several entry points), the action stays a leaf and delegates its single `execute()` to the owning service.
- **Actions never call other actions** — shared logic is inlined or extracted to repository/helper/service methods. Actions are leaf nodes.
- **Services call actions in exactly one documented case** — resolving the recipient's locale for mail dispatch: a per-domain mail service may call the account domain's preferences leaf action (`TokenMailService` and `EmailChangeMailService` → `GetPreferencesAction`), because the recipient's preferences live in the account domain and the resolved locale must stay domain-side of the kernel mail service. No other service→action edge is allowed — any other shared logic belongs in a service or a repository.
- **Actions import LogService** for audit logging of business events.

## Directory Structure

Every non-CMS domain is co-located in its `src/{domain}/` business module; mirror the domain areas used by services and repositories:

```
src/
  auth/actions/          # session, email_verification, invitation, password, social, token
  account/actions/       # account, preferences, profile
  core/actions/          # cross-cutting operations (dashboard stats, robots.txt)
  file/actions/          # file, file_folder
  identity/actions/      # user, role, permission
  log/actions/           # log
  backup/actions/        # backup
```

> **(full flavor)** CMS actions (page, template) live under `src/cms/actions/{page,template}/`.

## Documentation

See `docs/agents/jsdoc.md` for JSDoc conventions on action classes and methods. Every exported action class and its `execute()` method must have JSDoc.
