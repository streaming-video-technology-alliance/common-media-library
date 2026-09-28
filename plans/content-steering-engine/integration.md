# Content steering engine: integration map

This document records how four web players would adopt the engine of the [RFC](../../rfc/content-steering-engine.md). The implementation plan builds a local spike for each player and checks the findings here. Revision v2 of the RFC applies the decisions of the "Gaps in the API" section.

Four analyses read each player at the commits of the [design record](architecture.md). The analyses give `file:line` references at those commits. The hls.js analysis also built hls.js with a prototype of the engine and ran the hls.js unit tests. The dash.js analysis ran the proposed controller against the dash.js modules with a stub engine. The Shaka Player and VHS analyses read the code only.

## Summary

| Player | Fit | Code change (estimate) | Blockers with RFC v1 | Status with RFC v2 |
|---|---|---|---|---|
| hls.js | The request loop and the clone URIs fit. | 624 lines become 653. | No failover before the first Steering Manifest. No way to support the `hls.pathwayPriority` setter. | Resolved by the fallback priority list and `setPriority()`. |
| dash.js | The request loop, the validation, and the 410 and 429 rules fit. They fix real dash.js bugs. | About 50 lines fewer. | One selected pathway does not fit a BaseURL selection for each node. The `_DASH_pathway` list, `@queryBeforeStart`, a forced request, and MPD updates are not possible. | Resolved by `priority`, `getReportedPathways`, `queryBeforeStart`, and `update()`. `triggerSteeringRequest()` maps to `start()`, because the RFC has no `refresh()`. |
| Shaka Player | The engine fits the location model, where Shaka asks for URIs when it needs them. | The steering manager shrinks. The total code grows, because of a port. | The Closure build cannot use the npm module. Shaka has no read access to the priority list or the penalties. | `priority` resolves the API gap. The Closure port remains. |
| VHS | The engine fits the exclusion model. | About 720 lines become 230. | None in the API. The build needs Babel for `@svta/*` and must inline CML. | `acceptClone` and `update()` remove two workarounds. The build changes remain. |

In all four players, the gain is spec compliance and shared maintenance, not smaller code. The engine is larger than the controllers it replaces:

| Measurement | Minified | Compressed |
|---|---|---|
| Engine and `applyUriReplacement`, rolldown (plan Task 3) | 7.6 KB | 3.2 KB gzip |
| Engine in the hls.js build | 7.8 KB | 2.9 KB brotli |
| hls.js light build, growth | | 2.4 KB brotli |
| Current Shaka steering manager, rolldown | 4.1 KB | 1.3 KB gzip |

## Gaps in the API

Each row names the players that need the change. Severity is the highest severity among those players.

