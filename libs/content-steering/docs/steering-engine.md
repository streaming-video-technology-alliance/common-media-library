---
title: Steering Engine
description: Integrate the content steering engine into an HLS or DASH player
---

# Steering Engine

`createSteeringEngine` runs the content steering client of a player. The engine requests the Steering Manifest, keeps the request schedule, and selects the pathway that the player applies. The player keeps its own model of the pathways and applies the selection. This guide covers the integration steps. The TSDoc of each export has the contract.

The engine follows the HLS specification, section 7, and the DASH-IF content steering specification, ETSI TS 103 998, clause 7.

## Create the engine

Create one engine for each Content Description that declares content steering. The Content Description is the HLS multivariant playlist or the DASH MPD. The player reads three values from it.

| Property | HLS | DASH |
|---|---|---|
| `uri` | `SERVER-URI` of `EXT-X-CONTENT-STEERING`, resolved against the playlist URI | text of the `ContentSteering` element, resolved against the MPD URI |
| `pathways` | every `PATHWAY-ID` of the variant streams, and `.` for a variant stream without one | every `@serviceLocation` of the `BaseURL` and `Location` elements |
| `pathway` | `PATHWAY-ID` of `EXT-X-CONTENT-STEERING` | the `@defaultServiceLocation` value that the player applies |

`requester` sends the requests. `fetchRequester` uses `fetch`. A player with its own request layer passes a function that returns a promise of the response. `getThroughput` returns the throughput estimate of the player for a pathway, in bits per second.

```typescript
import { createSteeringEngine, fetchRequester } from '@svta/cml-content-steering'

const engine = createSteeringEngine({
	protocol: 'dash',
	uri: 'https://steering.example.com/dash?video=42',
	pathways: ['alpha', 'beta'],
	pathway: 'alpha',
	queryBeforeStart: true,
	requester: fetchRequester,
	getThroughput: (pathway) => abr.getEstimate(pathway),
	onManifest: (manifest, clones) => player.addClones(clones),
	onPathwayChange: (pathway) => player.applyPathway(pathway),
	onError: (error) => player.log(error.message),
})
```

`abr` and `player` are objects of the media player.

## Start the requests

The engine sends no request until `start()`. The protocol decides when to call `start()`:

- HLS: after the multivariant playlist loads.
- DASH with `@queryBeforeStart` set to `true`: before playback starts. Set `queryBeforeStart: true`, so the first request has no steering query parameters. Wait for the promise of `start()` before the player selects a `BaseURL`.
- DASH in all other cases: after playback starts and the buffer reaches its target level.

```typescript
await engine.start()
```

The promise of `start()` resolves when the engine has processed the response. The promise never rejects. The engine adds the steering query parameters to each request: `_HLS_pathway` and `_HLS_throughput` for HLS, `_DASH_pathway` and `_DASH_throughput` for DASH. After a response, the engine waits TTL seconds before the next request.

## Apply the selected pathway

The engine selects a pathway after each Steering Manifest, after each penalty, and when a penalty ends. When the selection changes, the engine calls `onPathwayChange`. The player must then use only the URIs of that pathway. `engine.pathway` returns the current selection.

`engine.priority` returns the whole order: the selected pathway first, then the other known pathways that are not penalized. A DASH player uses the list to select a `BaseURL` for each node of the MPD. The player also uses the list to select a `Location` for MPD updates. A player can replace the list with `update({ priority })`, for example from an application setting. The next valid Steering Manifest replaces that list again.

```typescript
console.log(engine.pathway) // the selected pathway
console.log(engine.priority) // the selected pathway first, then the other pathways
```

## Update the pathways

A DASH MPD update can add service locations or change the steering URI. Call `update()` with the new values. The engine keeps its penalties and its request schedule. It also keeps the accepted clones whose base pathway is still known. A clone that becomes valid through `update()` waits for the next Steering Manifest. After the end of steering, a new `uri` sends a request at once.

For DASH, `pathways` are the `@serviceLocation` values of the MPD. If the list also holds the clone IDs, the engine ignores those clones, because a clone ID must not be a pathway ID.

```typescript
engine.update({ pathways: ['alpha', 'beta', 'gamma'] })
engine.update({ uri: 'https://steering2.example.com/dash?video=42' })
```

## Create clones

