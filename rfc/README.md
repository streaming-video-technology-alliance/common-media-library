# RFCs

Proposals that need community buy-in before proceeding.

## What Belongs Here

- Changes to the public API surface of any package
- New packages or significant changes to core architecture
- Spec-interpretation decisions that affect wire behavior
- Anything that needs alignment from adopters or maintainers before implementation

**Use a plan instead** (`plans/<feature-name>/`) for implementation details and design-session artifacts you own.

**Skip both for:** bug fixes, small features, and documentation updates.

## File Format

RFCs use YAML frontmatter for status tracking:

```markdown
---
status: draft
---
```

When implemented, link the shipped version and the plan that executed it:

```markdown
---
status: implemented
implemented-in: <package>@<version>
implementation-plan: plans/<feature-name>/
---
```

## Suggested Outline

RFCs here are usually API design proposals. Structure them for two readers, adopters first and maintainers second:

- **Summary**: the proposal in one paragraph, with a code sample if it fits.
- **Motivation**: the problem, who has it, and why existing extension points cannot solve it.
- **Guide-level explanation**: the feature as an adopter experiences it, with complete, runnable examples.
- **Reference-level explanation**: types, semantics, edge-case behavior, and interactions with existing features, in enough detail to implement from.
- **Drawbacks**: honest costs.
- **Rationale and alternatives**: what else was considered and why this shape won.
- **Prior art**: precedent in other players and libraries.
- **Unresolved questions**: what community review should settle.
- **Future possibilities**: follow-ups that are deliberately out of scope.
- **Final Decision**: completed after review (decision, rationale, date).

Sections scale to the proposal. Small RFCs can drop what they do not need.

## Status Lifecycle

| Status        | Meaning                            |
| ------------- | ---------------------------------- |
| `draft`       | Under discussion, not yet accepted |
| `accepted`    | Approved for implementation        |
| `implemented` | Code shipped                       |
| `superseded`  | Replaced by another RFC            |

## Directory Structure

```
rfc/
├── README.md           # This file
├── feature-name.md     # Single-file RFC
└── feature-name/       # Multi-file RFC
    └── index.md        # Overview; split supporting docs as needed
```

## Contributing an RFC

1. Create a branch: `rfc/<feature-name>`
2. Open a PR titled `[RFC] Feature Name`; community review happens as PR comments
3. Record the outcome in the RFC's Final Decision section and update `status`
4. Squash-merge with a `docs(rfc): <feature name>` commit

All commits require DCO sign-off (`git commit -s`), as everywhere in this repo.