| # | Gap | Players | Severity | Proposal | Decision (RFC v2) |
|---|---|---|---|---|---|
| 1 | `uri` and `pathways` are fixed at creation. A new engine loses the penalties, the clones, and the wait for the TTL. | all four | blocker for DASH live streams with many periods | `update({ uri?, pathways? })`, which keeps the timers and the penalties | accepted: `update()` |
| 2 | The player cannot read the ordered priority list. dash.js needs it for each BaseURL node and for `Location` elements. Shaka needs it for its failover lists. | dash.js, Shaka, hls.js | blocker | `readonly priority: readonly string[]`: the known pathways that are not penalized, in order, including the fallback list | accepted: `priority` |
| 3 | The engine is stricter than the specs. One invalid clone, or an empty `PATHWAY-CLONES` array, rejects the whole Steering Manifest. ETSI TS 103 998 Table 6.3-1 lets PATHWAY-PRIORITY be absent. | all four | workaround exists | Check VERSION, TTL, and PATHWAY-PRIORITY. Skip each invalid clone. Treat an empty `PATHWAY-CLONES` array as no clones. | accepted |
| 4 | `penalize()` cannot fail over before the first valid Steering Manifest, because the priority list is empty. In hls.js the error then becomes fatal. | hls.js, dash.js | blocker | Use the fallback priority list from creation. | accepted |
| 5 | Exceptions in callbacks go to `console.error`. | all four | cosmetic | Report them through `onError`. | accepted, with the rule of the CMCD session API RFC and `SteeringErrorType` |
| 6 | `onManifest` has no URL context. | hls.js, dash.js, VHS | cosmetic | `onManifest(manifest, clones, { url, reloadUri })` | accepted |
| 7 | `createSteeringEngine` throws for values that come from the Content Description, such as an empty `pathways` list. Each player must catch the `TypeError`. | hls.js, Shaka, VHS | workaround exists | Document which checks depend on the content. | accepted: documented |
| 8 | `pathway` is one value, but `@defaultServiceLocation` is a list. | dash.js, Shaka | workaround exists | `pathway?: string \| readonly string[]` | rejected: the player passes the first value that is in `pathways` |
| 9 | The priority list cannot be set. hls.js has a public `pathwayPriority` setter. | hls.js | blocker | `setPriority(priority)` | accepted |
| 10 | For DASH, `_DASH_pathway` must list every service location that the player used (DASH spec, step 7). The engine knows only its own selections. | dash.js | blocker | `getReportedPathways?: () => readonly string[]` | accepted |
| 11 | A first request without parameters (`@queryBeforeStart`) requires an absent `pathway`. After a failed first request, `penalize()` without an argument does nothing. | dash.js | blocker | `queryBeforeStart?: boolean` | accepted |
| 12 | No request can be forced. The dash.js method `triggerSteeringRequest()` is public. | dash.js | blocker | `refresh(): Promise<void>`, with no effect after a 410 | rejected: the base spec requires the wait for the TTL |
| 13 | A player cannot refuse a clone that it cannot build. The engine can then select a pathway that the player never applied. | VHS | workaround exists | `onManifest` returns the IDs of the clones that the player built. | accepted as the `acceptClone` option |
| 14 | A requester result without `status` counts as a failure. The Shaka data URI plugin returns no status. | Shaka | workaround exists | Treat a missing status as 200. | accepted |
| 15 | `stop()` can be resumed, so an old listener can restart an engine that the player replaced. | VHS | workaround exists | A final `destroy()` | rejected: `update()` removes the need |
| 16 | The engine needs a steering server. hls.js also fails over between redundant streams without content steering. | hls.js | workaround exists | An optional `uri`, for selection and penalties only | rejected: not content steering |
| 17 | When the selected clone changes its `URI-REPLACEMENT`, no callback runs. | hls.js | workaround exists | Call `onPathwayChange` again, or report the changed clone IDs. | rejected: the player compares the clones of `onManifest` |
| 18 | The RFC does not say that `penalize()` calls `onPathwayChange` synchronously, or that a `data` URI gets no steering parameters. hls.js depends on the first rule. | hls.js, VHS | cosmetic | Document both rules. | accepted: documented |
| 19 | For DASH, `PARAMS` must go on the final request URI. A segment URI that resolves against a BaseURL loses the query of the BaseURL. | dash.js, Shaka | cosmetic | Say so in the guide of the RFC. | accepted: documented |

Gaps 1, 2, 3, and 4 affect most players. Together they are the smallest change that removes most blockers. Revision v2 of the RFC accepts 14 of the 19 proposals and rejects 5.

## Findings outside the API

