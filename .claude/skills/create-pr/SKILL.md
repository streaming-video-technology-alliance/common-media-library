---
name: create-pr
description: Validate tests and docs, then create a GitHub PR with conventional commit formatting
disable-model-invocation: true
argument-hint: [base branch]
---

# Create Pull Request

Validate that tests and documentation pass, then create a well-formatted GitHub PR for the current branch.

## Context

**Current branch:**

!`git branch --show-current`

**Repository:**

!`git remote get-url origin 2>&1`

**Commits on this branch (compared with main):**

!`git log --oneline main..HEAD 2>&1 || git log --oneline origin/main..HEAD 2>&1 || echo "Could not determine commits"`

**Changed files (compared with main):**

!`git diff --stat main..HEAD 2>&1 || git diff --stat origin/main..HEAD 2>&1 || echo "Could not determine changes"`

**Existing open PR for this branch:**

!`gh pr view --json number,title,url,state 2>&1 || echo "NO_EXISTING_PR"`

## Arguments

$ARGUMENTS

If `$ARGUMENTS` specifies a base branch, use that instead of the default branch.

## Workflow

Follow these steps in order.

### Step 0: Pre-flight checks

- Verify the current branch is NOT `main`. If it is, stop and tell the user to create a feature branch first.
- If a PR already exists for this branch, inform the user and ask whether to update the existing PR description or stop.
- Ensure all changes are committed. If not, inform the user and stop.
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

- **Plan files check**: plan files under `plans/` are working artifacts and never merge to `main` (see `AGENTS.md`). List the plan files that the branch adds or changes:

```bash
git diff --name-only --diff-filter=ACMR main...HEAD -- plans/
```

If the base branch is `main` and the command prints a file, stop. Tell the user to delete the plan files from the branch and to record unfinished work as GitHub issues. If the base branch is not `main`, remind the user that the plan files must be deleted before the branch merges to `main`.

### Step 1: Identify affected packages

Examine the commit history and changed files to find which `libs/*` packages changed. That set decides the scopes for the PR title and which documentation errors block the PR in Step 3.

### Step 2: Run the full validation

Run the same command as the PR checks. It runs lint, builds every package, runs the typecheck, and runs the tests of every package:

```bash
npm test
```

If the command fails, report the error and stop.

### Step 3: Build and validate documentation

Build the documentation to catch TSDoc errors, broken `{@includeCode}` references, and missing documentation:

```bash
npm run build -w docs
```

Review the output for warnings and errors. If there are documentation errors related to the changed packages, report them and stop.

### Step 4: Find related GitHub issues

Search for related open issues in the repository:

```bash
gh issue list --state open --json number,title --limit 50
```

Also check the commit messages and branch name for issue references, such as `#123`, `issue-123`, or `fixes-123`.

Present the possibly related issues to the user. Ask which ones, if any, the PR should reference.

### Step 5: Draft the PR title and description

#### Title Format

Follow the Conventional Commits format. The title must be under 70 characters.

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

**Scope:** The package name without the `libs/` prefix, such as `cmcd`, `iso-bmff`, or `utils`. If several packages are affected, use the primary package or omit the scope.

**Examples:**
- `feat(cmcd): add CmcdReporter class`
- `fix(iso-bmff): handle non-zero byteOffset in parsePsshList`
- `refactor(utils): rename RequestType to ResponseType`
- `feat: add throughput measurement library`

#### Description Format

Fill in the repository template, `.github/PULL_REQUEST_TEMPLATE.md`. Keep its headings, and replace its instructions with the content they ask for.

- Under `## Description`, describe the change. Add a `### Test plan` with the commands from Steps 2 and 3 and their results.
- Reference only the issues that the user confirmed in Step 4. If there are none, omit the references.
- In `## Requirements Checklist`, check each item that the branch satisfies. If an item does not apply, check it and give the reason in parentheses.

### Step 6: Present for approval

Show the user the complete PR title and description. Ask for approval or revisions. The user may:
- Approve as-is
- Modify the title, description, or issue references
- Request changes to the scope or type

**Do NOT create the PR until the user explicitly approves.**

### Step 7: Push and create the PR

1. Push the branch to the remote:

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
- The description should explain **why** the changes were made, not only which files changed.
- Always push with `-u` to configure tracking.
- **Every commit must have DCO sign-off.** Always use `git commit -s` and include a `Co-Authored-By: <agent-name> <model> <noreply@anthropic.com>` trailer in the message body, as `AGENTS.md` requires. If you fix issues found during validation (Steps 2 and 3), commit the fixes with these requirements before you proceed.
