---
status: draft
---

# RFC: MoQ streaming format support (`@svta/cml-moq`)

| | |
|---|---|
| **Author** | Casey Occhialini |
| **Date** | 2026-10-26 |
| **Package** | `@svta/cml-moq` (new) |
| **Breaking change** | No (new package) |

## Summary

A new package, `@svta/cml-moq`, implements the parts of the MOQT Streaming Format that a web player reads before playback starts. The sources are [draft-ietf-moq-msf-01](https://datatracker.ietf.org/doc/draft-ietf-moq-msf/01/) (MSF) and the CMAF extension of MSF, [draft-ietf-moq-cmsf-01](https://datatracker.ietf.org/doc/draft-ietf-moq-cmsf/01/) (CMSF). The package has five parts:

- the catalog as TypeScript types
- a catalog decoder with delta updates and variable substitution
- a parser for the `moqt` URI and the `msf` fragment
- decoders and a lookup object for the media timeline and the event timeline
- three functions that convert the content protection fields of CMSF to the types of `@svta/cml-drm`

The package contains no transport code. The player owns the MOQT session and passes the payloads of the catalog and timeline tracks to this package.

```ts
import { decodeMoqCatalog, MoqPackaging, MoqTrackRole, parseMoqUri } from '@svta/cml-moq'

const uri = parseMoqUri('moqt://relay.example.com/live#msf:customer-livestream-123--catalog&token=XYZ789')
// uri.connectUrl: 'https://relay.example.com/live'
// uri.fragment.track: { namespace: ['customer', 'livestream', '123'], name: 'catalog' }

// catalogText is the payload of the first object in the catalog track.
const catalog = decodeMoqCatalog(catalogText, { variables: uri.fragment.params })

const videoTracks = catalog.tracks.filter(
	track => track.packaging === MoqPackaging.CMAF && track.role === MoqTrackRole.VIDEO,
)
```

## Motivation

MSF defines the catalog, the URL form, and the timeline tracks for every MOQT player. CMSF adds the CMAF packaging rules and the CENC signaling that a player needs for Media Source Extensions and Encrypted Media Extensions. Those two layers are the same for every player and every transport library. The transport layer is not. The wire format changes with each transport draft, and browser transport libraries follow different drafts. A CML package for the stable layer gives players one tested catalog implementation while the transport layer settles.

CMSF maps onto packages that CML already has. The content protection scheme values equal `EncryptionScheme` in `@svta/cml-drm`. The four DRM system IDs in CMSF equal the UUID constants in the same package. The catalog `altGroup` and `renderGroup` fields are the switching set and selection set of `@svta/cml-cmaf-ham`. A package that converts the catalog to those types reuses the EME code that players already run.

The repo names domain packages when the specification name is not stable. `drm` covers EME, CENC, and three key systems. `cta` covers several CTA standards. The datatracker shows that draft-ietf-moq-msf replaced draft-ietf-moq-warp, so the format name changed once already. The package name `moq` follows the `drm` and `cta` precedent.

## Guide-level explanation

### From a URL to a track list

A player receives an MSF URL. The URL names the MOQT server and, in the fragment, the catalog track. The fragment also contains per-viewer values for the catalog variables. `parseMoqUri` splits the URL, and `decodeMoqCatalog` validates the catalog JSON and substitutes the variables:

```ts
import { decodeMoqCatalog, parseMoqUri } from '@svta/cml-moq'

const uri = parseMoqUri('moqt://relay.example.com/live#msf:customer-livestream-123--catalog&token=XYZ789')
const catalog = decodeMoqCatalog(catalogText, { variables: uri.fragment.params })

// A catalog field "authInfo": { "cat": "%token%" } now reads { "cat": "XYZ789" }.
```

### Applying a delta update

Every object after the first in a catalog group is a delta update. `applyMoqDeltaUpdate` returns a new catalog and leaves the input unchanged:

```ts
import { applyMoqDeltaUpdate, decodeMoqCatalog } from '@svta/cml-moq'

let catalog = decodeMoqCatalog(firstObjectText)

for (const text of laterObjectTexts) {
	const update = decodeMoqCatalog(text)

	if (update.deltaUpdate) {
		catalog = applyMoqDeltaUpdate(catalog, update)
	}
}
```

### Seeking with a media timeline

A media timeline maps media time and wallclock time to MOQT locations. The first object of each timeline group is the complete timeline. Later objects may append entries. The timeline object keeps the entries sorted and answers lookups with a binary search:

```ts
import { createMoqMediaTimeline, decodeMoqMediaTimeline } from '@svta/cml-moq'

const timeline = createMoqMediaTimeline()

timeline.reset(decodeMoqMediaTimeline(firstObjectText))
timeline.append(decodeMoqMediaTimeline(nextObjectText))

timeline.locationAt({ mediaTime: 5000 }) // [2, 0]
```

A track with a `template` field needs no timeline track. The same object computes locations from the template:

```ts
import { createMoqMediaTimeline } from '@svta/cml-moq'

const timeline = createMoqMediaTimeline({ template: [0, 2002, [0, 0], [1, 0], 1759924158381, 2002] })

timeline.locationAt({ mediaTime: 5000 }) // [2, 0]
```

### Starting a DRM session from the catalog

A CMSF catalog lists DRM systems at the root. Each protected track references the systems by ID. Two functions resolve the references and convert each entry to the `ContentProtection` type of `@svta/cml-drm`. The existing EME helpers then apply:

```ts
import { getKeySystemAccess, parseInitDataFromContentProtection } from '@svta/cml-drm'
import { getMoqContentProtections, getMoqKeySystems, moqContentProtectionToDrm } from '@svta/cml-moq'
import { decodeBase64 } from '@svta/cml-utils'

const protections = getMoqContentProtections(catalog, videoTrack)
const requests = protections.flatMap(protection =>
	getMoqKeySystems(protection.drmSystem.systemID).map(keySystem => ({ keySystem, configurations })),
)

const access = await getKeySystemAccess(requests)
if (!access) {
	throw new Error('No supported key system')
}

const protection = protections.find(p => getMoqKeySystems(p.drmSystem.systemID).includes(access.keySystem))!
const initData = parseInitDataFromContentProtection(moqContentProtectionToDrm(protection), { decodeArray: decodeBase64 })
```

## Reference-level explanation

### Scope

The package implements these sections of the two drafts:

| Area | MSF | CMSF |
| --- | --- | --- |
| Catalog fields and examples | 5.1, 5.2, 5.6 | 3.5, 4.1, 5 |
| Delta updates | 5.1.6, 5.3 | |
| Variable substitution | 5.4, 5.2.43 | |
| Media timeline and template | 7 | |
| Event timeline | 8 | 3.6 |
| URL and fragment | 11.1 | |
| String form of track names | transport 8.8, 11.1.2 | |
| Content protection | | 4 |

The package leaves out LOC packaging, MoQ Secure Objects, and the MOQLOG and MOQMETRICS payloads. The package also leaves out the compression property and every MOQT control or data message.

### Types

All types are type-only exports. They cost nothing at runtime.

| Type | Contents |
| --- | --- |
| `MoqCatalog` | The root fields: `version`, `generatedAt`, `isComplete`, `tracks`, `publishTracks`, `initDataList`, `contentProtections` |
| `MoqCatalogDelta` | A delta update object: `deltaUpdate`, `generatedAt`, `isComplete` |
| `MoqCatalogTrack` | Every track field of MSF section 5.2 plus the CMSF fields `maxGrpSapStartingType`, `maxObjSapStartingType`, and `contentProtectionRefIDs` |
| `MoqDeltaOperation` | `{ op, tracks }` |
| `MoqInitData` | `{ id, type: 'inline', data }` |
| `MoqBuffers` | `{ target?, min?, max? }` |
| `MoqAuthInfo` | A record from scheme name to scheme configuration |
| `MoqAccessibility` | `{ scheme, value }` |
| `MoqContentProtection` | `{ refID, defaultKID, scheme, drmSystem }` |
| `MoqDrmSystem` | `{ systemID, laURL?, certURL?, authURL?, pssh?, robustness? }` |
| `MoqServiceUrl` | `{ url, type? }` |
| `MoqLocation` | `[group: number, object: number]`, the JSON form of a MOQT Location |
| `MoqFullTrackName` | `{ namespace: string[], name: string }` |
| `MoqUri` | `{ href, connectUrl, authority, path, query, fragment? }` |
| `MoqMsfFragment` | `{ track, connection?, c4m?, wallclockRanges, mediatimeRanges, locationRanges, params }` |
| `MoqRange` | `{ start: number, end?: number }` |
| `MoqLocationRange` | `{ start: MoqLocationBound, end?: MoqLocationBound }` with `MoqLocationBound = { group: number, object?: number }` |
| `MoqMediaTimelineEntry` | `[mediaTime: number, location: MoqLocation, wallclock: number]` |
| `MoqMediaTimelineTemplate` | The six template values of MSF section 7.4.1 |
| `MoqMediaTimeline` | The object that `createMoqMediaTimeline` returns |
| `MoqEventTimelineEntry<T>` | One of `{ t }`, `{ l }`, or `{ m }` plus `data: T` |
| `MoqSapTimelineData` | `[sapType: 0 \| 1 \| 2 \| 3, earliestPresentationTime: number]` |
| `MoqCatalogDecodeOptions` | `{ variables? }` |

`MoqCatalog` declares `deltaUpdate?: never`, so `update.deltaUpdate` narrows the union that `decodeMoqCatalog` returns. Location IDs are JSON numbers. JSON has no 64-bit integer, so the types use `number` and not `bigint`.

Fields with a closed value set use a string literal union. Fields that the drafts leave open, such as `role` and `eventType`, are `string`. The constants below give autocomplete for the registered values of the open fields.

### Constants

The constants follow the const enum pattern of the repo. Each constant lives in one file, so a bundle includes only the constants that the player imports.

| Export | Values |
| --- | --- |
| `MoqPackaging` | `loc`, `cmaf`, `mediatimeline`, `eventtimeline`, `moqlog`, `moqmetrics` |
| `MoqTrackRole` | The ten roles of MSF section 5.2.6 |
| `MoqEventType` | The four registered types of MSF section 14.2 and `org.ietf.moq.cmsf.sap` |
| `MoqAuthScheme` | `privacy-pass`, `cat` |
| `MoqAccessibilityScheme` | The two SCTE schemes of MSF section 5.2.44 |
| `MoqDeltaOp` | `add`, `remove`, `clone` |
| `MoqConnectionType` | `q`, `wt` |
| `MOQ_CATALOG_TRACK_NAME` | `catalog` |
| `MOQ_MSF_FRAGMENT_TYPE` | `msf` |

### Functions

| Function | Purpose |
| --- | --- |
| `decodeMoqCatalog(text, options?): MoqCatalog \| MoqCatalogDelta` | Parses and validates a catalog object, with variable substitution |
| `applyMoqDeltaUpdate(catalog, delta): MoqCatalog` | Applies the `add`, `remove`, and `clone` operations and returns a new catalog |
| `getMoqInitData(catalog, track): Uint8Array<ArrayBuffer> \| undefined` | Resolves `initRef` and decodes the inline Base64 data |
| `parseMoqUri(uri): MoqUri` | Splits a `moqt` URI and parses an `msf` fragment |
| `encodeMoqTrackName(track): string` | Renders a full track name in the string form of transport section 8.8 |
| `decodeMoqTrackName(text): MoqFullTrackName` | Parses that string form |
| `decodeMoqMediaTimeline(text): MoqMediaTimelineEntry[]` | Parses and validates a media timeline payload |
| `decodeMoqEventTimeline<T>(text): MoqEventTimelineEntry<T>[]` | Parses and validates an event timeline payload |
| `createMoqMediaTimeline(source?): MoqMediaTimeline` | Creates a timeline from entries or a template, with `reset`, `append`, `locationAt`, and `entryAt` |
| `getMoqContentProtections(catalog, track): MoqContentProtection[]` | Resolves `contentProtectionRefIDs` against the root array |
| `moqContentProtectionToDrm(entry): ContentProtection` | Converts an entry to the `@svta/cml-drm` type |
| `getMoqKeySystems(systemId): string[]` | Maps a DRM system ID to key system strings for EME, in preference order |

The timeline is a factory function and not a class. The repo rule reserves classes for platform subclasses and internal types. The timeline is stateful because MSF section 7.3 allows incremental entries in later objects of each group.

### Semantics and edge cases

Catalog decoding:

- `JSON.parse` errors propagate unchanged.
- An independent catalog needs `version` and `tracks`. A delta needs `deltaUpdate` with at least one operation and must not contain `tracks` or `version`. A violation throws an `Error` that names the field.
- The decoder accepts the version strings `1` and `draft-01`. See unresolved question 1.
- Every track in an independent catalog, and every track in an `add` operation, needs `name`, `packaging`, and `isLive`. Tracks in `remove` and `clone` operations follow the field rules of MSF section 5.1.6.
- The decoder keeps unknown fields on the decoded objects. The decoder also keeps unknown values in open fields. A player skips the tracks that the player cannot use.
- Variable substitution runs on the text before parsing. The replacement is one regular expression pass over `%name%` references. A value with a character outside `A-Z a-z 0-9 - _ @` throws. A reference without a value throws. See unresolved question 3.

Delta updates:

- Tracks match on the pair of `namespace` and `name`. A missing `namespace` matches a missing `namespace`, because both inherit the namespace of the catalog track.
- `add` throws when the track exists. `remove` throws when the track does not exist. See unresolved question 7.
- `clone` copies every field of the parent except `name`, then applies the fields of the operation. The result does not contain `parentName` or `parentNamespace`.
- `generatedAt` and `isComplete` from the delta replace the base values when present.
- The function returns a new catalog with a new `tracks` array. The input catalog does not change.

Timelines:

- `decodeMoqMediaTimeline` checks that every record is an array of a number, a location, and a number. `decodeMoqEventTimeline` checks that every record has exactly one of `t`, `l`, or `m` and a `data` field.
- `locationAt({ mediaTime })` returns the location of the last entry with a media time at or below the query. The query returns `undefined` before the first entry. `locationAt({ wallclock })` works the same way on the wallclock values.
- A template timeline computes the entry index from the start and delta values and clamps the index at 0. A template with a `deltaWallclock` of 0 returns `undefined` for wallclock lookups.
- `append` keeps the entries sorted by media time and drops an entry whose location is already present.

URIs and names:

- The scheme must be `moqt`, compared without case. An empty host throws. The parser does not add the default port of 443.
- `connectUrl` is the same URI with the scheme `https` and without the fragment. This value is the WebTransport URL of transport section 6.2.1.
- The fragment is parsed when the fragment type is `msf`. Another fragment type leaves `fragment` undefined. `href` keeps the raw fragment.
- Repeated range parameters produce one array per parameter. The player processes the union, as MSF section 11.1.1 requires. The first value of `connection` and `c4m` wins.
- `decodeMoqTrackName` rejects a period that is not followed by two lowercase hexadecimal digits. The function also rejects an escaped byte that the format represents literally. Both rules keep the mapping bijective. The bytes decode as UTF-8, and invalid UTF-8 throws.

Content protection:

- `getMoqContentProtections` returns an empty array for a track without `contentProtectionRefIDs`. An unknown reference ID throws.
- `moqContentProtectionToDrm` sets `schemeIdUri` to `urn:uuid:` plus the system ID and `value` to the scheme. The function sets `pssh` to the Base64 PSSH and `laUrl` to the license URL. `certURL`, `authURL`, and `robustness` remain on the `MoqDrmSystem` object, because the drm type has no field for those values.
- `getMoqKeySystems` covers the four system IDs of CMSF section 4.1.1.4.1 with the key system constants of `@svta/cml-drm`. PlayReady returns two strings. An unknown ID returns an empty array.

### Performance

The package runs per catalog or timeline object, never per media object. Media payloads do not pass through the package. Decoding is one `JSON.parse` call and one validation pass. Substitution adds one regular expression pass when the player supplies variables. A delta update copies the track array once. A timeline lookup is a binary search over the entries or two arithmetic operations on a template.

### Draft inconsistencies

These points in the -01 texts need a decision in the implementation and a report to the working group:

1. MSF section 5.1.1 defines the version string as `draft-XX`. The examples in MSF section 5.6 and CMSF section 5 use `"1"`.
2. MSF section 5.2 names the field `mimeType`. The examples use both `mimeType` and `mimetype`.
3. MSF section 5.2.2 types `namespace` as one string, and the examples write `conference.example.com/conference123/alice`. A MOQT namespace is a tuple, and MSF section 11.1.2 renders tuples with hyphens and `.xx` escapes. The drafts do not say how the string maps to the tuple.
4. MSF section 11.3 names the message SUBSCRIBE_DONE. Transport draft-22 names the message PUBLISH_DONE.
5. MSF section 5.2.36 cites transport section 3.1.1 for the URI scheme. Transport draft-22 defines the scheme in section 6.1.
6. CMSF cites transport draft-18 as the normative reference. The current transport draft is 22.

### Dependencies and packaging

- Peer dependencies: `@svta/cml-utils` for `decodeBase64` and `ValueOf`, and `@svta/cml-drm` for the `ContentProtection` type and the key system constants. Only the three conversion functions import from drm, so a player without DRM ships no drm code.
- The scaffold mirrors `libs/cmsd`: version 0.0.1, tsdown build, api-extractor report, typedoc discovery. The root build includes the package. `scripts/projects.ts` gets the entry in the first release-prep PR, so nothing publishes before this RFC is accepted.
- Every export has a `@beta` tag until the working group issues a last call on the drafts. The abr package followed the same path.
- The README needs the `## When to use` section that feeds the generated agent docs. `site/scripts/groups.ts` lists the package under Delivery.
- The public types use no syntax newer than TypeScript 5.7, so the minimum version in the root README does not change. `getMoqInitData` allocates and returns `Uint8Array<ArrayBuffer>`.
- Tests use the draft examples as fixtures:
  - the sixteen examples of MSF section 5.6 and the three catalogs of CMSF section 5
  - the delta sequences of MSF sections 5.6.4 and 5.6.5
  - the timeline and the template of MSF section 7, and the SAP timeline of CMSF section 3.6.2
  - the URLs of MSF section 11.1.3

## Drawbacks

- Both drafts are at revision -01, and both replaced earlier drafts with other names. Field names and value sets can change before the RFC stage. A field rename is a breaking change for TypeScript adopters even when the runtime does not change.
- The drafts say little about malformed catalogs. The strictness rules above are decisions of this RFC, not of the drafts.
- `@svta/cml-drm` becomes a peer dependency for every adopter, including adopters who import only types. The bundle cost is zero. The install cost is one more package.
- The first release has no encoder. Publishers get the types and nothing else.

## Rationale and alternatives

- `@svta/cml-moq` (chosen) against `@svta/cml-msf`: the format name changed from WARP to MSF between drafts. Adopters search for "moq". The repo already names packages after a domain when the specifications under the domain move.
- One package against a separate `@svta/cml-cmsf`: CMSF adds six catalog fields, one packaging value, one event type, and the CMAF rules. MSF alone has no packaging that reaches Media Source Extensions, because LOC needs WebCodecs. The two drafts only work together for a web player.
- One package against spreading the work over drm, cmaf-ham, and utils: the five parts reference each other and nothing else in CML. Spreading the parts puts MoQ catalog types into packages whose adopters never asked for MoQ. The feature would also have no README.
- Runtime functions against a types-only package: the drafts require every subscriber to apply delta updates, substitute variables, and parse the fragment. A types-only package leaves each player to write the same code.
- A timeline factory against free functions over an array: MSF section 7.3 allows incremental entries in later objects. The timeline needs a sorted store between objects. The repo rule assigns stateful public components to factory functions.
- Substitution on the text against substitution on the parsed object: the value grammar of MSF section 5.4.1 excludes quotes and backslashes. A text replacement cannot break the JSON. One pass over the text is cheaper than a visit to every string field.

## Prior art

- In-repo: `decodeCmcd` in `@svta/cml-cmcd` is the decoder precedent. `processUriTemplate` in `@svta/cml-dash` is the template substitution precedent. The `ContentProtection` helpers in `@svta/cml-drm` are the target of the conversion functions. `Protection` in `@svta/cml-cmaf-ham` already types the scheme and default KID the same way.
- External: the `@moq/net` README states that the library follows the moq-lite specification and negotiates the IETF transport draft as a fallback. A search on 2026-10-26 found no TypeScript implementation of the MSF catalog.

## Unresolved questions

1. Which version strings does `decodeMoqCatalog` accept? The proposal accepts `1` and `draft-01` until the drafts agree.
2. How does the catalog `namespace` string map to the MOQT namespace tuple? The proposal keeps the string as written and does not split the string. `decodeMoqTrackName` handles the hyphen form of the fragment only.
3. Should a `%name%` reference without a value throw, or remain in the text? The proposal throws, because a token field with a literal `%token%` value sends a wrong credential.
4. Which PlayReady key system string comes first in `getMoqKeySystems`?
5. Should the map from system ID to key system move to `@svta/cml-drm`? The DASH `schemeIdUri` has the same need.
6. Compression: the MSF_COMPRESSION property ID is still TBD, and reading the property needs the transport layer. The proposal leaves gzip to the player through `DecompressionStream`. Is that acceptable for the first release?
7. Should `remove` of an unknown track throw, or should the operation be ignored?
8. Should `MoqFullTrackName` use bytes instead of strings? The MSF catalog uses strings, and the proposal follows the catalog.

## Future possibilities

- `encodeMoqCatalog` for publishers, with the field order rule of MSF section 5.1.7.
- Compression support once the MSF_COMPRESSION property ID is assigned.
- A CMAF chunk splitter in `@svta/cml-iso-bmff`. LL-HLS parts and LL-DASH chunks need the same code, so the splitter does not belong in this package.
- A validator for the CMSF object and group rules of sections 3.3 and 3.4, built with the chunk splitter.
- A catalog to CMAF-HAM mapper next to the DASH and HLS mappers.
- Decoders for the SCTE-35 and WebVTT event timeline payloads once the referenced drafts exist.
- MOQT registry constants, if adopters ask for the constants after the transport draft stabilizes.

## Revision history

- v1 (2026-10-26): initial draft.

## Final Decision

Pending.
