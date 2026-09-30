@AGENTS.md

# Claude Code Configuration

Common Media Library is optimized for adoption by web video players. The top priorities are performance, tree-shakeability, developer experience, and documentation quality. General project instructions are in [AGENTS.md](AGENTS.md).

## Skills

The following skill is available as a slash command:

- `/create-pr [base branch]` - Validate tests and docs, then create a GitHub PR with conventional commit formatting

## Agents

- **code-reviewer** - Specialized agent for code review

## Rules

- `.claude/rules/code-quality.md` - Automatically applied when editing files in `libs/**/*.ts`
