---
status: draft
---

# RFC: Content steering engine for `@svta/cml-content-steering`

| | |
|---|---|
| **Author** | Casey Occhialini |
| **Date** | 2026-09-28 |
| **Package** | `@svta/cml-content-steering` |
| **Breaking change** | No |
| **Issue** | [#61](https://github.com/streaming-video-technology-alliance/common-media-library/issues/61) |

## Summary

Add a content steering engine to `@svta/cml-content-steering`. The engine implements the client side of Pathway-based Content Steering for HLS and DASH players. It requests the Steering Manifest, schedules the next request, and selects the pathway that the player must apply. The player keeps its own model of the content. The player applies the selected pathway, creates the pathway clones, and reports the pathways that fail. A second new function, `applyUriReplacement`, builds the URIs of a clone.

```ts
import { createSteeringEngine } from '@svta/cml-content-steering'

const engine = createSteeringEngine({
	protocol: 'hls',
	uri: 'https://steering.example.com/manifest?video=42',
	pathways: ['CDN-A', 'CDN-B'],
	pathway: 'CDN-A',
	getThroughput: () => 6000000,
	onPathwayChange: (pathway) => console.log(`apply ${pathway}`),
})

await engine.start()
```

The package already has the Steering Manifest types, two validators, and two constants. These exports do not change, except that `UriReplacement` gets the two HLS keys.

This RFC uses three specs:

- The base spec is [draft-pantos-content-steering-05](https://datatracker.ietf.org/doc/html/draft-pantos-content-steering-05). It is independent of the delivery protocol, and it is with the RFC Editor.
- The HLS spec is [draft-pantos-hls-rfc8216bis-22](https://datatracker.ietf.org/doc/html/draft-pantos-hls-rfc8216bis-22), section 7.
- The DASH spec is [ETSI TS 103 998 V1.1.1](https://www.etsi.org/deliver/etsi_ts/103900_103999/103998/01.01.01_60/ts_103998v010101p.pdf), clause 7.

## Motivation

The base spec defines one client algorithm. The HLS spec and the DASH spec add rules for their protocol. Four open-source web players implement the algorithm: hls.js, dash.js, Shaka Player, and Video.js HTTP Streaming (VHS). Each player has its own implementation, and each implementation differs from the specs in different places. The table shows a sample, read from the main branch of each player on 2026-09-28.

| Rule | hls.js | dash.js | Shaka Player | VHS |
|---|---|---|---|---|
| A relative RELOAD-URI resolves against the current Steering Manifest URI | yes | resolves against the URI in the MPD | resolves against the manifest base | resolves against the previous RELOAD-URI |
| After HTTP 410, send no more requests | yes | yes | sends more requests | yes |
| Retry-After can be an HTTP date | not parsed | not parsed | Retry-After not read | not parsed |
| PARAMS values arrive percent-encoded | encoded again | encoded again | PARAMS ignored | encoded again |
| HLS per-variant URIs replace HOST and PARAMS | yes | not applicable | ignored | not supported |

The design record, [`plans/content-steering-engine/architecture.md`](../plans/content-steering-engine/architecture.md), has the full comparison with source links. The integration map, [`plans/content-steering-engine/integration.md`](../plans/content-steering-engine/integration.md), shows how each of the four players would adopt the engine. Revision v2 of this RFC applies its findings.

Issue #61 asks for one module that every player can use. The package has had the Steering Manifest types and validators since its first release. The request loop and the pathway selection are the parts that each player still implements.

## Guide-level explanation

### Create the engine

Create one engine for each Content Description that declares content steering. The Content Description is the HLS multivariant playlist or the DASH MPD. The player reads three values from it.

| Property | HLS | DASH |
|---|---|---|
| `uri` | `SERVER-URI` of `EXT-X-CONTENT-STEERING`, resolved against the playlist URI | text of the `ContentSteering` element, resolved against the MPD URI |
| `pathways` | every `PATHWAY-ID` of the variant streams, and `.` for a variant stream without one | every `@serviceLocation` of the `BaseURL` and `Location` elements |
| `pathway` | `PATHWAY-ID` of `EXT-X-CONTENT-STEERING` | the `@defaultServiceLocation` value that the player applies |

`getThroughput` returns the throughput estimate of the player for a pathway, in bits per second.

```ts
import { createSteeringEngine } from '@svta/cml-content-steering'

// abr and player are objects of the media player
const engine = createSteeringEngine({
	protocol: 'dash',
	uri: 'https://steering.example.com/dash?video=42',
	pathways: ['alpha', 'beta'],
	pathway: 'alpha',
	queryBeforeStart: true,
	getThroughput: (pathway) => abr.getEstimate(pathway),
	onManifest: (manifest, clones) => player.addClones(clones),
	onPathwayChange: (pathway) => player.applyPathway(pathway),
	onError: (error) => player.log(error.message),
})
```

The engine sends no request until `start()`. The protocol decides when to call `start()`:

- HLS: after the multivariant playlist loads.
- DASH with `@queryBeforeStart` set to `true`: before playback starts. Set `queryBeforeStart: true`, so the first request has no steering query parameters (DASH spec, step 7). Wait for the promise of `start()` before the player selects a `BaseURL`.
- DASH in all other cases: after playback starts and the buffer reaches its target level (DASH spec, step 5).

The promise of `start()` resolves when the engine has processed the response. The promise never rejects.

### Apply the selected pathway

The engine selects a pathway after each Steering Manifest, after each penalty, and when a penalty ends. When the selection changes, the engine calls `onPathwayChange`. The player must then use only the URIs of that pathway (base spec, section 7). `engine.pathway` returns the current selection.

`engine.priority` returns the whole order: the selected pathway first, then the other known pathways that are not penalized. A DASH player uses the list to select a `BaseURL` for each node of the MPD (DASH spec, step 12). It also uses the list to select a `Location` for MPD updates (step 16). A player can also replace the list with `update({ priority })`, for example from an application setting. The next valid Steering Manifest replaces that list again.

### Update the pathways

A DASH MPD update can add service locations or change the steering URI. Call `update()` with the new values. The engine keeps its penalties, its clones, and its request schedule.

```ts
engine.update({ pathways: ['alpha', 'beta', 'gamma'] })
engine.update({ uri: 'https://steering2.example.com/dash?video=42' })
```

### Create clones

A Steering Manifest can define pathway clones. A clone copies an existing pathway and changes the host or the query parameters of its URIs. The engine checks the clones and passes the valid clones to `onManifest`. The player adds each clone to its own model and builds the URIs with `applyUriReplacement`. The engine calls `onManifest` before `onPathwayChange`, so a clone exists before the engine selects it. If the player cannot build a clone, `acceptClone` returns `false` for it, and the engine ignores the clone.

The example uses the clone example of the base spec, section 8.2:

```ts
import assert from 'node:assert'
import { applyUriReplacement } from '@svta/cml-content-steering'

const replacement = { HOST: 'backup2.example.com', PARAMS: { token: 'dkfs1239414' } }

assert.equal(
	applyUriReplacement('https://example.com/some/path/to/file', replacement),
	'https://backup2.example.com/some/path/to/file?token=dkfs1239414',
)
assert.equal(
	applyUriReplacement('https://b.example.com/another/path', replacement),
	'https://backup2.example.com/another/path?token=dkfs1239414',
)
```

For HLS, pass the stable ID of the variant stream or the rendition. A per-variant URI replaces the result of `HOST` and `PARAMS` (HLS spec, section 7.3):

```ts
import assert from 'node:assert'
import { applyUriReplacement } from '@svta/cml-content-steering'

const replacement = {
	HOST: 'cdn-c.example.com',
	'PER-VARIANT-URIS': { 'hd-1080': 'https://cdn-d.example.com/hd/1080.m3u8' },
}
const baseUri = 'https://cdn-a.example.com/main.m3u8'

assert.equal(
	applyUriReplacement('hd/1080.m3u8', replacement, { baseUri, stableVariantId: 'hd-1080' }),
	'https://cdn-d.example.com/hd/1080.m3u8',
)
assert.equal(
	applyUriReplacement('sd/540.m3u8', replacement, { baseUri, stableVariantId: 'sd-540' }),
	'https://cdn-c.example.com/sd/540.m3u8',
)
```

For DASH, put the `PARAMS` of a clone on the final request URI of each segment. A segment URI that resolves against a `BaseURL` loses the query of the `BaseURL`.

### Report a failed pathway

If all URIs of the selected pathway fail, call `penalize()`. The engine excludes that pathway for the penalty duration and selects the next pathway in the priority list. When the penalty ends, the engine selects again, so the player can return to the preferred pathway. `penalize()` also works before the first Steering Manifest, with the fallback priority list.

```ts
engine.penalize() // the selected pathway
engine.penalize('beta') // a specific pathway
```

### Handle errors

`onError` receives the request errors and the Steering Manifest errors. It also receives the exceptions of callbacks when no caller can receive them. A callback that throws inside `penalize()` or `update()` throws to the caller of that method.

```ts
import { SteeringErrorType } from '@svta/cml-content-steering'

// player is an object of the media player
function onError(error) {
	if (error.type === SteeringErrorType.CALLBACK) {
		player.reportBug(error.cause)
		return
	}

	player.log(`${error.url}: ${error.message}`)
}
```

### Stop and resume

`stop()` cancels the timers and ignores any response that arrives later. The engine keeps its state. `start()` resumes, and the next request waits until its scheduled time. The base spec requires a player to wait TTL seconds between requests. When the player unloads the content, call `stop()` and release the engine.

## Reference-level explanation

### New exports

| Export | Kind |
|---|---|
| `createSteeringEngine` | function |
| `applyUriReplacement` | function |
| `SteeringProtocol`, `STEERING_PROTOCOL_HLS`, `STEERING_PROTOCOL_DASH` | constants and type |
| `SteeringErrorType`, `STEERING_ERROR_TYPE_LOAD`, `STEERING_ERROR_TYPE_PARSE`, `STEERING_ERROR_TYPE_CALLBACK` | constants and type |
| `SteeringEngine`, `SteeringEngineConfig`, `SteeringRequester`, `SteeringError` | types |
| `UriReplacementOptions` | type |

`SteeringProtocol` and `SteeringErrorType` follow the const enum pattern of the repository. The package gets `@svta/cml-utils` as a peer dependency, for the `HttpRequest`, `HttpResponse`, and `ValueOf` types. The package imports only types from it.

### Configuration

```ts
type SteeringEngineConfig = {
	protocol: SteeringProtocol                              // 'hls' or 'dash'
	uri: string                                             // absolute URI of the first request
	pathways: readonly string[]                             // pathway IDs of the Content Description
	pathway?: string                                        // the pathway that the player applies now
	penalty?: number                                        // milliseconds. See Penalties
	queryBeforeStart?: boolean                              // no steering parameters on the first request
	requester?: SteeringRequester                           // default: fetch
	getThroughput?: (pathway: string) => number | undefined // bits per second
	getReportedPathways?: () => readonly string[]           // DASH only. See Requests
	acceptClone?: (clone: PathwayClone) => boolean          // false: the engine ignores the clone
	onPathwayChange?: (pathway: string) => void
	onManifest?: (manifest: SteeringManifest, clones: readonly PathwayClone[], context: { readonly url: string, readonly reloadUri: string }) => void
	onError?: (error: SteeringError) => void
}
```

`createSteeringEngine()` throws a `TypeError` for an invalid configuration. The message names the property, the expected value, and the received value. The checks:

- `protocol` is not `'hls'` or `'dash'`.
- `uri` is not an absolute URI.
- `pathways` is empty, or it contains a value that is not a string.
- `pathway` is not in `pathways`.
- `penalty` is negative or not finite.

The checks of `uri` and `pathways` depend on the Content Description. A player must catch the `TypeError` when the Content Description has, for example, no service locations.

### Engine

```ts
type SteeringEngine = {
	readonly pathway: string | undefined          // the selected pathway
	readonly priority: readonly string[]          // see Pathway selection
	start(): Promise<void>
	stop(): void
	penalize(pathway?: string): void              // default: the selected pathway
	update(changes: { readonly uri?: string, readonly pathways?: readonly string[], readonly priority?: readonly string[] }): void
}
```

`pathway` starts as the `pathway` of the configuration. `start()` sends a request if one is due, and otherwise schedules the next request. A request is due on the first call, and when the delay after the last response has passed. Its promise resolves when the engine has processed the response to that request, or at once if no request is due. A second call before `stop()` returns the same promise. `stop()` resolves a pending promise of `start()`.

`penalize()` and `update()` select a pathway before they return, so `onPathwayChange` runs synchronously inside them.

`update()` is the only method that changes the inputs of the engine. It has three optional values:

- `pathways` replaces the pathway IDs of the Content Description. The engine checks the clones of the current Steering Manifest again. Before the first valid Steering Manifest, it also builds the fallback priority list again.
- `uri` replaces the steering URI and the stored RELOAD-URI, at the next scheduled request. A `uri` equal to the configured one has no effect. After a 410, a new `uri` sends a request at once, because the base spec forbids more requests only for "that URI" (step 7A).
- `priority` replaces the priority list until the next valid Steering Manifest. The engine applies it after `pathways`.

`update()` throws a `TypeError` for the same `uri` and `pathways` values as `createSteeringEngine()`, and for a `priority` that is not an array of strings.

### Requests

```ts
type SteeringRequester = (request: HttpRequest) => Promise<HttpResponse>
```

The engine calls the requester with `url`, `method: 'GET'`, and `responseType: 'text'`. It reads `status`, `headers`, `data`, and `url` from the response:

- `data` is the response body, as a string or as a parsed JSON value.
- Header names match without regard to case.
- `url` is the final URI after redirects. If `url` is absent, the engine uses the request URI.
- A response without `status` counts as status 200.

The default requester uses `fetch`. A `Requester` function from `@svta/cml-request` has a compatible type. For a steering server on another origin, a browser exposes `Retry-After` only if the server lists the header in `Access-Control-Expose-Headers`.

The first request uses `uri`. Each later request uses the RELOAD-URI of the last valid Steering Manifest. If that Steering Manifest has no RELOAD-URI, the request uses the previous URI. A relative RELOAD-URI resolves against the URI of the response that contains it.

The engine adds two query parameters for the protocol:

| Parameter | HLS | DASH |
|---|---|---|
| pathway | `_HLS_pathway="<id>"` | `_DASH_pathway="<id>,<id>"` with the list of reported pathways |
| throughput | `_HLS_throughput=<integer>` | `_DASH_throughput=<integer>,<integer>` with one value for each listed pathway, empty when unknown |

- For DASH, the list of reported pathways is the result of `getReportedPathways`. Without that function, the list has every pathway that was selected at any time since the previous request, in order.
- The engine omits the pathway parameter when the list is empty, or for HLS when `pathway` is undefined.
- The engine omits the throughput parameter when no listed pathway has a throughput. A pathway has no throughput when `getThroughput` returns `undefined`, a negative value, or a value that is not finite.
- The engine rounds each throughput to an integer.
- Each parameter replaces a parameter of the same name in the URI. The engine keeps all other parts of the URI unchanged.
- With `queryBeforeStart`, the first request has no steering parameters.
- A `data` URI gets no steering parameters, because the parameters would change its content.

### Responses

| Response | Engine action | Next request |
|---|---|---|
| Status 2xx with a valid Steering Manifest | applies the Steering Manifest | after TTL seconds |
| Status 2xx with an invalid Steering Manifest | reports a `parse` error and keeps its state | after the previous TTL |
| Status 2xx with a VERSION other than 1, for DASH | reports a `parse` error and uses the fallback priority list (DASH spec, step 11) | none |
| Status 410 | reports a `load` error | none |
| Status 429 with a valid Retry-After | reports a `load` error. For DASH, the TTL becomes the Retry-After value (DASH spec, step 18) | after the Retry-After delay |
| Any other status, or a network error | reports a `load` error and keeps its state | after the previous TTL |

A Steering Manifest is valid when all of these conditions are true:

- The body parses as a JSON object.
- VERSION is 1. For DASH, a missing VERSION counts as a VERSION other than 1 (base spec, section 4).
- TTL is a positive number.
- PATHWAY-PRIORITY has at least one string. The engine keeps the first of each string and ignores other values.
- A relative RELOAD-URI resolves.

An invalid clone does not make the Steering Manifest invalid (see Clones). An absent or empty `PATHWAY-CLONES` array means no clones. `isValidSteeringManifest` does not change. It remains strict, for the check of what a steering server sends.

Until the first valid Steering Manifest, the previous TTL is `DEFAULT_TTL`. Retry-After can be a number of seconds, or an HTTP date that ends in `GMT`. A 429 without a valid Retry-After gets the same action as any other status.

The engine applies a valid Steering Manifest in this order:

1. It stores TTL, RELOAD-URI, and PATHWAY-PRIORITY.
2. It checks the clones, and calls `acceptClone` for each valid clone.
3. It calls `onManifest` with the accepted clones.
4. It selects a pathway.

After a 410, the engine keeps the priority list of the last valid Steering Manifest (base spec, step 7A). If no valid Steering Manifest arrived, the engine uses the fallback priority list: the selected pathway first, then `pathways` in their order.

```ts
type SteeringError =
	| {
		readonly type: typeof STEERING_ERROR_TYPE_LOAD | typeof STEERING_ERROR_TYPE_PARSE
		readonly url: string            // the request URI
		readonly status?: number        // the HTTP status, if the server responded
		readonly cause?: unknown        // the exception, for network and JSON errors
		readonly message: string
		readonly retryDelay?: number    // milliseconds until the next request. Absent when no request follows
	}
	| {
		readonly type: typeof STEERING_ERROR_TYPE_CALLBACK
		readonly callback: 'acceptClone' | 'getReportedPathways' | 'getThroughput' | 'onManifest' | 'onPathwayChange'
		readonly cause: unknown         // the exception of the callback
		readonly message: string
	}
```

`load` matches the SVTA2070 code `2040` (content steering manifest load error), and `parse` matches `2041` (unable to parse content steering manifest). `callback` is an error of the player and has no SVTA2070 code. To read `url`, `status`, or `retryDelay`, a player first checks that `type` is not `callback`.

### Callback errors

The engine never calls `console`. It handles an exception from a callback like the CMCD session API RFC ([#455](https://github.com/streaming-video-technology-alliance/common-media-library/pull/455)):

- **With a caller.** A callback that throws inside `penalize()` or `update()` throws to the caller, after the engine has finished the call.
- **Without a caller.** A callback that throws after a response, in a timer, or inside `start()` goes to `onError` as a `callback` error. The engine continues. For example, it still selects a pathway after `onManifest` throws.
- **Without `onError`.** The engine throws the exception from a timer callback, so the host reports it. The engine also throws an exception of `onError` itself from a timer callback.

`start()` never throws. The engine rejects none of its own promises.

### Pathway selection

A pathway is known when `pathways` contains it, or when it is an accepted clone of the current Steering Manifest. The engine selects the first pathway in the priority list that is known and not penalized. If no pathway qualifies, the selection does not change (base spec, step 5).

Before the first valid Steering Manifest, the priority list is the fallback priority list when `pathway` is set. Without `pathway`, the list is empty, so the engine selects nothing before the first Steering Manifest.

`priority` returns the selected pathway first, then the other pathways of the priority list that are known and not penalized, in order.

### Clones

The engine checks the clones of each valid Steering Manifest in array order. A clone is valid when all of these conditions are true:

- The clone has a string `ID`, a string `BASE-ID`, and a `URI-REPLACEMENT` object (`isValidPathwayClone`).
- `BASE-ID` is a known pathway or the `ID` of an earlier valid clone.
- `ID` is a legal pathway ID (base spec, section 2).
- No pathway in `pathways` and no earlier valid clone has the same `ID`.
- `HOST` is absent, or it is a hostname without a port.
- Each `PARAMS` name is not empty, and each value is a string.

The engine ignores a clone that is not valid, and a valid clone that `acceptClone` refuses. Only the clones of the current Steering Manifest are known (base spec, section 5). If a later Steering Manifest omits a clone, the engine stops selecting it. If a clone keeps its `ID` but changes its `URI-REPLACEMENT`, the player must build the URIs again. The player finds the change by comparing the clones of `onManifest`.

### Penalties

`penalize()` excludes a pathway from the selection until the penalty ends. The default duration depends on the protocol:

| Protocol | Default penalty duration |
|---|---|
| HLS | `DEFAULT_PATHWAY_PENALTY`, 5 minutes |
| DASH | the TTL of the last valid Steering Manifest (DASH spec, step 19), or `DEFAULT_TTL` |

The `penalty` property of the configuration replaces the default for both protocols. A new Steering Manifest does not end a penalty, and `update()` does not end a penalty either. When a penalty ends, the engine selects a pathway again (base spec, step 4). A second call for the same pathway restarts its penalty.

### URI replacement

```ts
type UriReplacementOptions = {
	baseUri?: string           // resolves a relative uri
	stableVariantId?: string   // HLS STABLE-VARIANT-ID of the variant stream
	stableRenditionId?: string // HLS STABLE-RENDITION-ID of the rendition
}

function applyUriReplacement(uri: string, replacement: UriReplacement, options?: UriReplacementOptions): string
```

`applyUriReplacement` follows these steps:

1. If `PER-VARIANT-URIS` has `stableVariantId`, or `PER-RENDITION-URIS` has `stableRenditionId`, return that URI (HLS spec, section 7.3).
2. Resolve `uri` against `baseUri`.
3. If `HOST` is present, replace the hostname. The port does not change. The function normalizes `HOST` like a URL hostname: lowercase ASCII, and punycode for an internationalized name.
4. Take the `PARAMS` names in code point order, which is the same as UTF-8 order. For each name, replace the existing query parameter of that name, or append a new parameter. The server sends names and values percent-encoded (base spec, section 5), so the function does not encode them again.
5. Return the absolute URI.

The function throws a `TypeError` when `uri` is relative and `baseUri` is absent, or when `HOST` is not a hostname. A DASH player passes no stable IDs. The DASH spec tells the player to ignore the per-variant and per-rendition keys (step 13).

### Changes to existing exports

`UriReplacement` gets two optional HLS keys:

```ts
type UriReplacement = {
	HOST?: string
	PARAMS?: Record<string, string>
	'PER-VARIANT-URIS'?: Record<string, string>
	'PER-RENDITION-URIS'?: Record<string, string>
}
```

The package documentation links to the spec versions of this RFC.

## Drawbacks

- The engine owns its timers. A player cannot run the request timer on its own scheduler.
- The player still does the work that needs its model of the content. This work includes applying the pathway, creating clones, and detecting failures.
- `@svta/cml-utils` becomes the first peer dependency of the package. The package imports only types from it.
- The HLS and DASH rules ship together, so a player that uses one protocol also bundles the rules of the other.
- The engine is larger than the steering code of the players. The table shows the sizes of a local prototype, built with rolldown.
- `SteeringError` is a union, so a player checks `type` before it reads `url`, `status`, or `retryDelay`.
- Some wire behavior differs from the current players. The differences are the quotes in `_HLS_pathway`, the PARAMS values without a second encoding, and the base URI of RELOAD-URI. A steering server that depends on one player can see a difference.

| Import | Minified | gzip |
|---|---|---|
| `createSteeringEngine` and `applyUriReplacement` | 9.1 KB | 3.8 KB |
| `applyUriReplacement` only | 1.3 KB | 0.8 KB |

## Rationale and alternatives

- **Three public layers.** The earlier design proposed 17 new exports in three layers: pure functions, a state processor without I/O, and the engine. No player has asked for the lower layers. A later release can export them without a breaking change, but a later removal is a breaking change.
- **A processor without I/O.** Each player would implement the timers, the rules for error responses, and the RELOAD-URI resolution. The Motivation table shows that these parts differ the most between the players.
- **Protocol descriptor objects.** The earlier design used `HLS_CDP` and `DASH_CDP` objects with format callbacks. The protocols differ in behavior as well as format, for example in the 429 rule and the penalty duration. A descriptor would need a callback for each difference. A `protocol` value keeps both behaviors inside the package, where the tests cover them. No third protocol uses content steering today.
- **A class.** `createSteeringEngine` returns an object type, like `createCmcdSession` in the CMCD session API RFC ([#455](https://github.com/streaming-video-technology-alliance/common-media-library/pull/455)). The implementation can change without a change to the public type.
- **An injected scheduler.** Tests use the mock timers of `node:test`, like the tests of `CmcdReporter`. A player controls the request timing with `start()` and `stop()`.
- **Cancellation.** `HttpRequest` has no abort signal. `stop()` ignores late responses instead.
- **A `setPriority()` method.** The `priority` getter returns the effective order, not the list that a player sets. A method named as a pair of the getter would suggest that the getter returns that list. `update({ priority })` keeps one method for every input of the engine.
- **A `refresh()` method.** dash.js has a public `triggerSteeringRequest()` that always sends a request. The base spec says that the client MUST wait TTL seconds before it reloads. So this RFC has no method to force a request. The dash.js player can map `triggerSteeringRequest()` to `start()`.
- **A list for `pathway`.** `@defaultServiceLocation` can be a list. The player can pass the first value that is in `pathways`.
- **A `destroy()` method.** `update()` removes the need to replace an engine. `stop()` and the release of the reference end an engine.
- **An engine without `uri`.** hls.js also fails over between redundant streams without content steering. That behavior is not content steering, so this RFC keeps `uri` required.
- **A second `onPathwayChange` for a changed clone.** `onPathwayChange` means that the selection changed. `onManifest` gives every clone definition, so the player can compare.
- **Accepted clone IDs as the return value of `onManifest`.** The lint rules of the repository forbid a `void` union. A return type without `void` would reject the usual callback without a `return`. `acceptClone` gives the same control.
- **Callback errors through `console`.** CML never logs from code that runs in a player. The error rule of the CMCD session API RFC applies instead.

## Prior art

- The design record compares the four players of the Motivation table rule by rule, with links to fixed commits.
- The integration map describes the adoption in each player, with the requester adapters and the changes to the tests.
- A 2024 prototype by Qualabs, on the `content-steering-refactoring` branch of `qualabs/common-media-library`, added a request function and a URL builder. It was not merged.
- The `requester` argument of `CmcdReporter` and the CMCD session API RFC use the same function type, with the `HttpRequest` type.

## Unresolved questions

1. **Quotes in `_HLS_pathway`.** The HLS spec, section 7.4, shows the pathway ID in quotes. hls.js, Shaka Player, and VHS send it without quotes. This RFC follows the spec text. Should the engine match the players instead?
2. **HLS penalty duration.** This RFC keeps `DEFAULT_PATHWAY_PENALTY`, which is also the value of hls.js. The HLS spec, section 7.5, says that two minutes is generally enough. Which default is better?
3. **End of steering in DASH.** The DASH spec abandons all steering in two cases:
   - A VERSION other than 1 (step 11).
   - A 410 response to the first request (step 17).

   This RFC keeps the pathway selection with the fallback priority list instead, so `penalize()` continues to work. Is this interpretation acceptable?
4. **SVTA2070 codes.** `SteeringErrorType` documents the codes `2040` and `2041`. Should `SteeringError` also include the codes as numbers? That change adds a peer dependency on `@svta/cml-error-codes`.
5. **Release tag.** The package exports use `@beta`, and the repository rules require `@public`. Should the engine ship as `@beta` until a player uses it, and as `@public` in version 1.0?

## Future possibilities

- Export the Steering Manifest parser and the pathway selection, if a player needs its own request loop.
- An `onPriorityChange` callback, if a player needs a push instead of the `priority` getter.
- A `refresh()` method, if DASH-IF needs the current behavior of `triggerSteeringRequest()`.
- Support the DASH `proxyServerURL` attribute if a published DASH spec defines it. Only the 2022 community review draft of DASH-IF defines it today.
- Add the SVTA2070 codes to `SteeringError` (see unresolved question 4).

## Revision history

- v1 (2026-09-28): initial draft. It replaces an unpublished design from April 2026. The design record lists the changes.
- v2 (2026-09-28): maintainer decisions on the findings of the integration map:
  - New methods: `update()` and `setPriority()`. New getter: `priority`.
  - New options: `queryBeforeStart`, `getReportedPathways`, and `acceptClone`.
  - `onManifest` gets a context argument with `url` and `reloadUri`.
  - The fallback priority list applies from creation when `pathway` is set.
  - The engine checks the Steering Manifest with its own rules. It skips invalid clones, and it accepts an empty `PATHWAY-CLONES` array.
  - A response without `status` counts as status 200.
  - Callback errors follow the rule of the CMCD session API RFC. `SteeringError` becomes a union with a `callback` type, and `SteeringErrorType` names the types.
  - The RFC documents the synchronous selection, the `data` URI rule, the checks that depend on the content, the DASH `PARAMS` rule, and the measured sizes.
- v3 (2026-09-28): `setPriority()` becomes the `priority` value of `update()`, so one method changes every input of the engine.

## Final Decision

Pending review.
