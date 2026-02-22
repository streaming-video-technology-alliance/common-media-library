---
name: pr-feedback
description: Fetch unresolved PR review comments, validate them, plan fixes, implement, push, and resolve threads
disable-model-invocation: true
argument-hint: [PR number]
---

# Resolve PR Review Feedback

Fetch all unresolved review comments from the GitHub PR associated with the current branch, evaluate their validity, plan fixes, and implement them after user approval.

## Context

**Current branch:**

!`git branch --show-current`

**Repository:**

!`git remote get-url origin 2>&1`

**PR info:**

!`gh pr view --json number,title,url,headRefName,baseRefName 2>&1 || echo "NO_PR_FOUND"`

## Arguments

$ARGUMENTS

## Workflow

Follow these steps in order. Do NOT skip steps or proceed without completing the previous step.

### Step 1: Identify the PR

- If `$ARGUMENTS` contains a PR number, use that.
- Otherwise, use the PR info injected above.
- If no PR is found, tell the user and stop.
- Store the PR number, base branch, and repo owner/name for later use.

### Step 2: Fetch unresolved review threads

Use the GitHub GraphQL API to fetch all unresolved review threads:

```bash
gh api graphql -f query='
query($owner: String!, $repo: String!, $pr: Int!) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $pr) {
      reviewThreads(first: 100) {
        nodes {
          id
          isResolved
          isOutdated
          path
          line
          startLine
          diffSide
          comments(first: 20) {
            nodes {
              id
              body
              author { login }
              createdAt
            }
          }
        }
      }
    }
  }
}' -f owner='OWNER' -f repo='REPO' -F pr=NUMBER
```

Replace `OWNER`, `REPO`, and `NUMBER` with the actual values.

Filter the results to only include threads where `isResolved` is `false`. Exclude threads where `isOutdated` is `true` (the code they reference has already been changed) unless the comment raises a concern that is still relevant.

If there are no unresolved threads, tell the user and stop.

### Step 3: Analyze and triage comments

For each unresolved thread:

1. **Read the file and line range** referenced by the comment to understand the current code.
2. **Read the full comment thread** (there may be replies with additional context or clarification).
3. **Classify the comment** as one of:
   - **Valid concern**: The reviewer raises a legitimate issue that should be fixed.
   - **Already addressed**: The code has already been changed to address this (common with outdated threads that weren't marked outdated).
   - **Disagreement**: The reviewer's suggestion would conflict with project conventions, spec compliance, or would degrade the code. These need a reply explaining why, not a code change.
   - **Question**: The reviewer is asking for clarification, not requesting a change. These need a reply, not a code change.
   - **Nitpick with merit**: Minor style or naming suggestion that is reasonable to adopt.

Present a summary table to the user:

```
| # | File:Line | Category | Reviewer | Summary | Proposed Action |
|---|-----------|----------|----------|---------|-----------------|
| 1 | src/foo.ts:42 | Valid concern | @user | Missing null check | Fix: add guard clause |
| 2 | src/bar.ts:10 | Disagreement | @user | Suggests interface over type | Reply: project uses type keyword |
```

### Step 4: Plan the changes

Enter plan mode to design the implementation:

1. For each **valid concern** and **nitpick with merit**, plan the specific code change.
2. For each **disagreement** and **question**, draft a reply.
3. For each **already addressed** thread, note that it will be resolved with a brief explanation.
4. Consider whether the changes require:
   - Rebuilding the package (`npm run build -w libs/<workspace>`)
   - Running tests (`npm test -w libs/<workspace>`)
   - Updating the CHANGELOG
   - A version bump
5. Group related changes together logically.

Present the plan to the user and wait for approval. The user may:
- Approve the plan as-is
- Ask you to skip certain items
- Modify the approach for specific comments
- Add additional context you should consider

**Do NOT proceed to implementation until the user explicitly approves.**

### Step 5: Implement the changes

After approval:

1. Make the code changes as planned.
2. Build the affected packages: `npm run build -w libs/<workspace>`
3. Run tests for the affected packages: `npm test -w libs/<workspace>`
4. Run the typechecker: `npm run typecheck`
5. If tests or typecheck fail, fix the issues before continuing.
6. If a version bump or CHANGELOG update is needed, apply it.

### Step 6: Commit and push

1. Stage the changed files (be specific, don't use `git add -A`).
2. Create a commit with an appropriate conventional commit message and DCO sign-off (`git commit -s`).
3. Push to the current branch: `git push`

**Ask the user for confirmation before pushing.**

### Step 7: Resolve review threads

For each addressed thread, reply and resolve:

1. **Reply to the thread** explaining what was done:

```bash
gh api graphql -f query='
mutation($threadId: ID!, $body: String!) {
  addPullRequestReviewThreadReply(input: {pullRequestReviewThreadId: $threadId, body: $body}) {
    comment { id }
  }
}' -f threadId='THREAD_ID' -f body='MESSAGE'
```

2. **Resolve the thread**:

```bash
gh api graphql -f query='
mutation($threadId: ID!) {
  resolveReviewThread(input: {threadId: $threadId}) {
    thread { isResolved }
  }
}' -f threadId='THREAD_ID'
```

Reply guidelines:
- For **valid concerns** that were fixed: briefly describe the fix (e.g., "Added null guard at line 42. Good catch!")
- For **disagreements**: explain the reasoning respectfully, referencing project conventions or spec requirements. Do NOT resolve these -- leave them for the reviewer to resolve after reading the reply.
- For **questions**: answer the question clearly. Do NOT resolve these -- let the reviewer resolve after reading.
- For **already addressed**: note that the code has been updated and the concern is no longer applicable.
- For **nitpicks** that were adopted: acknowledge and note the change.

### Step 8: Summary

Present a final summary:
- Number of threads addressed
- Number of threads replied to but left open (disagreements, questions)
- List of files changed
- Commit hash
- Link to the PR

## Important Notes

- Always read the full file context around a review comment, not just the referenced line.
- Review comments may reference code that has changed since the comment was made. Always check the current state of the code.
- Never resolve a thread that involves a disagreement or question -- only the original reviewer should resolve those.
- If a review comment requires a change that conflicts with another review comment, flag this to the user.
- Follow all project conventions from CLAUDE.md and the code-quality rules when implementing fixes.
- The `code-reviewer` agent's criteria (tree-shaking, performance, API design, TypeScript, docs) apply to all code changes made here too.