A Steering Manifest can define pathway clones. A clone copies an existing pathway and changes the host or the query parameters of its URIs. The engine does not create clones. It checks them and makes their IDs selectable. The engine passes the valid clones to `onManifest`. The player creates each clone in its own model and builds the URIs with `applyUriReplacement`. The engine calls `onManifest` before `onPathwayChange`, so a clone exists before the engine selects it. If the player cannot create a clone, `acceptClone` returns `false` for it, and the engine ignores the clone.

The example uses the clone of the Content Steering specification, draft-pantos-content-steering, section 8.2:

```typescript
import { applyUriReplacement } from '@svta/cml-content-steering'

const replacement = { HOST: 'backup2.example.com', PARAMS: { token: 'dkfs1239414' } }

console.log(applyUriReplacement('https://example.com/some/path/to/file', replacement))
// https://backup2.example.com/some/path/to/file?token=dkfs1239414
console.log(applyUriReplacement('https://b.example.com/another/path', replacement))
// https://backup2.example.com/another/path?token=dkfs1239414
```

For HLS, pass the stable ID of the variant stream or the rendition. A per-variant URI replaces the result of `HOST` and `PARAMS` (HLS specification, section 7.3):

```typescript
import { applyUriReplacement } from '@svta/cml-content-steering'

const replacement = {
	HOST: 'cdn-c.example.com',
	'PER-VARIANT-URIS': { 'hd-1080': 'https://cdn-d.example.com/hd/1080.m3u8' },
}
const baseUri = 'https://cdn-a.example.com/main.m3u8'

console.log(applyUriReplacement('hd/1080.m3u8', replacement, { baseUri, stableVariantId: 'hd-1080' }))
// https://cdn-d.example.com/hd/1080.m3u8
console.log(applyUriReplacement('sd/540.m3u8', replacement, { baseUri, stableVariantId: 'sd-540' }))
// https://cdn-c.example.com/sd/540.m3u8
```

For DASH, put the `PARAMS` of a clone on the final request URI of each segment. A segment URI that resolves against a `BaseURL` loses the query of the `BaseURL`.

## Report a failed pathway

If all URIs of the selected pathway fail, call `penalize()`. The engine excludes that pathway for the penalty duration and selects the next pathway in the priority list. When the penalty ends, the engine selects again, so the player can return to the preferred pathway. `penalize()` also works before the first Steering Manifest, with the fallback priority list. A player may also call `penalize()` inside `onPathwayChange`, to refuse a pathway that it cannot play.

The default penalty is `DEFAULT_PATHWAY_PENALTY` for HLS and the current TTL for DASH. The `penalty` option of the configuration replaces both defaults.

```typescript
engine.penalize() // the selected pathway
engine.penalize('beta') // a specific pathway
```

## Handle errors

`onError` receives the request errors and the Steering Manifest errors. It also receives the exceptions of callbacks when no caller can receive them. A callback that throws inside `penalize()` or `update()` throws to the caller of that method. Without `onError`, the engine throws a callback exception from a timer callback.

`error.type` is a `SteeringErrorType` value: `load` for a request failure, `parse` for an invalid Steering Manifest, and `callback` for an exception of a callback. A `load` or `parse` error has `url`, `status`, `cause`, and `retryDelay`. `retryDelay` is absent when no request follows.

```typescript
import { SteeringErrorType, type SteeringError } from '@svta/cml-content-steering'

function onError(error: SteeringError): void {
	if (error.type === SteeringErrorType.CALLBACK) {
		player.reportBug(error.cause)
		return
	}

	player.log(`${error.url}: ${error.message}`)
}
```

The engine ends the requests after a 410 response, and after a DASH Steering Manifest with a VERSION other than 1. The message of that error ends with "No request follows." A new `uri` through `update()` starts the requests again.

## Stop and resume

`stop()` cancels the timers and ignores any response that arrives later. The engine keeps its state. The engine does not cancel a request in flight, and the next `start()` sends a new request. `start()` resumes, and the next request waits until its scheduled time. If the player must not send requests while the media is ended or detached, call `stop()` in that state. Call `start()` when playback resumes. If a request is overdue, `start()` sends it at once. When the player unloads the content, call `stop()` and release the engine.

```typescript
engine.stop()
await engine.start()
```
