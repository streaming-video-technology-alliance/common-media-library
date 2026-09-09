# Fix plan: CMCD v2 "MUST NOT" directives

Decisions from the review (see `findings.md`): plain fix PR, no RFC. The encoder drops an offending key silently. The validator reports an error, except for the trailing line feed, which it reports as a warning.

## Steps

1. Write failing tests for every directive on the encoder, the reporter, and the validator.
2. Add two internal tables: the object types that allow `d` and `tpb`, and the exact key that supersedes each aggregate bitrate key.
3. `prepareCmcdData`: skip the formatter for an empty value, drop `d` and `tpb` for other object types, drop `ab`, `lab`, and `tab` when the exact key is sent, drop `cen` unless `e` is `ce`.
4. `validateCmcdStructure`: report the object-type and aggregate-bitrate conflicts as errors for version 2 payloads.
5. `validateCmcdEvents`: report a body that ends with a line feed as a warning.
6. `CmcdReporter`: join event records with a line feed and no trailing line feed.
7. Update the changelog, the user guide, and the validation guide.
8. Build, test, typecheck, lint. Confirm the API report has no diff.
9. Treat an empty array as no value, so `br: []` is omitted instead of sent as `br=()`. Requested during the review.

## Scope notes

- The object-type rules apply to version 2 only. The version 1 text was not available to confirm the rule, so version 1 output is unchanged.
- The aggregate bitrate rule is evaluated on the keys that reach the wire. A caller that filters `br` out and enables `ab` still sends `ab`.
- The trailing line feed is a warning in the validator because every event report from earlier `@svta/cml-cmcd` versions ends with one.
