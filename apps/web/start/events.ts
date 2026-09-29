/*
|--------------------------------------------------------------------------
| Events
|--------------------------------------------------------------------------
|
| The `inertia` flavor has no event-driven flows: the auth and account mail
| flows deliver through the mail client directly (no event bus), and the
| CMS contact-form listener is pruned. This file intentionally registers
| nothing; the empty export keeps it a module so the dynamic import in
| adonisrc.ts typechecks under the client tsconfig.
|
*/

export {};
