This package is the shared React design system consumed by the `@foundry/web` app.

## Package Expectations

- Run package-specific scripts from the repository root with `npm run <script> --workspace @foundry/design-system`.
- The package is **source-only**: it ships no build output. Consumers add it as a workspace dependency and their bundler compiles it from source. Keep the `exports` map as the public API — one subpath per public component plus `./tokens`.
- Keep reusable React components in the existing `src/atoms`, `src/molecules`, and `src/organisms` structure, one folder per component.
- `tailwind-variants` is the styling primitive: one `tv()` call per component, typed variant props, built-in `className` merging.
- Presentation tokens (font-size scale, paragraph variants/spacing) live in `src/tokens.ts` as the package's type surface. Relocate new shared presentation types here rather than leaving them in the app.
- **The package must never import from the app** (no `#*` aliases, no `apps/` or `tooling/` paths). This is enforced by a repo-wide lint boundary rule.
- Storybook is a package devDependency and runs locally only: `npm run storybook --workspace @foundry/design-system`. There is no root script and no CI job for it.