- **Exact peer versions.** The publish script changes each `"*"` peer to an exact version (`scripts/publish.ts`). The hls.js and dash.js packages pin older `@svta/*` versions. A new package with `@svta/cml-utils` 1.6.1 as a peer then fails with `ERESOLVE`. Both players would have to upgrade every `@svta/*` package at once. The engine imports only types from `@svta/cml-utils`. Decision: the peer dependency remains.
- **Syntax level.** The published packages contain ES2020 syntax (`??`, `?.`), although `tsconfig.json` sets ES2019. `@svta/cml-cmcd` 2.7.0 has 25 `??` and 21 `?.`. VHS supports Chrome 53 and does not transpile `node_modules`. Proposal: choose a syntax target for all CML packages, and set it for tsdown.
- **Babel loose mode.** hls.js transpiles `@svta/*` code to ES5 in loose mode. In that mode, `Math.min(...map.values())` becomes `Math.min.apply(Math, iterator)`, which returns `Infinity`. The penalty timer then never fires. An `async` function also adds the regenerator runtime. The Phase 1 code of the plan avoids both constructs, and a loose ES5 build of the engine was checked. Proposal: add both rules to `.claude/rules/code-quality.md`.
- **ES modules only.** VHS also ships a CommonJS build. It must inline CML, because a `require()` of an ES module fails before Node 20.19 and 22.12.
- **Release tags.** hls.js adds CML packages to `bundledPackages` in its API Extractor configuration. Then the `@beta` tags cause `ae-incompatible-release-tags`. This finding is evidence for unresolved question 5 of the RFC.
- **Closure Compiler.** Shaka compiles one Closure input with ADVANCED renaming and conformance rules. The rules forbid `setTimeout` and `fetch`. PR #10060 ported `@svta/cml-cmcd` by hand to `third_party/cml-cmcd`. A port of the engine needs bracket access for the JSON fields, no `fetchRequester`, and `shaka.util.Timer` or a conformance exception.

## hls.js

**Where.** `ContentSteeringController` in `src/controller/content-steering-controller.ts` creates the engine in `filterParsedLevels`, the first point with levels filtered by codec. The values are:

- `uri`: `contentSteering.uri`, which is SERVER-URI resolved against the playlist.
- `pathways`: `this.pathways()`, including the IDs `..` and `...` of redundant streams.
- `pathway`: `contentSteering.pathwayId`, or the pathway of `levels[0]` when no level has that ID.
`startLoad` calls `start()`. `stopLoad`, `loadSource`, and fatal errors call `stop()` and abort the request. MEDIA_DETACHING calls `stop()`, and MEDIA_ATTACHED calls `start()`.

**Requester.** The adapter wraps `config.loader` with `LoaderContextType.STEERING_MANIFEST` and `steeringManifestLoadPolicy`. `LoaderResponse` has no headers, so the adapter reads `Retry-After` from `networkDetails`. It reads the XMLHttpRequest with `getAllResponseHeaders()` and the fetch `Response` with `headers`. `XhrLoader.getResponseHeader` returns only numbers, so it would lose an HTTP date. The loader retry policy still applies. Its delays add to the delays of the engine.

```ts
function createLoaderRequester(hls: Hls, onLoad: (load: SteeringLoad | null) => void): SteeringRequester {
	return (request) => new Promise<HttpResponse>((resolve, reject) => {
		const config = hls.config
		const loader = new config.loader(config) as Loader<LoaderContext>
		const context: LoaderContext = { type: LoaderContextType.STEERING_MANIFEST, responseType: 'json', url: request.url, headers: request.headers }
		const loadPolicy = config.steeringManifestLoadPolicy.default
		const retry = loadPolicy.errorRetry || loadPolicy.timeoutRetry || {}
		const loaderConfig: LoaderConfiguration = {
			loadPolicy,
			timeout: loadPolicy.maxLoadTimeMs,
			maxRetry: retry.maxNumRetry || 0,
			retryDelay: retry.retryDelayMs || 0,
			maxRetryDelay: retry.maxRetryDelayMs || 0,
		}
		const settle = () => {
			onLoad(null)
			loader.destroy()
		}

		onLoad({ loader, url: request.url, reject })
		loader.load(context, loaderConfig, {
			onSuccess: (response, stats, context, networkDetails) => {
				const headers = getResponseHeaders(loader, networkDetails)
				settle()
				resolve({ request, url: response.url || undefined, status: response.code || 200, headers, data: response.data })
			},
			onError: (error, context, networkDetails) => {
				const headers = getResponseHeaders(loader, networkDetails)
				settle()
				if (!error.code) {
					reject(new Error(`${error.text || 'Network error'} (${context.url})`))
					return
				}
				resolve({ request, status: error.code, headers })
			},
			onTimeout: (stats, context) => {
				settle()
				reject(new Error(`Timeout loading the Steering Manifest (${context.url})`))
			},
		})
	})
}
```

