---
name: pr-feedback
description: Fetch unresolved PR review comments, validate them, plan fixes, implement, push, and resolve threads
disable-model-invocation: true
argument-hint: [PR number]
---

# Resolve PR Review Feedback

Fetch all unresolved review comments from the GitHub PR for the current branch. Evaluate their validity, plan fixes, and implement them after user approval.

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

Use the GitHub GraphQL API to fetch all unresolved review threads.

**Important:** When run through the Bash tool, the shell consumes the `$` character in GraphQL variable declarations, even inside single quotes. Always write GraphQL queries to a temp file and use `-F query=@file`.

1. Write the query to a temp file:

```graphql
# /tmp/pr-threads.graphql
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
}
```

2. Execute with `-F query=@file`:

```bash
gh api graphql -F query=@/tmp/pr-threads.graphql -f owner='OWNER' -f repo='REPO' -F pr=NUMBER
```

Replace `OWNER`, `REPO`, and `NUMBER` with the actual values.

Filter the results to the threads where `isResolved` is `false`. Exclude threads where `isOutdated` is `true`, because their code has changed, unless the comment is still relevant.

If there are no unresolved threads, tell the user and stop.

### Step 3: Analyze and triage comments

For each unresolved thread:

1. **Read the file and line range** referenced by the comment to understand the current code.
2. **Read the full comment thread**. Replies may add context or clarification.
3. **Classify the comment** as one of:
   - **Valid concern**: The reviewer raises a legitimate issue that should be fixed.
   - **Already addressed**: The code already addresses the comment. This is common with outdated threads that were not marked outdated.
   - **Disagreement**: The suggestion would conflict with project conventions or spec compliance, or it would degrade the code. These comments need a reply that explains why, not a code change.
   - **Question**: The reviewer asks for clarification, not for a change. These comments need a reply, not a code change.
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

1. Stage the changed files. Be specific, and do not use `git add -A`.
2. Create a commit with a Conventional Commits message and a DCO sign-off (`git commit -s`).
3. Push to the current branch: `git push`

**Ask the user for confirmation before pushing.**

### Step 7: Reply to and resolve review threads

For each addressed thread, reply **and then immediately resolve** it. Both actions are required.

**Important:** Write GraphQL mutations to temp files and use `-F query=@file`, so that the shell does not consume `$`.

First, write both mutation files once, before the loop:

```graphql
# /tmp/reply-thread.graphql
mutation($threadId: ID!, $body: String!) {
  addPullRequestReviewThreadReply(input: {pullRequestReviewThreadId: $threadId, body: $body}) {
    comment { id }
  }
}
```

```graphql
# /tmp/resolve-thread.graphql
mutation($threadId: ID!) {
  resolveReviewThread(input: {threadId: $threadId}) {
    thread { isResolved }
  }
}
```

Then, for **each** thread that should be resolved, run both commands in order:

```bash
# Step A: Reply
gh api graphql -F query=@/tmp/reply-thread.graphql -f threadId='THREAD_ID' -f body='MESSAGE'
# Step B: Resolve (must run after reply succeeds)
gh api graphql -F query=@/tmp/resolve-thread.graphql -f threadId='THREAD_ID'
```

**Which threads to resolve and which to leave open:**
- **Valid concerns** that were fixed: reply with a brief description of the fix, then **resolve**.
- **Nitpicks** that were adopted: acknowledge the change, then **resolve**.
- **Already addressed**: note that the code has been updated, then **resolve**.
- **Disagreements**: reply with the reasoning, respectfully. Do **NOT** resolve. Leave the thread for the reviewer.
- **Questions**: answer clearly. Do **NOT** resolve. Leave the thread for the reviewer.

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
- Never resolve a thread with a disagreement or a question. Only the original reviewer should resolve those threads.
- If a review comment requires a change that conflicts with another review comment, tell the user.
- Follow all project conventions from CLAUDE.md and the code-quality rules when implementing fixes.
- The `code-reviewer` agent's criteria (tree-shaking, performance, API design, TypeScript, docs) apply to all code changes made here too.
