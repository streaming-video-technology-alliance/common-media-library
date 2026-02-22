---
name: code-review
description: Review code changes for performance, tree-shaking, bundle size, API ergonomics, and TypeScript best practices
disable-model-invocation: true
argument-hint: [files or branch]
context: fork
agent: code-reviewer
---

# Code Review

Review the code changes for performance, tree-shaking compatibility, bundle size impact, API ergonomics, TypeScript best practices, and project conventions.

## Changes to Review

!`git diff --stat`

!`git diff --cached --stat`

### Detailed diff

!`git diff`

!`git diff --cached`

### Recently changed files (last commit)

!`git diff HEAD~1 --stat`

## Arguments

$ARGUMENTS

## Instructions

1. If `$ARGUMENTS` specifies particular files, focus the review on those files. Otherwise, review all pending changes (staged + unstaged) shown above.
2. If there are no pending changes, review the most recent commit (`git diff HEAD~1`).
3. Read each changed file in full to understand context beyond the diff.
4. Check related files (types, tests, index.ts barrel exports) for completeness.
5. Apply all review criteria from your system prompt.
6. Produce the structured review report.
