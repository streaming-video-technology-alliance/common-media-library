---
paths:
  - "libs/**/*.ts"
---

# Code Quality Standards

When writing or modifying code in this project, always apply these standards. This is a library consumed by video players where bundle size and tree-shaking directly impact end users.

## Tree-Shaking

- Group related exports in a single file (e.g., a function and its options type, related constants). Keep unrelated exports in separate files to preserve tree-shaking granularity.
- Use `export type *` (not `export *`) in `index.ts` barrels for files that only contain types.
- No side effects at module scope (no code that executes on import).
- No default exports. Always use named exports.
- Never use the TypeScript `enum` keyword. Use the const enum pattern: individual `as const` exports + collector object + `ValueOf<typeof X>` type.

## Bundle Size

- Keep functions small and focused -- single responsibility.
- Avoid pulling in large dependencies for small tasks.
- Regex patterns used in repeatedly-called functions should be module-level constants.
- New code is fine as long as it tree-shakes cleanly; adopters should never pay for code they do not import.

## TypeScript

- Use `type` not `interface` for type definitions.
- Use `export type` for pure type exports and `export type *` in barrels for type-only files.
- Use bracket notation for index signature access (`obj['key']`).
- Use `as const` assertions for literal values.
- Avoid `any` -- prefer `unknown` with narrowing or generics.
- All code must be compatible with `isolatedDeclarations: true` and `verbatimModuleSyntax: true`.

## API Design

- Functions are verbs, types are nouns, constants are UPPER_SNAKE_CASE.
- Use options objects for 3+ optional parameters.
- Prefer `readonly` properties on types where mutation is not intended.
- New APIs must follow naming patterns of existing APIs in the same package.
- Prefer union/literal types over broad `string`/`number` for autocomplete and misuse prevention.
- Error messages must include the parameter name, expected value(s), and the value that was actually received.

## Documentation

- All exported members need TSDoc with `@public` tag.
- Public functions should have `@example` with `{@includeCode ../test/<file>.test.ts#example}`.
- Test files must include at least one `// #region example` block.

## Style

- No semicolons, single quotes, tabs for indentation.
- File extensions in imports (e.g., `'./foo.ts'`).
- Tests import from the package name, not relative paths.
