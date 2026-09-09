# CMCD v2 "MUST NOT" directives: compliance findings

Date: 2026-09-09. Package: `@svta/cml-cmcd` 2.6.1 at commit 93747c83.

## Method

The source document is the published CMCD v2 specification, CTA-5004-B:
<https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html>.
The text contains 11 occurrences of "MUST NOT". One occurrence is the RFC 2119 boilerplate. The other 10 are directives.

A probe script ran each directive against the built `dist/` output on three surfaces:

- Encoder: `encodeCmcd`, `toCmcdHeaders`, `toCmcdQuery`. All three share `prepareCmcdData`.
- Reporter: `CmcdReporter` request reports and event reports.
- Validator: `validateCmcd`, `validateCmcdEvents`, `validateCmcdHeaders`.

## Results

PASS means the surface enforces the directive. FAIL means the surface sends, or accepts, a payload that breaks the directive.

| # | Spec location | Directive | Encoder | Reporter | Validator |
|---|---|---|---|---|---|
| 1 | Section 3 | Omit the key when the value is unknown or undefined | FAIL (see note 1) | FAIL (see note 1) | PASS |
| 2 | Body definition | A single-record body has no trailing LF | not applicable | FAIL | FAIL (accepts) |
| 3 | Section 4.1 item 11 | Header payloads are not URL encoded | PASS | PASS | PASS |
| 4 | `ab` | Do not send `ab` when `br` is known | FAIL | FAIL | FAIL |
| 5 | `cen` | Do not send `cen` unless `e` is `ce` | FAIL | FAIL (see note 2) | PASS |
| 6 | `d` | Do not send `d` unless `ot` is a, v, av, tt, c, or o | FAIL | FAIL | FAIL |
| 7 | `lab` | Do not send `lab` when `lb` is known | FAIL | FAIL | FAIL |
| 8 | `ot` | Do not send `ot` when the object type is unknown | PASS | PASS | PASS |
| 9 | `tab` | Do not send `tab` when `tb` is known | FAIL | FAIL | FAIL |
| 10 | `tpb` | Do not send `tpb` unless `ot` is a, v, av, or c | FAIL | FAIL | FAIL |

Note 1: `undefined` is omitted correctly. `null` is not. The formatter runs before the validity check, so `null` becomes `0`. This affects every key with a rounding formatter: `br`, `d`, `bl`, `dl`, `mtp`, `rtp`, and `tb`. The wire then carries `bl=0`, which the validator accepts as a valid integer. TypeScript callers cannot pass `null` without a cast. JavaScript callers can.

Note 2: The reporter leaks `cen` only when a caller stores it in session data with `update({ cen })`. A `cen` passed to `recordEvent(CUSTOM_EVENT, { cen })` does not leak into later events.

Observations that are not directive failures:

- `br: []` encodes as `br=()`. The spec does not define an empty inner list.
- With `ot` absent, `d` and `tpb` are sent. The library cannot evaluate the object-type rules without `ot`.
- Multi-record bodies also end with a trailing LF. The body grammar `<string>(\n<string>)*` has no trailing LF for any record count. The MUST NOT sentence covers only the single-record case.
- The encoder does not validate token values. `ot: 'unknown'` encodes as `ot=unknown`. The validator rejects the token.

## Root causes

- `libs/cmcd/src/prepareCmcdData.ts` filters keys by reporting mode and version only. The one cross-key rule it has, at lines 125 to 127, drops response keys from events that are not `rr`. No rule gates `d` and `tpb` on `ot`. No rule drops `ab`, `lab`, and `tab` when the exact key is present. No rule drops `cen` when `e` is not `ce`.
- `libs/cmcd/src/prepareCmcdData.ts` lines 183 to 185 run the formatter before the validity check at line 219. `Math.round(null)` is `0`.
- `libs/cmcd/src/CmcdReporter.ts` line 1267 builds the body as `data.join('\n') + '\n'`. The trailing LF has been there since PR #324.
- `libs/cmcd/src/validateCmcdStructure.ts` holds the cross-key checks for `cen`, `rr`, state-change events, and `ec`. It has no check for directives 4, 6, 7, 9, and 10.
- `libs/cmcd/src/validateCmcdEvents.ts` splits the body and drops empty lines. A trailing LF is invisible to the validator.

## Decisions for the fix

1. Encoder behavior when a rule is broken: drop the offending key silently, or throw. The existing code drops silently in every comparable case. Recommendation: drop.
2. Which key wins for `ab` and `br`: the spec says `ab` MUST NOT be sent when `br` is known, so `br` wins. The same holds for `lb` over `lab` and `tb` over `tab`.
3. Validator severity for the new checks: error, to match the existing `cen` check.
4. Trailing LF: remove it for every batch size, or only for a single record. The grammar supports removing it for every batch size.
5. Whether the validator should report a trailing LF. The spec directs receivers to ignore leading and trailing spaces, not line feeds. A conformance validator can still report it as a sender error.

## Reproduce

Run each command from the repository root after `npm run build`.

```bash
node --input-type=module -e "import { encodeCmcd, validateCmcd } from '@svta/cml-cmcd'; console.log(encodeCmcd({ v: 2, ot: 'm', d: 4000 }), validateCmcd({ v: 2, ot: 'm', d: 4000 }).valid)"
```

Output: `d=4000,ot=m,v=2 true`

```bash
node --input-type=module -e "import { encodeCmcd, validateCmcd } from '@svta/cml-cmcd'; console.log(encodeCmcd({ v: 2, ot: 'tt', tpb: [5000] }), validateCmcd({ v: 2, ot: 'tt', tpb: [5000] }).valid)"
```

Output: `ot=tt,tpb=(5000),v=2 true`

```bash
node --input-type=module -e "import { encodeCmcd, validateCmcd } from '@svta/cml-cmcd'; console.log(encodeCmcd({ v: 2, ab: [5000], br: [3000] }), validateCmcd({ v: 2, ab: [5000], br: [3000] }).valid)"
```

Output: `ab=(5000),br=(3000),v=2 true`

```bash
node --input-type=module -e "import { encodeCmcd } from '@svta/cml-cmcd'; console.log(encodeCmcd({ v: 2, e: 'ps', sta: 'p', cen: 'x', ts: 1 }, { reportingMode: 'event' }))"
```

Output: `cen="x",e=ps,sta=p,ts=1,v=2`

```bash
node --input-type=module -e "import { encodeCmcd } from '@svta/cml-cmcd'; console.log(encodeCmcd({ v: 2, bl: null, d: null }))"
```

Output: `bl=0,d=0,v=2`

```bash
node --input-type=module -e "import { CmcdEventType, CmcdReporter } from '@svta/cml-cmcd'; const r = new CmcdReporter({ sid: 's', eventTargets: [{ url: 'https://a.example.com/cmcd', events: [CmcdEventType.ERROR], enabledKeys: ['sid', 'v', 'e', 'ts', 'sn', 'ec'] }] }, async q => { console.log(JSON.stringify(q.body)); return { status: 200 } }); r.recordEvent(CmcdEventType.ERROR, { ec: ['E100'] })"
```

Output ends with `\n`: `"e=e,ec=(\"E100\"),sid=\"s\",sn=0,ts=...,v=2\n"`