**Callbacks.** `onManifest` stores PATHWAY-PRIORITY for the `pathwayPriority` getter, updates the clones, and triggers STEERING_MANIFEST_LOADED. `onPathwayChange` filters the levels by pathway and triggers LEVELS_UPDATED. The ERROR listener calls `engine.penalize(errorPathway)` and sets `errorAction.resolved` when the selection changed. This logic needs the synchronous `onPathwayChange` of gap 18. With RFC v2, the `pathwayPriority` setter calls `setPriority()`, and `penalize()` fails over before the first Steering Manifest.

**Clones.** `applyUriReplacement` replaces `performUriReplacement`, with `stableVariantId` for levels and `stableRenditionId` for renditions. hls.js keeps the group renaming, the level duplication, and the rendition copies. Clones now live for one Steering Manifest, so the controller compares each list with the previous one. A rendition without a URI (`''`) must skip `applyUriReplacement`, which throws for it.

**Test impact.** The prototype passed `tsc`, `eslint`, and `es-check`. The unit suite had 1203 passes and 7 failures. Each failure is a behavior change: the quotes in `_HLS_pathway`, the stricter clone checks, the clone lifetime, and gaps 4 and 9. The test helper for steering must become async and advance fake timers.

## dash.js

**Where.** Keep the `ContentSteeringController` singleton and its public methods. `loadSteeringData()` creates the engine on its first call and returns `engine.start()`. The values are:

- `uri`: `urlUtils.resolve(serverUrl.trim(), manifest.url)`. Today the element text is used unresolved.
- `pathways`: the unique `@serviceLocation` values of the BaseURL elements at every level, and of `Location` and `PatchLocation`.
- `pathway`: the first `defaultServiceLocationArray` entry that is in `pathways`. Omit it when `@queryBeforeStart` is true.
With RFC v2, MANIFEST_UPDATED calls `update()` with the resolved URI and the service locations. The controller passes its default service location as `pathway`, with `queryBeforeStart`. It passes its location tracking as `getReportedPathways`.

**Requester.** A new `src/dash/utils/ContentSteeringRequester.js` wraps `URLLoader` with the request type `ContentSteering`. That type keeps CMCD, Annex I parameters, credentials, and the request interceptors. On failure, HTTPLoader passes a `CommonMediaResponse` with `status`, `url`, and lower-case headers, so `retry-after` reaches the engine. The request type has no retry setting in dash.js, so the schedule of the engine is the only retry.

```js
function load(httpRequest) {
    return new Promise((resolve, reject) => {
        const request = new ContentSteeringRequest(httpRequest.url);
        request.responseType = httpRequest.responseType || 'text';
        request.headers = Object.assign({}, httpRequest.headers);
        lastRequestUrl = httpRequest.url;

        urlLoader.load({
            request,
            success: (data, statusText, responseUrl) => {
                resolve({ request: httpRequest, url: responseUrl || request.url, status: 200, headers: {}, data });
            },
            error: (requestObject, errorType, statusText, response) => {
                if (!response || !response.status) {
                    reject(new Error(`Content steering request failed: ${statusText || errorType}`));
                    return;
                }
                resolve({ request: httpRequest, url: response.url || request.url, status: response.status, headers: response.headers || {}, data: response.data });
            },
            abort: () => {
                reject(new Error('Content steering request aborted'));
            }
        });
    });
}
```

