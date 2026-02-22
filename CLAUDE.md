# Claude Code Configuration

General project instructions are in [AGENTS.md](AGENTS.md), which is auto-loaded by Claude Code.

## Skills

The following skills are available via `/command`:

- `/create-pr [base branch]` - Validate tests and docs, then create a GitHub PR with conventional commit formatting
- `/code-review [files or branch]` - Review code changes for performance, tree-shaking, bundle size, API ergonomics, and TypeScript best practices
- `/pr-feedback [PR number]` - Fetch unresolved PR review comments, validate them, plan fixes, implement, push, and resolve threads

## Agents

- **code-reviewer** - Specialized agent for code review, used by the `/code-review` skill

## Rules

- `.claude/rules/code-quality.md` - Automatically applied when editing files in `libs/**/*.ts`
