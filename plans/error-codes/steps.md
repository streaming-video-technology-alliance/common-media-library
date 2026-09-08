# Implementation steps

Plan of record for `@svta/cml-error-codes`, the reference implementation of
[SVTA2070: Standardized Error Codes](https://www.svta.org/product/svta2070/). The design and the accepted
contract are in [`rfc/error-codes.md`](../../rfc/error-codes.md). The code was written on branch
`claude/svta-error-codes-cml-d0ad01` next to the RFC draft. It was ported to branch
`claude/svta-error-code-impl-ldvspp` after the RFC PR
[#423](https://github.com/streaming-video-technology-alliance/common-media-library/pull/423) merged on
2026-09-07.

## Constraints

- The RFC is the source of names, values, and descriptions. The spec tables are normative where the spec
  prose disagrees with them. The RFC lists the five errata.
- The const enum pattern from `.claude/rules/code-quality.md`: one `as const` export per code, a collector
  object per category, and a `ValueOf` type.
- One public export per file. The filename equals the export name. The barrel is alphabetical, and type-only
  files use `export type *`.
- Helpers compose codes from `SvtaErrorCategory` arithmetic and do not import the catalogs.
- No code runs at module scope.
- Spec descriptions stay verbatim in the member TSDoc, except where the errata apply. Notes go in a separate
  TSDoc paragraph.
- Tests import from `@svta/cml-error-codes`, run against `dist`, and mark examples with `//#region example`.
- The root build script includes the package. `scripts/projects.ts` does not. The first release-prep PR adds
  the package to the publish list.

## Steps

1. Scaffold `libs/error-codes` from `libs/cmsd`: version 0.0.1, `files: ["dist/**/*", "NOTICE.md"]`, tsdown
   build, api-extractor report. Root wiring: the `package.json` build script, the `tsconfig.typedoc.json`
   path, the root `README.md` list, and the `package-lock.json` workspace link.
2. `SvtaErrorCategory`: 9 categories, each also an `SVTA_ERROR_CATEGORY_<MEMBER>` constant.
3. One catalog file per category: Unknown (1), Media Content (10), Playback (42), Network (12), Content
   Protection (22), Accessibility (5), Remote Play (10), Advertising (34), Custom (1). Every member is an
   `SVTA_<MEMBER>` constant. The nine `UNKNOWN`s carry a category qualifier, and 999 is `SVTA_UNKNOWN`. Each
   constant's TSDoc leads with its spec coordinates, such as `SVTA 2 [Playback] 001: Video buffer underrun`.
4. The `SvtaErrorCode` union type, `getSvtaErrorCategory`, and `getSvtaErrorIndex`. Both helpers return
   `undefined` unless the input is a non-negative integer.
5. `httpStatusToSvtaErrorCode` and `vastErrorToSvtaErrorCode`. Out-of-range input returns 3000 or 7000.
   `vastErrorToSvtaErrorCode(1009)` returns 7999. This mapping is the amendment from the review of #423.
6. `getSvtaErrorDescription`, the human-readable dictionary, is deferred. The first release is codes-only, per
   the review of #445 and RFC unresolved question 2.
7. Tests. `test/data/assertCatalogInvariants.ts` checks each catalog: unique integers, `floor(v / 1000)`
   equals the category, `UNKNOWN === category * 1000`, the exact size, and one `SVTA_*` constant per member.
   The helper tests pin the codes the spec uses in its examples.
8. Docs: the README with the guide-level examples from the RFC, the CHANGELOG `## [Unreleased]` entry, and
   the generated `config/cml-error-codes.api.md` reviewed against the RFC tables.
9. Validation: `npm test` at the root (lint, build all, typecheck, every package's tests) and
   `npm run build -w docs`.

## Outcome

- 146 `SVTA_*` constants: 137 codes and 9 categories.
- No runtime dictionary in the first release. The member TSDoc carries the spec descriptions.
- The RFC status is `accepted`. The release-prep PR that publishes `@svta/cml-error-codes` changes it to
  `implemented`.

## Follow-ups

- Add `getSvtaErrorDescription` once the IANA registry exists as a machine-readable source.
- Report the five spec errata in the RFC to the Player Working Group before IANA registration.
- Swap the `@see` links to the IANA registry entry once registration lands.