**Callbacks.** `onManifest` builds the public `ContentSteeringResponse` and triggers CONTENT_STEERING_REQUEST_COMPLETED, so StreamController rebuilds the BaseURL tree with the clones. `onPathwayChange` only logs, because BaseURLSelector asks ContentSteeringSelector at each `resolve()`. SERVICE_LOCATION_BASE_URL_BLACKLIST_ADD calls `engine.penalize(entry)`. dash.js keeps BlacklistController for the DVB and basic selectors. `LocationSelector` keeps the PATHWAY-PRIORITY of the last response. With RFC v2, ContentSteeringSelector reads `engine.priority` for each BaseURL node.

**Clones.** HOST goes on the synthesized BaseURL or `Location` through `applyUriReplacement`. The controller keeps `PARAMS` in `queryParams`, and HTTPLoader adds them to the final request URI (gap 19). HTTPLoader can also call `applyUriReplacement(url, { PARAMS })` to replace same-name parameters without a second encoding.

**Behavior changes.** No dash.js test covers RELOAD-URI, the timer, VERSION, penalties, or the error statuses. Six of the 32 controller tests change. The fixtures use the string VERSION `'1'`, the HOST of a clone has a scheme, and the `_DASH_pathway` tracking moves. Today a 404 ends steering, a failed first request ends steering, and a 429 without a number stops the timer.

## Shaka Player

**Packaging.** The npm module cannot enter the compiled build. The recommended path is a hand port under `third_party/cml-content-steering`, like PR #10060 for CMCD. A runtime plugin (`manifest.contentSteering` in the configuration, like LCEVC) is good for the spike. It is wrong for the product, because steering works today without configuration.

**Where.** DASH: `processManifest_` in `lib/dash/dash_parser.js`. It resolves the `ContentSteering` text against the first manifest base URI, and then applies the `steering` request parameter. It collects `@serviceLocation` from `Location` and every BaseURL before `parsePeriods_`. `@queryBeforeStart` makes the parser wait for `start()`. HLS: `processContentSteering_` in `lib/hls/hls_parser.js`. It collects the pathways from the `EXT-X-STREAM-INF` tags, with `.` for a tag without PATHWAY-ID. The first fetch keeps blocking the parse.

**Requester.** The adapter uses `NetworkingEngine` with `RequestType.CONTENT_STEERING`, so request filters and the CMCD hook still run. It sets `maxAttempts: 1`, because NetworkingEngine would otherwise send a 410 or 429 twice and ignore Retry-After. `BAD_HTTP_STATUS` errors contain the status, the headers, and the final URI in `e.data`.

```js
async request(request) {
  const NetworkingEngine = shaka.net.NetworkingEngine;
  const retryParameters = shaka.util.ObjectUtils.cloneObject(this.getRetryParameters_());
  retryParameters.maxAttempts = 1;
  const shakaRequest = NetworkingEngine.makeRequest([request.url], retryParameters);
  shakaRequest.method = request.method || 'GET';
  const op = this.networkingEngine_.request(NetworkingEngine.RequestType.CONTENT_STEERING, shakaRequest);
  this.operationManager_.manage(op);
  try {
    const response = await op.promise;
    return {
      request: request,
      url: response.uri,
      status: response.status || 200,
      headers: response.headers,
      data: shaka.util.StringUtils.fromUTF8(response.data),
    };
  } catch (e) {
    if (e instanceof shaka.util.Error && e.code == shaka.util.Error.Code.BAD_HTTP_STATUS) {
      return {request: request, url: e.data[5], status: e.data[1], headers: e.data[3], data: e.data[2] || undefined};
    }
    throw e;
  }
}
```

**Location model.** Shaka asks for URIs when it builds a segment request, so `getLocations(streamId)` reads `engine.pathway` at that time. With RFC v1, the failover order and the penalties are not visible (gap 2), so the manager keeps its own copy of the penalties. With RFC v2, `getLocations()` reads `engine.priority` instead. `banLocation(uri)` finds the pathway by URI prefix, not by host, and calls `engine.penalize(id)`. Shaka does not read STABLE-VARIANT-ID or STABLE-RENDITION-ID yet, so the HLS parser must start to record them.

