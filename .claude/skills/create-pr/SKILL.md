---
name: create-pr
description: Validate tests and docs, then create a GitHub PR with conventional commit formatting
disable-model-invocation: true
argument-hint: [base branch]
---

# Create Pull Request

Validate that all tests and documentation pass, then create a well-formatted GitHub PR for the current branch.

## Context

**Current branch:**

!`git branch --show-current`

**Repository:**

!`git remote get-url origin 2>&1`

**Commits on this branch (vs main):**

!`git log --oneline main..HEAD 2>&1 || git log --oneline origin/main..HEAD 2>&1 || echo "Could not determine commits"`

**Changed files (vs main):**

!`git diff --stat main..HEAD 2>&1 || git diff --stat origin/main..HEAD 2>&1 || echo "Could not determine changes"`

**Existing open PR for this branch:**

!`gh pr view --json number,title,url,state 2>&1 || echo "NO_EXISTING_PR"`

## Arguments

$ARGUMENTS

If `$ARGUMENTS` specifies a base branch, use that instead of the default branch.

## Workflow

Follow these steps in strict order. Do NOT skip ahead.

### Step 0: Pre-flight checks

- Verify the current branch is NOT `main`. If it is, stop and tell the user to create a feature branch first.
- If a PR already exists for this branch, inform the user and ask whether to update the existing PR description or stop.
- Ensure all changes are committed. If there are uncommitted changes, inform the user and stop.
- **DCO sign-off check**: Verify that every commit on this branch has a `Signed-off-by:` line:

```bash
git log main..HEAD --format="%h %s" --no-merges | while read hash rest; do
  if ! git log -1 --format="%b" "$hash" | grep -q "^Signed-off-by:"; then
    echo "MISSING DCO: $hash $rest"
  fi
done
```

If any commits are missing DCO sign-off, report them and stop. Instruct the user to fix with:
```bash
git rebase main --exec "git commit --amend --signoff --no-edit"
```
Do NOT create the PR until all commits have DCO sign-off.

### Step 1: Identify affected packages

Examine the commit history and changed files to determine which `libs/*` packages were modified. This determines which workspaces need building, testing, and which scopes to use in the PR title.

### Step 2: Build affected packages

Build each affected package:

```bash
npm run build -w libs/<package>
```

If a build fails, report the error and stop. Do NOT create the PR.

### Step 3: Run tests

Run tests for each affected package:

```bash
npm test -w libs/<package>
```

If any test fails, report the error and stop. Do NOT create the PR.

### Step 4: Run typecheck

```bash
npm run typecheck
```

If the typecheck fails on files within `libs/` (ignore pre-existing errors in `node_modules`), report the error and stop. Do NOT create the PR.

### Step 5: Build and validate documentation

Build the documentation to catch TSDoc errors, broken `{@includeCode}` references, and missing documentation:

```bash
npm run build -w docs
```

Review the output for warnings and errors. If there are documentation errors related to the changed packages, report them and stop. Do NOT create the PR.

### Step 6: Find related GitHub issues

Search for related open issues in the repository:

```bash
gh issue list --state open --json number,title --limit 50
```

Also check the commit messages and branch name for issue references (e.g., `#123`, `issue-123`, `fixes-123`).

Present any potentially related issues to the user and ask which (if any) should be referenced in the PR.

### Step 7: Draft the PR title and description

#### Title Format

Follow conventional commit format. The title must be under 70 characters.

**Pattern:** `<type>(<scope>): <short description>`

**Types:**
- `feat` - New feature or public API addition
- `fix` - Bug fix
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `docs` - Documentation only changes
- `test` - Adding or correcting tests
- `chore` - Maintenance, tooling, or dependency updates
- `build` - Changes that affect the build system
- `perf` - Performance improvement

**Scope:** The package name without the `libs/` prefix (e.g., `cmcd`, `iso-bmff`, `utils`). If multiple packages are affected, use the primary package or omit the scope.

**Examples:**
- `feat(cmcd): add CmcdReporter class`
- `fix(iso-bmff): handle non-zero byteOffset in parsePsshList`
- `refactor(utils): rename RequestType to ResponseType`
- `feat: add throughput measurement library`

#### Description Format

Use this template:

```markdown
## Summary

<1-4 bullet points describing what changed and why>

## Packages Changed

| Package | Version | Change Type |
|---------|---------|-------------|
| @svta/cml-<name> | x.x.x | feat/fix/etc |

## Test Plan

- [ ] <specific test scenarios that validate the changes>

Refs: <issue references>
```

**Refs footer rules:**
- Use `Fixes #N` if the PR fully resolves an issue (this auto-closes the issue on merge)
- Use `Refs #N` if the PR is related but does not fully resolve the issue
- Multiple references are comma-separated: `Refs: #12, #34, Fixes #56`
- Only include issue references confirmed by the user in Step 6
- Omit the `Refs:` line entirely if there are no related issues

### Step 8: Present for approval

Show the user the complete PR title and description. Ask for approval or revisions. The user may:
- Approve as-is
- Modify the title, description, or issue references
- Request changes to the scope or type

**Do NOT create the PR until the user explicitly approves.**

### Step 9: Push and create the PR

1. Ensure the branch is pushed to the remote:

```bash
git push -u origin <branch-name>
```

2. Create the PR:

```bash
gh pr create --base <base-branch> --title "<title>" --body "$(cat <<'EOF'
<description>
EOF
)"
```

3. Display the PR URL to the user.

## Important Notes

- Never create a PR with failing tests or documentation errors.
- The conventional commit type in the PR title should reflect the **primary** change, not every change.
- Keep the title under 70 characters. Use the description for details.
- The summary bullets should explain **why** the changes were made, not just what files changed.
- If builds are slow, only build packages that are directly affected by the changes and their dependents.
- Always push with `-u` to set up tracking if not already configured.
- **Every commit must have DCO sign-off.** Always use `git commit -s` and include `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>` in the message body. If you need to fix issues discovered during validation (Steps 2-5), commit the fixes with these requirements before proceeding.
