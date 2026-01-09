# Bash commands

- npm run build -w <workspace>: Build the a module
- npm run typecheck: Run the typechecker
- npm test -w <workspace>: Run the tests for a module

# Code style

- Use TypeScript strict mode.
- Use ES modules (import/export) syntax, not CommonJS (require)
- Destructure imports when possible (eg. import { foo } from 'bar')

# Workflow

- Be sure to typecheck when you’re done making a series of code changes
- Always run the typechecker against the entire project
- Prefer running building and testing single workspaces, and not the whole project, for performance
- Run build before running tests
- Always create tests for new members of a package's public API
- Always update the package's CHANGELOG.md when making changes

## Git Commit Guidelines

When creating commits:

- All commits must be signed off by the author (DCO).
- Follow the conventional commit format (e.g., `feat:`, `fix:`).