**Behavior changes.** Every test in `content_steering_manager_unit.js` calls `requestInfo()`, so all of them change. These behaviors change:

- the parameters on the first request
- the quotes and the lists in the parameters
- the base URI of RELOAD-URI
- the handling of VERSION and the stricter validation
- the 410 rule and Retry-After
- a penalty for each pathway instead of each host
- the new clone features

## VHS

**Where.** PlaylistController creates the engine in the first `loadedplaylist` event, after `excludeUnsupportedVariants_()`. The values are:

- `uri`: `resolveUrl(main.uri, serverUri)` for HLS, and the `serverURL` of mpd-parser for DASH.
- `pathways`: the unique `PATHWAY-ID` values of the playlists, with `.` for a playlist without one, for HLS. The unique `serviceLocation` values of the playlists and media groups for DASH.
- `pathway`: the PATHWAY-ID of the tag, or the first `@defaultServiceLocation` token. Omit it when `queryBeforeStart` is true.
`start()` runs on `canplay`, or at once with `queryBeforeStart`. The engine does not call `onPathwayChange` for the configured `pathway`, so VHS applies it once itself.

**Requester.** The adapter wraps `vhs.xhr` with the request type `content-steering-manifest`, so the request and response hooks still run. `req.responseHeaders` has lower-case names, and `resolveManifestRedirect` gives the final URL.

```js
export const createSteeringRequester = (pc) => (request) => new Promise((resolve, reject) => {
  const metadata = { contentSteeringInfo: { uri: request.url } };

  pc.trigger({ type: 'contentsteeringloadstart', metadata });
  pc.steeringRequest_ = pc.vhs_.xhr({
    uri: request.url,
    method: request.method,
    requestType: 'content-steering-manifest'
  }, (error, req) => {
    pc.steeringRequest_ = null;
    if (!req.status) {
      reject(error);
      return;
    }
    if (!error) {
      pc.trigger({ type: 'contentsteeringloadcomplete', metadata });
    }
    resolve({
      request,
      url: resolveManifestRedirect(request.url, req),
      status: req.status,
      headers: req.responseHeaders || {},
      data: req.responseText
    });
  });
});
```

**Callbacks.** `onPathwayChange` calls `excludeThenChangePathway_(pathway)`. When the pathway has no playable variant, it calls `penalize(pathway)` instead. `onManifest` triggers `contentsteeringparsed`, updates the HLS clones, and applies the current selection again, because the clones copy the exclusion state of their base. `excludePlaylist` calls `penalize()` for the last rendition of a pathway. Today VHS removes the pathway and adds it again after the TTL.

**Clones.** `createCloneURI_` calls `applyUriReplacement` with `stableVariantId`. m3u8-parser does not copy STABLE-RENDITION-ID, so PER-RENDITION-URIS needs a parser change. A clone update becomes a delete and a rebuild. VHS has no DASH cloning (gap 13). With RFC v2, `acceptClone` returns `false` for every DASH clone, and for an HLS clone without a playable variant.

**Behavior changes.** All 37 tests of `content-steering-controller.test.js` and 18 steering tests of `playlist-controller.test.js` read controller internals, so they need a rewrite. `proxyServerURL` support ends, which VHS documents today. Fixed bugs: an immediate retry loop after a failure before the first manifest, and DASH steering that stops after a reset.

## Spike results

Task 8 fills this table with the results of Tasks 4 to 7.

| Player | Engine commit | Tests run | Result | Blockers confirmed | New findings |
|---|---|---|---|---|---|
| hls.js | | | | | |
| dash.js | | | | | |
| Shaka Player | | | | | |
| VHS | | | | | |
