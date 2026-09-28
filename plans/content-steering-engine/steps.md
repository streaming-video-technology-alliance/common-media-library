# Content steering engine: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the engine of RFC v2 in `@svta/cml-content-steering`. Then build a prototype of the engine in four players, to check the integration map before the RFC review ends.

**Architecture:** `createSteeringEngine` keeps the state and the timers in one closure. It uses small internal modules for the rules of the specs. `applyUriReplacement` is a separate function without state. Each player spike installs a local build of the package in a clone of the player. The spike replaces the steering controller of the player with the engine and records the problems.

**Tech Stack:** TypeScript 5.9 with `isolatedDeclarations` and `erasableSyntaxOnly`, the Node 24 test runner with its mock timers, tsdown, and API Extractor.

**Sources:** the [RFC](../../rfc/content-steering-engine.md) (PR #471), the [design record](architecture.md), and the [integration map](integration.md).

**Status of the code in this plan:** every code block in Phase 1 is the code of a local prototype. The prototype implements RFC v2. It passed 123 package tests, `eslint`, `npm run typecheck` after a full build, and the tree-shaking probe of Task 3. A Babel loose ES5 build of it also passed a penalty test (`integration.md`, Findings outside the API).

## Global Constraints

- The public API is the export list of RFC v2 and nothing more: `createSteeringEngine`, `applyUriReplacement`, `SteeringProtocol`, `STEERING_PROTOCOL_HLS`, `STEERING_PROTOCOL_DASH`, `SteeringErrorType`, `STEERING_ERROR_TYPE_LOAD`, `STEERING_ERROR_TYPE_PARSE`, `STEERING_ERROR_TYPE_CALLBACK`, and the types `SteeringEngine`, `SteeringEngineConfig`, `SteeringRequester`, `SteeringError`, and `UriReplacementOptions`.
- The spec versions are draft-pantos-content-steering-05, draft-pantos-hls-rfc8216bis-22 (section 7), and ETSI TS 103 998 V1.1.1 (2024-01).
- Every new export has TSDoc with the `@beta` tag, like the other exports of the package. Unresolved question 5 of the RFC decides the final tag.
- `@svta/cml-utils` is a peer dependency with the version `"*"`. The package imports only types from it.
- The source never calls `console`. Errors go to the caller or to `onError`, with the rule of the RFC section "Callback errors".
- No code runs at module scope. A bare import of `dist/index.js` bundles to no statements with Rollup and with rolldown.
- The source has no `async` function and no spread of an iterator. The hls.js build transpiles CML code to ES5 in Babel loose mode. In that mode both constructs fail or grow the bundle (`integration.md`, Findings outside the API).
- Tests import from `@svta/cml-content-steering` and `@svta/cml-utils`, never from `src`. Each test file has a `//#region example` block.
- Tests run against `dist`. Build the package before each test run.
- Commit with `git commit -s`, a Conventional Commits message, and the trailer `Co-Authored-By: <agent name> <model> <noreply@anthropic.com>`. In the trailer, write the name and the model of the agent that makes the commit. Never commit to `main`. Do not change the version in `package.json`.
- Source comments describe behavior and cite the spec. The reasons for a design choice go in the commit message.
- Prose in the README, the CHANGELOG, and TSDoc follows the Writing Style section of `AGENTS.md`.
- The player spikes are local experiments. Do not push to a player repository, and do not open issues or pull requests there.

## File map

All paths are relative to `libs/content-steering/`.

| File | Task | Responsibility |
|---|---|---|
| `src/UriReplacement.ts` | 1 | adds the HLS keys `PER-VARIANT-URIS` and `PER-RENDITION-URIS` |
| `src/applyUriReplacement.ts` | 1 | the public function and `UriReplacementOptions` |
| `src/replaceQueryParams.ts` | 1 | internal: sets query parameters in code point order, without encoding |
| `src/toHostname.ts` | 1 | internal: checks and normalizes a `HOST` value |
| `src/SteeringProtocol.ts` | 2 | the protocol constants and type |
| `src/SteeringErrorType.ts` | 2 | the error type constants and type |
| `src/SteeringRequester.ts`, `src/SteeringError.ts`, `src/SteeringEngineConfig.ts`, `src/SteeringEngine.ts` | 2 | the public types |
| `src/parseRetryAfter.ts` | 2 | internal: the delay of a `Retry-After` value |
| `src/parseSteeringManifest.ts` | 2 | internal: parses and checks a response body, and resolves RELOAD-URI |
| `src/resolveClones.ts` | 2 | internal: the valid clones of a Steering Manifest |
| `src/selectPathway.ts` | 2 | internal: step 5 of the base spec |
| `src/buildSteeringUri.ts` | 2 | internal: the steering query parameters |
| `src/uniqueStrings.ts` | 2 | internal: the strings of a list without duplicates |
| `src/createSteeringEngine.ts` | 2 | the engine |
| `src/index.ts` | 1, 2, 3 | the exports and the package links |
| `test/createStubRequester.ts` | 2 | a test requester with recorded requests |
| `test/*.test.ts` | 1, 2 | the tests |
| `package.json` | 2 | the peer dependency |
| `README.md`, `CHANGELOG.md` | 1, 2, 3 | the documentation |

## Phase 1: The engine

### Task 1: `applyUriReplacement`

**Files:**
- Modify: `src/UriReplacement.ts`, `src/index.ts`, `CHANGELOG.md`
- Create: `src/applyUriReplacement.ts`, `src/replaceQueryParams.ts`, `src/toHostname.ts`
- Test: `test/applyUriReplacement.test.ts`

**Interfaces:**
- Consumes: the existing `UriReplacement` type.
- Produces: `applyUriReplacement(uri: string, replacement: UriReplacement, options?: UriReplacementOptions): string`. `UriReplacementOptions` has `baseUri`, `stableVariantId`, and `stableRenditionId`, all optional strings. Task 2 uses the internal functions `replaceQueryParams(search: string, params: Readonly<Record<string, string>>): string` and `toHostname(host: string): string | undefined`.

- [ ] **Step 1: Prepare the workspace**

If the worktree has no `node_modules`, run `npm ci` at the root first.

```bash
git switch feat/content-steering-engine-impl
npm run build -w libs/utils -w libs/content-steering
npm test -w libs/content-steering
```

Expected: `ℹ pass 12` and `ℹ fail 0`.

- [ ] **Step 2: Write the failing test**

Create `test/applyUriReplacement.test.ts`:

```ts
import { applyUriReplacement } from '@svta/cml-content-steering'
import { equal, throws } from 'node:assert'
import { describe, it } from 'node:test'

describe('applyUriReplacement', () => {
	it('provides a valid example', () => {
		//#region example
		const replacement = { HOST: 'backup2.example.com', PARAMS: { token: 'dkfs1239414' } }

		const uri = applyUriReplacement('https://example.com/some/path/to/file', replacement)

		equal(uri, 'https://backup2.example.com/some/path/to/file?token=dkfs1239414')
		//#endregion example
	})

	it('gives the same host to URIs with different hosts', () => {
		const replacement = { HOST: 'backup2.example.com', PARAMS: { token: 'dkfs1239414' } }

		equal(applyUriReplacement('https://b.example.com/another/path', replacement), 'https://backup2.example.com/another/path?token=dkfs1239414')
	})

	it('keeps the port when it replaces the hostname', () => {
		equal(applyUriReplacement('https://a.example.com:8443/x.m3u8', { HOST: 'b.example.com' }), 'https://b.example.com:8443/x.m3u8')
	})

	it('accepts an IPv6 address as HOST', () => {
		equal(applyUriReplacement('https://a.example.com/x', { HOST: '[2001:db8::1]' }), 'https://[2001:db8::1]/x')
	})

	it('resolves a relative URI against baseUri', () => {
		const uri = applyUriReplacement('seg/1.m4s', { HOST: 'b.example.com' }, { baseUri: 'https://a.example.com/video/main.mpd' })

		equal(uri, 'https://b.example.com/video/seg/1.m4s')
	})

	it('returns the resolved URI for an empty replacement', () => {
		equal(applyUriReplacement('1.m4s', {}, { baseUri: 'https://a.example.com/v/' }), 'https://a.example.com/v/1.m4s')
	})

	it('replaces a query parameter of the same name at its position', () => {
		const uri = applyUriReplacement('https://a.example.com/x?a=1&token=old&b=2', { PARAMS: { token: 'new' } })

		equal(uri, 'https://a.example.com/x?a=1&token=new&b=2')
	})

	it('removes later parameters of the same name', () => {
		equal(applyUriReplacement('https://a.example.com/x?token=1&token=2', { PARAMS: { token: '3' } }), 'https://a.example.com/x?token=3')
	})

	it('appends new parameters in code point order', () => {
		const uri = applyUriReplacement('https://a.example.com/x?z=0', { PARAMS: { b: '2', a: '1', B: '3' } })

		equal(uri, 'https://a.example.com/x?z=0&B=3&a=1&b=2')
	})

	it('does not encode percent-encoded values again', () => {
		equal(applyUriReplacement('https://a.example.com/x', { PARAMS: { token: 'a%2Fb%20c' } }), 'https://a.example.com/x?token=a%2Fb%20c')
	})

	it('keeps the existing query unchanged', () => {
		const uri = applyUriReplacement('https://a.example.com/x?q=a%20b&r=%2F', { PARAMS: { t: '1' } })

		equal(uri, 'https://a.example.com/x?q=a%20b&r=%2F&t=1')
	})

	it('ignores a parameter with an empty name', () => {
		equal(applyUriReplacement('https://a.example.com/x', { PARAMS: { '': '1', a: '2' } }), 'https://a.example.com/x?a=2')
	})

	it('keeps the fragment', () => {
		equal(applyUriReplacement('https://a.example.com/x#t=10', { PARAMS: { a: '1' } }), 'https://a.example.com/x?a=1#t=10')
	})

	describe('HLS stable IDs', () => {
		const replacement = {
			HOST: 'cdn-c.example.com',
			PARAMS: { token: 'abc' },
			'PER-VARIANT-URIS': { 'hd-1080': 'https://cdn-d.example.com/hd/1080.m3u8' },
			'PER-RENDITION-URIS': { 'audio-en': 'https://cdn-d.example.com/audio/en.m3u8' },
		}
		const baseUri = 'https://cdn-a.example.com/main.m3u8'

		it('returns the per-variant URI without HOST and PARAMS', () => {
			const uri = applyUriReplacement('hd/1080.m3u8', replacement, { baseUri, stableVariantId: 'hd-1080' })

			equal(uri, 'https://cdn-d.example.com/hd/1080.m3u8')
		})

		it('returns the per-rendition URI without HOST and PARAMS', () => {
			const uri = applyUriReplacement('audio/en.m3u8', replacement, { baseUri, stableRenditionId: 'audio-en' })

			equal(uri, 'https://cdn-d.example.com/audio/en.m3u8')
		})

		it('applies HOST and PARAMS when the stable ID has no entry', () => {
			const uri = applyUriReplacement('sd/540.m3u8', replacement, { baseUri, stableVariantId: 'sd-540' })

			equal(uri, 'https://cdn-c.example.com/sd/540.m3u8?token=abc')
		})

		it('ignores the name of an inherited property as a stable ID', () => {
			const uri = applyUriReplacement('sd/540.m3u8', replacement, { baseUri, stableVariantId: 'constructor' })

			equal(uri, 'https://cdn-c.example.com/sd/540.m3u8?token=abc')
		})
	})

	describe('errors', () => {
		it('throws when uri is relative and baseUri is absent', () => {
			throws(() => applyUriReplacement('x/1.m4s', { HOST: 'b.example.com' }), { name: 'TypeError', message: /uri/ })
		})

		it('throws when HOST has a port', () => {
			throws(() => applyUriReplacement('https://a.example.com/x', { HOST: 'b.example.com:9000' }), { name: 'TypeError', message: /HOST/ })
		})

		it('throws when HOST is empty', () => {
			throws(() => applyUriReplacement('https://a.example.com/x', { HOST: '' }), { name: 'TypeError', message: /HOST/ })
		})

		it('throws when HOST has a path', () => {
			throws(() => applyUriReplacement('https://a.example.com/x', { HOST: 'b.example.com/y' }), { name: 'TypeError', message: /HOST/ })
		})
	})
})
```

- [ ] **Step 3: Run the test and check that it fails**

```bash
cd libs/content-steering && node --no-warnings --test test/applyUriReplacement.test.ts; cd ../..
```

Expected: FAIL with `SyntaxError: The requested module '@svta/cml-content-steering' does not provide an export named 'applyUriReplacement'`.

- [ ] **Step 4: Add the HLS keys to `UriReplacement`**

Replace the content of `src/UriReplacement.ts`:

```ts
/**
 * A URI replacement for content steering.
 *
 *
 * @beta
 */
export type UriReplacement = {
	/**
	 * A string that specifies the hostname for cloned URIs.
	 */
	HOST?: string;

	/**
	 * An object that specifies query parameters for cloned URIs.
	 * The keys represent query parameter names, and the values
	 * correspond to the associated parameter values.
	 */
	PARAMS?: Record<string, string>;

	/**
	 * HLS only. An object that specifies replacement URIs for variant streams.
	 * The keys are STABLE-VARIANT-ID values, and the values are absolute URIs.
	 */
	'PER-VARIANT-URIS'?: Record<string, string>;

	/**
	 * HLS only. An object that specifies replacement URIs for renditions.
	 * The keys are STABLE-RENDITION-ID values, and the values are absolute URIs.
	 */
	'PER-RENDITION-URIS'?: Record<string, string>;
};
```

- [ ] **Step 5: Write `toHostname`**

Create `src/toHostname.ts`:

```ts
const HOSTNAME = /^(?:\[[\d.:A-Fa-f]+\]|[^\s#%/:?@[\\\]]+)$/

/**
 * Converts the `HOST` value of a pathway clone to a hostname.
 *
 * @param host - The `HOST` value.
 * @returns The hostname, or `undefined` when `host` is not a hostname without a port.
 *
 * @internal
 */
export function toHostname(host: string): string | undefined {
	if (!HOSTNAME.test(host)) {
		return undefined
	}

	try {
		return new URL(`http://${host}`).hostname
	} catch {
		return undefined
	}
}
```

- [ ] **Step 6: Write `replaceQueryParams`**

Create `src/replaceQueryParams.ts`:

```ts
/**
 * Sets query parameters in the search string of a URL.
 *
 * The names are processed in code point order, which is the UTF-8 order.
 * A parameter replaces the first parameter of the same name and removes the
 * later ones, or it is appended. Names and values are not encoded.
 *
 * @param search - The search string, with or without the leading `?`.
 * @param params - The query parameters to set.
 * @returns The new search string, without the leading `?`.
 *
 * @internal
 */
export function replaceQueryParams(search: string, params: Readonly<Record<string, string>>): string {
	const query = search.startsWith('?') ? search.slice(1) : search
	const parts = query ? query.split('&') : []

	for (const name of Object.keys(params).sort(compareCodePoints)) {
		const value = params[name]

		if (!name || typeof value !== 'string') {
			continue
		}

		const param = `${name}=${value}`
		const index = parts.findIndex(part => isParam(part, name))

		if (index === -1) {
			parts.push(param)
			continue
		}

		parts[index] = param

		for (let i = parts.length - 1; i > index; i--) {
			if (isParam(parts[i], name)) {
				parts.splice(i, 1)
			}
		}
	}

	return parts.join('&')
}

function isParam(part: string, name: string): boolean {
	return part === name || part.startsWith(`${name}=`)
}

function compareCodePoints(a: string, b: string): number {
	const length = Math.min(a.length, b.length)

	for (let i = 0; i < length; i++) {
		const x = a.codePointAt(i) ?? 0
		const y = b.codePointAt(i) ?? 0

		if (x !== y) {
			return x - y
		}

		if (x > 0xffff) {
			i++
		}
	}

	return a.length - b.length
}
```

- [ ] **Step 7: Write `applyUriReplacement`**

Create `src/applyUriReplacement.ts`:

```ts
import { replaceQueryParams } from './replaceQueryParams.ts'
import { toHostname } from './toHostname.ts'
import type { UriReplacement } from './UriReplacement.ts'

/**
 * Options for `applyUriReplacement`.
 *
 *
 * @beta
 */
export type UriReplacementOptions = {
	/**
	 * The absolute URI that a relative `uri` resolves against.
	 */
	baseUri?: string;

	/**
	 * HLS only. The STABLE-VARIANT-ID of the variant stream of `uri`.
	 */
	stableVariantId?: string;

	/**
	 * HLS only. The STABLE-RENDITION-ID of the rendition of `uri`.
	 */
	stableRenditionId?: string;
};

/**
 * Builds a URI of a pathway clone from a URI of its base pathway.
 *
 * @param uri - A URI of the base pathway.
 * @param replacement - The `URI-REPLACEMENT` object of the pathway clone.
 * @param options - The base URI and the HLS stable IDs.
 * @returns The absolute URI of the pathway clone.
 *
 * @throws TypeError when `uri` is relative and `baseUri` is absent, or when `HOST` is not a hostname without a port.
 *
 * @example
 * {@includeCode ../test/applyUriReplacement.test.ts#example}
 *
 * @see {@link https://datatracker.ietf.org/doc/html/draft-pantos-content-steering-05#section-5 | Pathway Cloning}
 * @see {@link https://datatracker.ietf.org/doc/html/draft-pantos-hls-rfc8216bis-22#section-7.3 | HLS Pathway Cloning}
 *
 * @beta
 */
export function applyUriReplacement(uri: string, replacement: UriReplacement, options?: UriReplacementOptions): string {
	const override = findUri(replacement['PER-VARIANT-URIS'], options?.stableVariantId)
		?? findUri(replacement['PER-RENDITION-URIS'], options?.stableRenditionId)

	if (override !== undefined) {
		return override
	}

	const url = toUrl(uri, options?.baseUri)
	const { HOST, PARAMS } = replacement

	if (HOST !== undefined) {
		const hostname = toHostname(HOST)

		if (hostname === undefined) {
			throw new TypeError(`applyUriReplacement: HOST must be a hostname without a port. Received '${HOST}'.`)
		}

		url.hostname = hostname
	}

	if (PARAMS) {
		url.search = replaceQueryParams(url.search, PARAMS)
	}

	return url.href
}

function findUri(uris: Record<string, string> | undefined, id: string | undefined): string | undefined {
	const uri = uris && id !== undefined ? uris[id] : undefined

	return typeof uri === 'string' ? uri : undefined
}

function toUrl(uri: string, baseUri: string | undefined): URL {
	try {
		return new URL(uri, baseUri)
	} catch {
		throw new TypeError(`applyUriReplacement: uri must be absolute, or baseUri must be an absolute URI. Received uri '${uri}' and baseUri '${baseUri}'.`)
	}
}
```

- [ ] **Step 8: Export the function**

In `src/index.ts`, add this line before `export * from './DEFAULT_PATHWAY_PENALTY.ts'`:

```ts
export * from './applyUriReplacement.ts'
```

- [ ] **Step 9: Build and run the tests**

```bash
npm run build -w libs/content-steering && npm test -w libs/content-steering
```

Expected: `ℹ tests 33`, `ℹ pass 33`, and `ℹ fail 0`. The API report `config/cml-content-steering.api.md` adds `applyUriReplacement`, `UriReplacementOptions`, and the two new keys of `UriReplacement`, and nothing else. Check it with `git diff libs/content-steering/config`.

- [ ] **Step 10: Add the changelog entries**

In `CHANGELOG.md`, under `## [Unreleased]`, add:

```markdown
### Added

- `applyUriReplacement`, which builds a URI of a pathway clone from a URI of its base pathway ([#61](https://github.com/streaming-video-technology-alliance/common-media-library/issues/61))

### Changed

- `UriReplacement` has the optional HLS keys `PER-VARIANT-URIS` and `PER-RENDITION-URIS` ([#61](https://github.com/streaming-video-technology-alliance/common-media-library/issues/61))
```

- [ ] **Step 11: Lint and commit**

```bash
npx eslint libs/content-steering
git add libs/content-steering
git commit -s -F - <<'EOF'
feat(content-steering): add applyUriReplacement

Refs #61

Co-Authored-By: <agent name> <model> <noreply@anthropic.com>
EOF
```

Expected: `eslint` prints nothing.

### Task 2: `createSteeringEngine`

**Files:**
- Modify: `package.json`, `src/index.ts`, `CHANGELOG.md`
- Create: `src/SteeringProtocol.ts`, `src/SteeringErrorType.ts`, `src/SteeringRequester.ts`, `src/SteeringError.ts`, `src/SteeringEngineConfig.ts`, `src/SteeringEngine.ts`, `src/uniqueStrings.ts`, `src/parseRetryAfter.ts`, `src/parseSteeringManifest.ts`, `src/resolveClones.ts`, `src/selectPathway.ts`, `src/buildSteeringUri.ts`, `src/createSteeringEngine.ts`
- Test: `test/createStubRequester.ts`, `test/SteeringProtocol.test.ts`, `test/SteeringErrorType.test.ts`, `test/createSteeringEngine.test.ts`, `test/createSteeringEngine.responses.test.ts`, `test/createSteeringEngine.clones.test.ts`, `test/createSteeringEngine.penalties.test.ts`, `test/createSteeringEngine.priority.test.ts`, `test/createSteeringEngine.update.test.ts`, `test/createSteeringEngine.lifecycle.test.ts`

**Interfaces:**
- Consumes: `replaceQueryParams` and `toHostname` from Task 1, and the existing `isValidPathwayClone`, `DEFAULT_TTL`, and `DEFAULT_PATHWAY_PENALTY`.
- Produces: `createSteeringEngine(config: SteeringEngineConfig): SteeringEngine` with the types of RFC v2. The engine has `pathway`, `priority`, `start()`, `stop()`, `penalize()`, `setPriority()`, and `update()`. Task 3 documents it, and the spikes of Phase 2 use it.

The tests cover the RFC section by section:

| Test file | RFC section |
|---|---|
| `createSteeringEngine.test.ts` | Configuration and Requests |
| `createSteeringEngine.responses.test.ts` | Responses |
| `createSteeringEngine.clones.test.ts` | Clones |
| `createSteeringEngine.penalties.test.ts` | Penalties |
| `createSteeringEngine.priority.test.ts` | Pathway selection, and `setPriority()` |
| `createSteeringEngine.update.test.ts` | Engine: `update()` |
| `createSteeringEngine.lifecycle.test.ts` | Engine, Callback errors, and Stop and resume |

The tests use the mock timers of `node:test` for `setTimeout` and `Date`. After `mock.timers.tick()`, they wait for `flush()`, so the promise callbacks of the engine run.

- [ ] **Step 1: Add the peer dependency**

In `package.json`, add this entry after `devEngines`:

```json
	"peerDependencies": {
		"@svta/cml-utils": "*"
	}
```

- [ ] **Step 2: Write the stub requester**

Create `test/createStubRequester.ts`:

```ts
import type { SteeringManifest, SteeringRequester } from '@svta/cml-content-steering'
import type { HttpRequest, HttpResponse } from '@svta/cml-utils'

export type StubResponse = Omit<HttpResponse, 'request'> | Error

export type StubRequester = {
	readonly requester: SteeringRequester;
	readonly requests: HttpRequest[];
	respond(...responses: StubResponse[]): void;
};

/**
 * Creates a requester that records each request and answers it with the
 * next queued response. An `Error` in the queue rejects the request. An
 * empty queue answers with status 500.
 */
export function createStubRequester(...responses: StubResponse[]): StubRequester {
	const requests: HttpRequest[] = []
	const queue = [...responses]

	return {
		requests,
		requester: async (request) => {
			requests.push(request)

			const next = queue.shift() ?? { status: 500 }

			if (next instanceof Error) {
				throw next
			}

			return { request, ...next }
		},
		respond: (...more) => {
			queue.push(...more)
		},
	}
}

/**
 * Creates a status 200 response with a Steering Manifest body.
 */
export function manifestResponse(manifest: Partial<SteeringManifest> & Record<string, unknown>, url?: string): StubResponse {
	return { status: 200, url, data: JSON.stringify(manifest) }
}

/**
 * Waits for the pending promise callbacks of the engine.
 */
export function flush(): Promise<void> {
	return new Promise(resolve => setImmediate(resolve))
}
```

- [ ] **Step 3: Write the protocol and error type tests**

Create `test/SteeringProtocol.test.ts`:

```ts
import { STEERING_PROTOCOL_DASH, STEERING_PROTOCOL_HLS, SteeringProtocol } from '@svta/cml-content-steering'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('SteeringProtocol', () => {
	it('has the HLS and DASH values', () => {
		//#region example
		equal(SteeringProtocol.HLS, 'hls')
		equal(SteeringProtocol.DASH, 'dash')
		equal(STEERING_PROTOCOL_HLS, SteeringProtocol.HLS)
		equal(STEERING_PROTOCOL_DASH, SteeringProtocol.DASH)
		//#endregion example
	})
})
```

Create `test/SteeringErrorType.test.ts`:

```ts
import { STEERING_ERROR_TYPE_CALLBACK, STEERING_ERROR_TYPE_LOAD, STEERING_ERROR_TYPE_PARSE, SteeringErrorType } from '@svta/cml-content-steering'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('SteeringErrorType', () => {
	it('has the load, parse, and callback values', () => {
		//#region example
		equal(SteeringErrorType.LOAD, 'load')
		equal(SteeringErrorType.PARSE, 'parse')
		equal(SteeringErrorType.CALLBACK, 'callback')
		equal(STEERING_ERROR_TYPE_LOAD, SteeringErrorType.LOAD)
		equal(STEERING_ERROR_TYPE_PARSE, SteeringErrorType.PARSE)
		equal(STEERING_ERROR_TYPE_CALLBACK, SteeringErrorType.CALLBACK)
		//#endregion example
	})
})
```

- [ ] **Step 4: Write the configuration and request tests**

Create `test/createSteeringEngine.test.ts`:

```ts
import { createSteeringEngine, type SteeringEngineConfig } from '@svta/cml-content-steering'
import { deepEqual, equal, throws } from 'node:assert'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'
import { createStubRequester, flush, manifestResponse } from './createStubRequester.ts'

const MANIFEST = { VERSION: 1, TTL: 300, 'PATHWAY-PRIORITY': ['CDN-B', 'CDN-A'] }

function hlsConfig(overrides: Partial<SteeringEngineConfig> = {}): SteeringEngineConfig {
	return {
		protocol: 'hls',
		uri: 'https://steering.example.com/manifest.json',
		pathways: ['CDN-A', 'CDN-B'],
		pathway: 'CDN-A',
		...overrides,
	}
}

describe('createSteeringEngine', () => {
	it('provides a valid example', async () => {
		//#region example
		const manifest = { VERSION: 1, TTL: 300, 'PATHWAY-PRIORITY': ['CDN-B', 'CDN-A'] }
		const changes: string[] = []

		const engine = createSteeringEngine({
			protocol: 'hls',
			uri: 'https://steering.example.com/manifest.json',
			pathways: ['CDN-A', 'CDN-B'],
			pathway: 'CDN-A',
			requester: async (request) => ({ request, status: 200, data: JSON.stringify(manifest) }),
			onPathwayChange: (pathway) => changes.push(pathway),
		})

		await engine.start()
		engine.stop()

		equal(engine.pathway, 'CDN-B')
		deepEqual(changes, ['CDN-B'])
		//#endregion example
	})

	describe('configuration', () => {
		it('throws for an unknown protocol', () => {
			// @ts-expect-error - invalid protocol
			throws(() => createSteeringEngine(hlsConfig({ protocol: 'smooth' })), { name: 'TypeError', message: /protocol must be 'hls' or 'dash'. Received "smooth"/ })
		})

		it('throws for a relative uri', () => {
			throws(() => createSteeringEngine(hlsConfig({ uri: '/steering' })), { name: 'TypeError', message: /uri must be an absolute URI. Received "\/steering"/ })
		})

		it('throws for empty pathways', () => {
			throws(() => createSteeringEngine(hlsConfig({ pathways: [], pathway: undefined })), { name: 'TypeError', message: /pathways must be a non-empty array of strings/ })
		})

		it('throws for a pathway that is not in pathways', () => {
			throws(() => createSteeringEngine(hlsConfig({ pathway: 'CDN-C' })), { name: 'TypeError', message: /pathway must be one of pathways. Received "CDN-C"/ })
		})

		it('throws for a negative penalty', () => {
			throws(() => createSteeringEngine(hlsConfig({ penalty: -1 })), { name: 'TypeError', message: /penalty must be a finite number/ })
		})

		it('starts with the configured pathway', () => {
			equal(createSteeringEngine(hlsConfig()).pathway, 'CDN-A')
			equal(createSteeringEngine(hlsConfig({ pathway: undefined })).pathway, undefined)
		})
	})

	describe('requests', () => {
		beforeEach(() => {
			mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 })
		})

		afterEach(() => {
			mock.timers.reset()
		})

		it('sends no request before start()', async () => {
			const { requester, requests } = createStubRequester()

			createSteeringEngine(hlsConfig({ requester }))
			await flush()

			equal(requests.length, 0)
		})

		it('sends a GET request with responseType text', async () => {
			const { requester, requests } = createStubRequester(manifestResponse(MANIFEST))
			const engine = createSteeringEngine(hlsConfig({ requester }))

			await engine.start()
			engine.stop()

			equal(requests[0].method, 'GET')
			equal(requests[0].responseType, 'text')
		})

		it('adds the HLS pathway in quotes and the rounded throughput', async () => {
			const { requester, requests } = createStubRequester(manifestResponse(MANIFEST))
			const engine = createSteeringEngine(hlsConfig({ requester, getThroughput: () => 6000000.4 }))

			await engine.start()
			engine.stop()

			equal(requests[0].url, 'https://steering.example.com/manifest.json?_HLS_pathway=%22CDN-A%22&_HLS_throughput=6000000')
		})

		it('omits the parameters when no pathway is selected', async () => {
			const { requester, requests } = createStubRequester(manifestResponse(MANIFEST))
			const engine = createSteeringEngine(hlsConfig({ requester, pathway: undefined, getThroughput: () => 1000 }))

			await engine.start()
			engine.stop()

			equal(requests[0].url, 'https://steering.example.com/manifest.json')
		})

		it('omits a throughput that is unknown, negative, or not finite', async () => {
			for (const value of [undefined, -1, NaN, Infinity]) {
				const { requester, requests } = createStubRequester(manifestResponse(MANIFEST))
				const engine = createSteeringEngine(hlsConfig({ requester, getThroughput: () => value }))

				await engine.start()
				engine.stop()

				equal(requests[0].url, 'https://steering.example.com/manifest.json?_HLS_pathway=%22CDN-A%22')
			}
		})

		it('replaces a parameter of the same name and keeps the other parameters', async () => {
			const { requester, requests } = createStubRequester(manifestResponse(MANIFEST))
			const uri = 'https://steering.example.com/manifest.json?video=a%20b&_HLS_pathway=old'
			const engine = createSteeringEngine(hlsConfig({ requester, uri }))

			await engine.start()
			engine.stop()

			equal(requests[0].url, 'https://steering.example.com/manifest.json?video=a%20b&_HLS_pathway=%22CDN-A%22')
		})

		it('adds no parameters to a data URI', async () => {
			const uri = `data:application/json,${encodeURIComponent(JSON.stringify(MANIFEST))}`
			const { requester, requests } = createStubRequester(manifestResponse(MANIFEST))
			const engine = createSteeringEngine(hlsConfig({ requester, uri, getThroughput: () => 1000 }))

			await engine.start()
			engine.stop()

			equal(requests[0].url, uri)
		})

		it('lists every DASH pathway selected since the previous request', async () => {
			const manifest = { VERSION: 1, TTL: 60, 'PATHWAY-PRIORITY': ['alpha', 'beta'] }
			const { requester, requests } = createStubRequester(manifestResponse(manifest), manifestResponse(manifest))
			const engine = createSteeringEngine({
				protocol: 'dash',
				uri: 'https://steering.example.com/dash',
				pathways: ['alpha', 'beta'],
				pathway: 'alpha',
				requester,
				getThroughput: (pathway) => pathway === 'alpha' ? 5140000 : undefined,
			})

			await engine.start()
			engine.penalize('alpha')
			mock.timers.tick(60000)
			await flush()
			engine.stop()

			equal(requests[0].url, 'https://steering.example.com/dash?_DASH_pathway=%22alpha%22&_DASH_throughput=5140000')
			equal(requests[1].url, 'https://steering.example.com/dash?_DASH_pathway=%22alpha,beta%22&_DASH_throughput=5140000,')
		})

		it('sends no steering parameters on the first request with queryBeforeStart', async () => {
			const manifest = { VERSION: 1, TTL: 60, 'PATHWAY-PRIORITY': ['CDN-B', 'CDN-A'] }
			const { requester, requests } = createStubRequester(manifestResponse(manifest), manifestResponse(manifest))
			const engine = createSteeringEngine(hlsConfig({ requester, queryBeforeStart: true, getThroughput: () => 1000 }))

			await engine.start()
			mock.timers.tick(60000)
			await flush()
			engine.stop()

			equal(requests[0].url, 'https://steering.example.com/manifest.json')
			equal(requests[1].url, 'https://steering.example.com/manifest.json?_HLS_pathway=%22CDN-B%22&_HLS_throughput=1000')
		})

		it('lists the pathways of getReportedPathways for DASH', async () => {
			const { requester, requests } = createStubRequester(manifestResponse(MANIFEST))
			const engine = createSteeringEngine({
				protocol: 'dash',
				uri: 'https://steering.example.com/dash',
				pathways: ['alpha', 'beta'],
				pathway: 'alpha',
				requester,
				getReportedPathways: () => ['beta', 'alpha', 'beta'],
				getThroughput: (pathway) => pathway === 'beta' ? 2000 : 1000,
			})

			await engine.start()
			engine.stop()

			equal(requests[0].url, 'https://steering.example.com/dash?_DASH_pathway=%22beta,alpha%22&_DASH_throughput=2000,1000')
		})

		it('omits the DASH parameters when getReportedPathways returns an empty list', async () => {
			const { requester, requests } = createStubRequester(manifestResponse(MANIFEST))
			const engine = createSteeringEngine({
				protocol: 'dash',
				uri: 'https://steering.example.com/dash',
				pathways: ['alpha'],
				pathway: 'alpha',
				requester,
				getReportedPathways: () => [],
			})

			await engine.start()
			engine.stop()

			equal(requests[0].url, 'https://steering.example.com/dash')
		})

		it('ignores getReportedPathways for HLS', async () => {
			const { requester, requests } = createStubRequester(manifestResponse(MANIFEST))
			const engine = createSteeringEngine(hlsConfig({ requester, getReportedPathways: () => ['CDN-B'] }))

			await engine.start()
			engine.stop()

			equal(requests[0].url, 'https://steering.example.com/manifest.json?_HLS_pathway=%22CDN-A%22')
		})

		it('uses fetch when no requester is configured', async (t) => {
			const fetchMock = t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(MANIFEST), { status: 200 }))
			const engine = createSteeringEngine(hlsConfig())

			await engine.start()
			engine.stop()

			equal(fetchMock.mock.callCount(), 1)
			equal(fetchMock.mock.calls[0].arguments[0], 'https://steering.example.com/manifest.json?_HLS_pathway=%22CDN-A%22')
			equal(engine.pathway, 'CDN-B')
		})
	})
})
```

- [ ] **Step 5: Write the response tests**

Create `test/createSteeringEngine.responses.test.ts`:

```ts
import { createSteeringEngine, DEFAULT_TTL, SteeringErrorType, type SteeringEngineConfig, type SteeringError } from '@svta/cml-content-steering'
import { deepEqual, equal, ok } from 'node:assert'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'
import { createStubRequester, flush, manifestResponse, type StubResponse } from './createStubRequester.ts'

const NOW = Date.parse('Sun, 06 Nov 1994 08:49:37 GMT')
const MANIFEST = { VERSION: 1, TTL: 60, 'PATHWAY-PRIORITY': ['CDN-B', 'CDN-A'] }

type RequestError = Exclude<SteeringError, { type: typeof SteeringErrorType.CALLBACK }>

function setup(protocol: 'hls' | 'dash', ...responses: StubResponse[]) {
	const stub = createStubRequester(...responses)
	const errors: RequestError[] = []
	const manifests: unknown[] = []
	const config: SteeringEngineConfig = {
		protocol,
		uri: 'https://steering.example.com/a/manifest.json',
		pathways: ['CDN-A', 'CDN-B'],
		pathway: 'CDN-A',
		requester: stub.requester,
		onError: (error) => {
			if (error.type !== SteeringErrorType.CALLBACK) {
				errors.push(error)
			}
		},
		onManifest: (manifest) => manifests.push(manifest),
	}
	const engine = createSteeringEngine(config)

	return { ...stub, engine, errors, manifests }
}

async function advance(ms: number): Promise<void> {
	mock.timers.tick(ms)
	await flush()
}

describe('createSteeringEngine responses', () => {
	beforeEach(() => {
		mock.timers.enable({ apis: ['setTimeout', 'Date'], now: NOW })
	})

	afterEach(() => {
		mock.timers.reset()
	})

	describe('valid Steering Manifest', () => {
		it('applies the Steering Manifest and requests again after TTL seconds', async () => {
			//#region example
			const { engine, requests, manifests } = setup('hls', manifestResponse(MANIFEST), manifestResponse(MANIFEST))

			await engine.start()

			deepEqual(manifests, [MANIFEST])
			equal(engine.pathway, 'CDN-B')

			await advance(59999)
			equal(requests.length, 1)

			await advance(1)
			equal(requests.length, 2)
			engine.stop()
			//#endregion example
		})

		it('accepts an empty PATHWAY-CLONES array', async () => {
			const { engine, errors } = setup('hls', manifestResponse({ ...MANIFEST, 'PATHWAY-CLONES': [] }))

			await engine.start()
			engine.stop()

			equal(errors.length, 0)
			equal(engine.pathway, 'CDN-B')
		})

		it('keeps the first of each pathway ID in PATHWAY-PRIORITY', async () => {
			// @ts-expect-error - a pathway ID that is not a string
			const { engine } = setup('hls', manifestResponse({ ...MANIFEST, 'PATHWAY-PRIORITY': ['CDN-B', 7, 'CDN-B', 'CDN-A'] }))

			await engine.start()
			engine.stop()

			deepEqual(engine.priority, ['CDN-B', 'CDN-A'])
		})

		it('treats a response without status as status 200', async () => {
			const { engine } = setup('hls', { data: JSON.stringify(MANIFEST) })

			await engine.start()
			engine.stop()

			equal(engine.pathway, 'CDN-B')
		})

		it('passes the response URI and the next request URI to onManifest', async () => {
			const contexts: unknown[] = []
			const manifest = { ...MANIFEST, 'RELOAD-URI': 'next.json' }
			const engine = createSteeringEngine({
				protocol: 'hls',
				uri: 'https://steering.example.com/a/manifest.json',
				pathways: ['CDN-A', 'CDN-B'],
				requester: async (request) => ({ request, status: 200, url: 'https://cdn.example.com/b/manifest.json', data: JSON.stringify(manifest) }),
				onManifest: (_manifest, _clones, context) => contexts.push(context),
			})

			await engine.start()
			engine.stop()

			deepEqual(contexts, [{ url: 'https://cdn.example.com/b/manifest.json', reloadUri: 'https://cdn.example.com/b/next.json' }])
		})

		it('accepts a body that is already parsed', async () => {
			const { engine } = setup('hls', { status: 200, data: MANIFEST })

			await engine.start()
			engine.stop()

			equal(engine.pathway, 'CDN-B')
		})

		it('resolves a relative RELOAD-URI against the response URI', async () => {
			const manifest = { ...MANIFEST, 'RELOAD-URI': 'next.json?session=1' }
			const { engine, requests } = setup('hls', manifestResponse(manifest, 'https://cdn.example.com/b/manifest.json'), manifestResponse(MANIFEST))

			await engine.start()
			await advance(60000)
			engine.stop()

			equal(requests[1].url, 'https://cdn.example.com/b/next.json?session=1&_HLS_pathway=%22CDN-B%22')
		})

		it('resolves a relative RELOAD-URI against the request URI without a response URI', async () => {
			const manifest = { ...MANIFEST, 'RELOAD-URI': '../reload.json' }
			const { engine, requests } = setup('hls', manifestResponse(manifest), manifestResponse(MANIFEST))

			await engine.start()
			await advance(60000)
			engine.stop()

			equal(requests[1].url, 'https://steering.example.com/reload.json?_HLS_pathway=%22CDN-B%22')
		})

		it('reports a relative RELOAD-URI of a data URI as a parse error', async () => {
			const manifest = { ...MANIFEST, 'RELOAD-URI': 'next.json' }
			const uri = `data:application/json,${encodeURIComponent(JSON.stringify(manifest))}`
			const errors: RequestError[] = []
			const engine = createSteeringEngine({
				protocol: 'hls',
				uri,
				pathways: ['CDN-A', 'CDN-B'],
				requester: async (request) => ({ request, status: 200, url: request.url, data: JSON.stringify(manifest) }),
				onError: (error) => {
			if (error.type !== SteeringErrorType.CALLBACK) {
				errors.push(error)
			}
		},
			})

			await engine.start()
			engine.stop()

			equal(errors[0].type, 'parse')
			ok(errors[0].message.includes('RELOAD-URI'))
			equal(engine.pathway, undefined)
		})
	})

	describe('invalid Steering Manifest', () => {
		it('reports a parse error for a body that is not JSON and requests again after DEFAULT_TTL', async () => {
			const { engine, errors, requests } = setup('hls', { status: 200, data: '<html>' }, manifestResponse(MANIFEST))

			await engine.start()

			equal(errors[0].type, 'parse')
			equal(errors[0].status, 200)
			ok(errors[0].cause instanceof SyntaxError)
			equal(errors[0].retryDelay, DEFAULT_TTL * 1000)
			equal(engine.pathway, 'CDN-A')

			await advance(DEFAULT_TTL * 1000)
			engine.stop()

			equal(requests.length, 2)
		})

		it('reports a parse error for a Steering Manifest without a positive TTL', async () => {
			const { engine, errors } = setup('hls', manifestResponse({ ...MANIFEST, TTL: 0 }))

			await engine.start()
			engine.stop()

			equal(errors[0].type, 'parse')
			equal(errors[0].retryDelay, DEFAULT_TTL * 1000)
		})

		it('keeps the previous state after an invalid Steering Manifest', async () => {
			const { engine, errors } = setup('hls', manifestResponse(MANIFEST), manifestResponse({ ...MANIFEST, 'PATHWAY-PRIORITY': [] }))

			await engine.start()
			await advance(60000)
			engine.stop()

			equal(errors[0].type, 'parse')
			equal(errors[0].retryDelay, 60000)
			equal(engine.pathway, 'CDN-B')
		})

		it('retries after a VERSION other than 1 for HLS', async () => {
			const { engine, errors } = setup('hls', manifestResponse({ ...MANIFEST, VERSION: 2 }))

			await engine.start()
			engine.stop()

			equal(errors[0].type, 'parse')
			equal(errors[0].retryDelay, DEFAULT_TTL * 1000)
		})

		it('ends the requests after a VERSION other than 1 for DASH and uses the fallback priority list', async () => {
			const { engine, errors, requests } = setup('dash', manifestResponse(MANIFEST), manifestResponse({ ...MANIFEST, VERSION: 2 }))

			await engine.start()
			equal(engine.pathway, 'CDN-B')

			await advance(60000)
			equal(errors[0].type, 'parse')
			equal(errors[0].retryDelay, undefined)

			engine.penalize()
			equal(engine.pathway, 'CDN-A')

			await advance(3600000)
			engine.stop()

			equal(requests.length, 2)
		})
	})

	describe('HTTP 410', () => {
		it('ends the requests and uses the fallback priority list when no Steering Manifest arrived', async () => {
			const { engine, errors, requests } = setup('hls', { status: 410 })

			await engine.start()

			equal(errors[0].type, 'load')
			equal(errors[0].status, 410)
			equal(errors[0].retryDelay, undefined)
			equal(engine.pathway, 'CDN-A')

			engine.penalize()
			equal(engine.pathway, 'CDN-B')

			await advance(3600000)
			engine.stop()

			equal(requests.length, 1)
		})

		it('keeps the priority list of the last valid Steering Manifest', async () => {
			const { engine } = setup('hls', manifestResponse({ ...MANIFEST, 'PATHWAY-PRIORITY': ['CDN-B'] }), { status: 410 })

			await engine.start()
			await advance(60000)

			engine.penalize()
			engine.stop()

			equal(engine.pathway, 'CDN-B')
		})
	})

	describe('HTTP 429', () => {
		it('requests again after the Retry-After seconds', async () => {
			const { engine, errors, requests } = setup('hls', { status: 429, headers: { 'Retry-After': '120' } }, manifestResponse(MANIFEST))

			await engine.start()

			equal(errors[0].status, 429)
			equal(errors[0].retryDelay, 120000)

			await advance(119999)
			equal(requests.length, 1)

			await advance(1)
			engine.stop()

			equal(requests.length, 2)
		})

		it('requests again at the Retry-After HTTP date', async () => {
			const { engine, errors } = setup('hls', { status: 429, headers: { 'retry-after': 'Sun, 06 Nov 1994 08:51:37 GMT' } })

			await engine.start()
			engine.stop()

			equal(errors[0].retryDelay, 120000)
		})

		it('uses the previous TTL without a valid Retry-After', async () => {
			const { engine, errors } = setup('hls', { status: 429, headers: { 'retry-after': 'soon' } })

			await engine.start()
			engine.stop()

			equal(errors[0].retryDelay, DEFAULT_TTL * 1000)
		})

		it('does not change the TTL for HLS', async () => {
			const { engine, errors } = setup('hls', manifestResponse(MANIFEST), { status: 429, headers: { 'retry-after': '5' } }, { status: 500 })

			await engine.start()
			await advance(60000)
			await advance(5000)
			engine.stop()

			equal(errors[1].status, 500)
			equal(errors[1].retryDelay, 60000)
		})

		it('replaces the TTL with the Retry-After value for DASH', async () => {
			const { engine, errors } = setup('dash', manifestResponse(MANIFEST), { status: 429, headers: { 'retry-after': '5' } }, { status: 500 })

			await engine.start()
			await advance(60000)
			await advance(5000)
			engine.stop()

			equal(errors[1].status, 500)
			equal(errors[1].retryDelay, 5000)
		})
	})

	describe('other failures', () => {
		it('reports a load error for another status and requests again after the previous TTL', async () => {
			const { engine, errors } = setup('hls', manifestResponse(MANIFEST), { status: 503 })

			await engine.start()
			await advance(60000)
			engine.stop()

			equal(errors[0].type, 'load')
			equal(errors[0].status, 503)
			equal(errors[0].retryDelay, 60000)
			equal(engine.pathway, 'CDN-B')
		})

		it('reports a load error for a network error', async () => {
			const cause = new TypeError('Failed to fetch')
			const { engine, errors } = setup('hls', cause)

			await engine.start()
			engine.stop()

			equal(errors[0].type, 'load')
			equal(errors[0].status, undefined)
			equal(errors[0].cause, cause)
			equal(errors[0].url, 'https://steering.example.com/a/manifest.json?_HLS_pathway=%22CDN-A%22')
		})
	})
})
```

- [ ] **Step 6: Write the clone tests**

Create `test/createSteeringEngine.clones.test.ts`:

```ts
import { createSteeringEngine, type PathwayClone } from '@svta/cml-content-steering'
import { deepEqual, equal } from 'node:assert'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'
import { createStubRequester, flush, manifestResponse, type StubResponse } from './createStubRequester.ts'

function clone(id: string, baseId: string, replacement: PathwayClone['URI-REPLACEMENT'] = { HOST: 'backup.example.com' }): PathwayClone {
	return { 'BASE-ID': baseId, ID: id, 'URI-REPLACEMENT': replacement }
}

function manifestWithClones(clones: PathwayClone[], priority: string[]): StubResponse {
	return manifestResponse({ VERSION: 1, TTL: 60, 'PATHWAY-PRIORITY': priority, 'PATHWAY-CLONES': clones })
}

async function receive(...responses: StubResponse[]) {
	const { requester } = createStubRequester(...responses)
	const events: string[] = []
	const received: (readonly PathwayClone[])[] = []
	const engine = createSteeringEngine({
		protocol: 'hls',
		uri: 'https://steering.example.com/manifest.json',
		pathways: ['CDN-A', 'CDN-B'],
		pathway: 'CDN-A',
		requester,
		onManifest: (_manifest, clones) => {
			events.push('manifest')
			received.push(clones)
		},
		onPathwayChange: (pathway) => events.push(`pathway ${pathway}`),
	})

	await engine.start()

	return { engine, events, received }
}

describe('createSteeringEngine clones', () => {
	beforeEach(() => {
		mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 })
	})

	afterEach(() => {
		mock.timers.reset()
	})

	it('passes the valid clones to onManifest before it selects a clone', async () => {
		//#region example
		const valid = clone('CDN-A-CLONE', 'CDN-A')
		const { engine, events, received } = await receive(manifestWithClones([valid], ['CDN-A-CLONE', 'CDN-A']))
		engine.stop()

		deepEqual(received, [[valid]])
		deepEqual(events, ['manifest', 'pathway CDN-A-CLONE'])
		equal(engine.pathway, 'CDN-A-CLONE')
		//#endregion example
	})

	it('accepts a clone of an earlier clone and ignores a clone of a later clone', async () => {
		const first = clone('C1', 'CDN-A')
		const second = clone('C2', 'C1')
		const early = clone('C0', 'C3')
		const late = clone('C3', 'CDN-B')
		const { engine, received } = await receive(manifestWithClones([first, second, early, late], ['C0', 'C2']))
		engine.stop()

		deepEqual(received[0], [first, second, late])
		equal(engine.pathway, 'C2')
	})

	it('ignores clones that are not valid', async () => {
		const invalid = [
			clone('C1', 'CDN-X'),
			clone('CDN-B', 'CDN-A'),
			clone('C 2', 'CDN-A'),
			clone('C3', 'CDN-A', { HOST: 'backup.example.com:8443' }),
			clone('C4', 'CDN-A', { HOST: '' }),
			clone('C5', 'CDN-A', { PARAMS: { '': 'x' } }),
			// @ts-expect-error - a PARAMS value that is not a string
			clone('C6', 'CDN-A', { PARAMS: { token: 1 } }),
		]
		const valid = clone('C7', 'CDN-A', { PARAMS: { token: 'x' } })
		const duplicate = clone('C7', 'CDN-B')
		const { engine, received } = await receive(manifestWithClones([...invalid, valid, duplicate], ['C1', 'C3', 'C7']))
		engine.stop()

		deepEqual(received[0], [valid])
		equal(engine.pathway, 'C7')
	})

	it('ignores a clone that acceptClone refuses', async () => {
		const refused = clone('C1', 'CDN-A')
		const accepted = clone('C2', 'CDN-A')
		const { requester } = createStubRequester(manifestWithClones([refused, accepted], ['C1', 'C2']))
		const received: (readonly PathwayClone[])[] = []
		const engine = createSteeringEngine({
			protocol: 'hls',
			uri: 'https://steering.example.com/manifest.json',
			pathways: ['CDN-A', 'CDN-B'],
			pathway: 'CDN-A',
			requester,
			acceptClone: (candidate) => candidate.ID !== 'C1',
			onManifest: (_manifest, clones) => received.push(clones),
		})

		await engine.start()
		engine.stop()

		deepEqual(received, [[accepted]])
		equal(engine.pathway, 'C2')
	})

	it('ignores a clone without a valid structure and applies the Steering Manifest', async () => {
		const valid = clone('C1', 'CDN-A')
		// @ts-expect-error - a clone without a string ID
		const broken: PathwayClone = { 'BASE-ID': 'CDN-A', ID: 5, 'URI-REPLACEMENT': {} }
		const { engine, received } = await receive(manifestWithClones([broken, valid], ['C1', 'CDN-A']))
		engine.stop()

		deepEqual(received[0], [valid])
		equal(engine.pathway, 'C1')
	})

	it('knows only the clones of the current Steering Manifest', async () => {
		const temporary = clone('CDN-A-CLONE', 'CDN-A')
		const { engine, received } = await receive(
			manifestWithClones([temporary], ['CDN-A-CLONE', 'CDN-B']),
			manifestResponse({ VERSION: 1, TTL: 60, 'PATHWAY-PRIORITY': ['CDN-A-CLONE', 'CDN-B'] }),
		)

		equal(engine.pathway, 'CDN-A-CLONE')

		mock.timers.tick(60000)
		await flush()
		engine.stop()

		deepEqual(received[1], [])
		equal(engine.pathway, 'CDN-B')
	})
})
```

- [ ] **Step 7: Write the penalty tests**

Create `test/createSteeringEngine.penalties.test.ts`:

```ts
import { createSteeringEngine, DEFAULT_PATHWAY_PENALTY, type SteeringEngineConfig } from '@svta/cml-content-steering'
import { deepEqual, equal } from 'node:assert'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'
import { createStubRequester, flush, manifestResponse, type StubResponse } from './createStubRequester.ts'

const PRIORITY = ['CDN-A', 'CDN-B', 'CDN-C']

async function started(overrides: Partial<SteeringEngineConfig>, ...responses: StubResponse[]) {
	const { requester } = createStubRequester(...responses)
	const changes: string[] = []
	const engine = createSteeringEngine({
		protocol: 'hls',
		uri: 'https://steering.example.com/manifest.json',
		pathways: ['CDN-A', 'CDN-B', 'CDN-C'],
		pathway: 'CDN-A',
		requester,
		onPathwayChange: (pathway) => changes.push(pathway),
		...overrides,
	})

	await engine.start()

	return { engine, changes }
}

async function advance(ms: number): Promise<void> {
	mock.timers.tick(ms)
	await flush()
}

describe('createSteeringEngine penalties', () => {
	beforeEach(() => {
		mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 })
	})

	afterEach(() => {
		mock.timers.reset()
	})

	it('selects the next pathway when the selected pathway is penalized', async () => {
		const { engine, changes } = await started({}, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': PRIORITY }))

		engine.penalize()
		engine.stop()

		equal(engine.pathway, 'CDN-B')
		deepEqual(changes, ['CDN-B'])
	})

	it('does not change the selection for a pathway that is not selected', async () => {
		const { engine, changes } = await started({}, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': PRIORITY }))

		engine.penalize('CDN-C')
		engine.stop()

		equal(engine.pathway, 'CDN-A')
		deepEqual(changes, [])
	})

	it('selects again when an HLS penalty of DEFAULT_PATHWAY_PENALTY ends', async () => {
		//#region example
		const { engine, changes } = await started({}, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': PRIORITY }))

		engine.penalize()
		await advance(DEFAULT_PATHWAY_PENALTY - 1)
		equal(engine.pathway, 'CDN-B')

		await advance(1)
		engine.stop()

		equal(engine.pathway, 'CDN-A')
		deepEqual(changes, ['CDN-B', 'CDN-A'])
		//#endregion example
	})

	it('uses the TTL of the last valid Steering Manifest as the DASH penalty', async () => {
		const { engine } = await started({ protocol: 'dash' }, manifestResponse({ VERSION: 1, TTL: 30, 'PATHWAY-PRIORITY': PRIORITY }), manifestResponse({ VERSION: 1, TTL: 30, 'PATHWAY-PRIORITY': PRIORITY }))

		engine.penalize()
		await advance(29999)
		equal(engine.pathway, 'CDN-B')

		await advance(1)
		engine.stop()

		equal(engine.pathway, 'CDN-A')
	})

	it('uses the penalty of the configuration for both protocols', async () => {
		const { engine } = await started({ penalty: 1000 }, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': PRIORITY }))

		engine.penalize()
		await advance(1000)
		engine.stop()

		equal(engine.pathway, 'CDN-A')
	})

	it('keeps a penalty when a new Steering Manifest ranks the pathway first', async () => {
		const manifest = manifestResponse({ VERSION: 1, TTL: 10, 'PATHWAY-PRIORITY': PRIORITY })
		const { engine } = await started({ penalty: 60000 }, manifest, manifest)

		engine.penalize()
		await advance(10000)
		engine.stop()

		equal(engine.pathway, 'CDN-B')
	})

	it('restarts a penalty when the pathway is penalized again', async () => {
		const { engine } = await started({ penalty: 1000 }, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': ['CDN-A', 'CDN-B'] }))

		engine.penalize('CDN-A')
		await advance(500)
		engine.penalize('CDN-A')
		await advance(500)
		equal(engine.pathway, 'CDN-B')

		await advance(500)
		engine.stop()

		equal(engine.pathway, 'CDN-A')
	})

	it('keeps the selection when no pathway qualifies', async () => {
		const { engine, changes } = await started({}, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': ['CDN-A'] }))

		engine.penalize()
		engine.stop()

		equal(engine.pathway, 'CDN-A')
		deepEqual(changes, [])
	})

	it('ignores pathway IDs that the Content Description does not define', async () => {
		const { engine } = await started({}, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': ['CDN-X', 'CDN-C'] }))

		engine.stop()

		equal(engine.pathway, 'CDN-C')
	})

	it('fails over with the fallback priority list before the first Steering Manifest', async () => {
		const { requester } = createStubRequester(manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': PRIORITY }))
		const engine = createSteeringEngine({
			protocol: 'hls',
			uri: 'https://steering.example.com/manifest.json',
			pathways: PRIORITY,
			pathway: 'CDN-A',
			requester,
		})

		engine.penalize()
		equal(engine.pathway, 'CDN-B')

		await engine.start()
		engine.stop()

		equal(engine.pathway, 'CDN-B')
	})
})
```

- [ ] **Step 8: Write the priority and update tests**

Create `test/createSteeringEngine.priority.test.ts`:

```ts
import { createSteeringEngine, type SteeringEngineConfig } from '@svta/cml-content-steering'
import { deepEqual, equal, throws } from 'node:assert'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'
import { createStubRequester, flush, manifestResponse, type StubResponse } from './createStubRequester.ts'

const PATHWAYS = ['CDN-A', 'CDN-B', 'CDN-C']

function create(overrides: Partial<SteeringEngineConfig>, ...responses: StubResponse[]) {
	const { requester } = createStubRequester(...responses)
	const changes: string[] = []
	const engine = createSteeringEngine({
		protocol: 'hls',
		uri: 'https://steering.example.com/manifest.json',
		pathways: PATHWAYS,
		pathway: 'CDN-A',
		requester,
		onPathwayChange: (pathway) => changes.push(pathway),
		...overrides,
	})

	return { engine, changes }
}

describe('createSteeringEngine priority', () => {
	beforeEach(() => {
		mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 })
	})

	afterEach(() => {
		mock.timers.reset()
	})

	it('lists the selected pathway first and leaves out penalized and unknown pathways', async () => {
		//#region example
		const { engine } = create({}, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': ['CDN-X', 'CDN-A', 'CDN-B', 'CDN-C'] }))

		await engine.start()
		engine.penalize('CDN-B')
		engine.stop()

		equal(engine.pathway, 'CDN-A')
		deepEqual(engine.priority, ['CDN-A', 'CDN-C'])
		//#endregion example
	})

	it('returns the fallback priority list before the first Steering Manifest', () => {
		deepEqual(create({}).engine.priority, ['CDN-A', 'CDN-B', 'CDN-C'])
		deepEqual(create({ pathway: 'CDN-B' }).engine.priority, ['CDN-B', 'CDN-A', 'CDN-C'])
		deepEqual(create({ pathway: undefined }).engine.priority, [])
	})

	it('replaces the priority list with setPriority() and selects', async () => {
		const { engine, changes } = create({}, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': ['CDN-A', 'CDN-B'] }))

		await engine.start()
		engine.setPriority(['CDN-X', 'CDN-B', 'CDN-A', 'CDN-B'])
		engine.stop()

		equal(engine.pathway, 'CDN-B')
		deepEqual(engine.priority, ['CDN-B', 'CDN-A'])
		deepEqual(changes, ['CDN-B'])
	})

	it('replaces the priority list of setPriority() with the next valid Steering Manifest', async () => {
		const manifest = manifestResponse({ VERSION: 1, TTL: 60, 'PATHWAY-PRIORITY': ['CDN-A', 'CDN-B'] })
		const { engine } = create({}, manifest, manifest)

		await engine.start()
		engine.setPriority(['CDN-B'])
		equal(engine.pathway, 'CDN-B')

		mock.timers.tick(60000)
		await flush()
		engine.stop()

		equal(engine.pathway, 'CDN-A')
	})

	it('throws for a priority list that is not an array of strings', () => {
		const { engine } = create({})

		// @ts-expect-error - invalid priority list
		throws(() => engine.setPriority([1]), { name: 'TypeError', message: /SteeringEngine\.setPriority: priority must be an array of strings/ })
	})

	it('throws a callback error to the caller of setPriority() after it selects', () => {
		const cause = new Error('player bug')
		const { engine } = create({
			onPathwayChange: () => {
				throw cause
			},
		})

		throws(() => engine.setPriority(['CDN-C']), (error) => error === cause)

		equal(engine.pathway, 'CDN-C')
	})
})
```

Create `test/createSteeringEngine.update.test.ts`:

```ts
import { createSteeringEngine, type PathwayClone, type SteeringEngineConfig } from '@svta/cml-content-steering'
import { deepEqual, equal, throws } from 'node:assert'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'
import { createStubRequester, flush, manifestResponse, type StubResponse } from './createStubRequester.ts'

function create(overrides: Partial<SteeringEngineConfig>, ...responses: StubResponse[]) {
	const stub = createStubRequester(...responses)
	const changes: string[] = []
	const engine = createSteeringEngine({
		protocol: 'dash',
		uri: 'https://steering.example.com/dash.json',
		pathways: ['CDN-A', 'CDN-B'],
		pathway: 'CDN-A',
		requester: stub.requester,
		onPathwayChange: (pathway) => changes.push(pathway),
		...overrides,
	})

	return { ...stub, engine, changes }
}

async function advance(ms: number): Promise<void> {
	mock.timers.tick(ms)
	await flush()
}

describe('createSteeringEngine update', () => {
	beforeEach(() => {
		mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 })
	})

	afterEach(() => {
		mock.timers.reset()
	})

	it('selects a pathway that update() adds', async () => {
		//#region example
		const { engine, changes } = create({}, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': ['CDN-C', 'CDN-A'] }))

		await engine.start()
		equal(engine.pathway, 'CDN-A')

		engine.update({ pathways: ['CDN-A', 'CDN-B', 'CDN-C'] })
		engine.stop()

		equal(engine.pathway, 'CDN-C')
		deepEqual(changes, ['CDN-C'])
		//#endregion example
	})

	it('moves off a pathway that update() removes', async () => {
		const { engine } = create({}, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': ['CDN-B', 'CDN-A'] }))

		await engine.start()
		engine.update({ pathways: ['CDN-A'] })
		engine.stop()

		equal(engine.pathway, 'CDN-A')
	})

	it('checks the clones again after update()', async () => {
		const clone: PathwayClone = { 'BASE-ID': 'CDN-B', ID: 'CDN-B-CLONE', 'URI-REPLACEMENT': { HOST: 'backup.example.com' } }
		const { engine } = create({}, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': ['CDN-B-CLONE', 'CDN-A'], 'PATHWAY-CLONES': [clone] }))

		await engine.start()
		equal(engine.pathway, 'CDN-B-CLONE')

		engine.update({ pathways: ['CDN-A'] })
		engine.stop()

		equal(engine.pathway, 'CDN-A')
	})

	it('keeps penalties across update()', async () => {
		const { engine } = create({}, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': ['CDN-A', 'CDN-B', 'CDN-C'] }))

		await engine.start()
		engine.penalize('CDN-A')
		engine.update({ pathways: ['CDN-A', 'CDN-B', 'CDN-C'] })
		engine.stop()

		equal(engine.pathway, 'CDN-B')
	})

	it('rebuilds the fallback priority list after update()', () => {
		const { engine } = create({})

		engine.update({ pathways: ['CDN-A', 'CDN-C'] })

		deepEqual(engine.priority, ['CDN-A', 'CDN-C'])
	})

	it('uses a new uri at the next scheduled request and drops the RELOAD-URI', async () => {
		const manifest = { VERSION: 1, TTL: 60, 'PATHWAY-PRIORITY': ['CDN-A'], 'RELOAD-URI': 'reload.json' }
		const { engine, requests } = create({}, manifestResponse(manifest), manifestResponse(manifest))

		await engine.start()
		engine.update({ uri: 'https://steering2.example.com/dash.json' })
		await flush()
		equal(requests.length, 1)

		await advance(60000)
		engine.stop()

		equal(requests[1].url, 'https://steering2.example.com/dash.json?_DASH_pathway=%22CDN-A%22')
	})

	it('keeps the RELOAD-URI when update() repeats the configured uri', async () => {
		const manifest = { VERSION: 1, TTL: 60, 'PATHWAY-PRIORITY': ['CDN-A'], 'RELOAD-URI': 'reload.json' }
		const { engine, requests } = create({}, manifestResponse(manifest), manifestResponse(manifest))

		await engine.start()
		engine.update({ uri: 'https://steering.example.com/dash.json' })
		await advance(60000)
		engine.stop()

		equal(requests[1].url, 'https://steering.example.com/reload.json?_DASH_pathway=%22CDN-A%22')
	})

	it('resumes the requests after a 410 when update() sets a new uri', async () => {
		const { engine, requests } = create({}, { status: 410 }, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': ['CDN-B'] }))

		await engine.start()
		engine.update({ uri: 'https://steering2.example.com/dash.json' })
		await advance(0)
		engine.stop()

		equal(requests.length, 2)
		equal(requests[1].url, 'https://steering2.example.com/dash.json?_DASH_pathway=%22CDN-A%22')
		equal(engine.pathway, 'CDN-B')
	})

	it('throws for an invalid uri or pathways', () => {
		const { engine } = create({})

		throws(() => engine.update({ uri: '/relative' }), { name: 'TypeError', message: /SteeringEngine\.update: uri must be an absolute URI/ })
		throws(() => engine.update({ pathways: [] }), { name: 'TypeError', message: /SteeringEngine\.update: pathways must be a non-empty array of strings/ })
	})

	it('throws a callback error to the caller of update() after it selects', async () => {
		const cause = new Error('player bug')
		const { engine } = create({
			onPathwayChange: () => {
				throw cause
			},
		}, manifestResponse({ VERSION: 1, TTL: 3600, 'PATHWAY-PRIORITY': ['CDN-C', 'CDN-A'] }))

		await engine.start()

		throws(() => engine.update({ pathways: ['CDN-A', 'CDN-C'] }), (error) => error === cause)
		engine.stop()

		equal(engine.pathway, 'CDN-C')
	})
})
```

- [ ] **Step 9: Write the lifecycle tests**

Create `test/createSteeringEngine.lifecycle.test.ts`:

```ts
import { createSteeringEngine, SteeringErrorType, type SteeringEngineConfig, type SteeringError, type SteeringRequester } from '@svta/cml-content-steering'
import type { HttpRequest, HttpResponse } from '@svta/cml-utils'
import { deepEqual, equal, throws } from 'node:assert'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'
import { createStubRequester, flush, manifestResponse } from './createStubRequester.ts'

const MANIFEST = { VERSION: 1, TTL: 300, 'PATHWAY-PRIORITY': ['CDN-B', 'CDN-A'] }

function config(requester: SteeringRequester, overrides: Partial<SteeringEngineConfig> = {}): SteeringEngineConfig {
	return {
		protocol: 'hls',
		uri: 'https://steering.example.com/manifest.json',
		pathways: ['CDN-A', 'CDN-B'],
		pathway: 'CDN-A',
		requester,
		...overrides,
	}
}

function createDeferredRequester() {
	const requests: HttpRequest[] = []
	const answers: ((response: Omit<HttpResponse, 'request'>) => void)[] = []
	const requester: SteeringRequester = (request) => {
		requests.push(request)
		return new Promise(resolve => answers.push(response => resolve({ request, ...response })))
	}

	return { requester, requests, answers }
}

async function advance(ms: number): Promise<void> {
	mock.timers.tick(ms)
	await flush()
}

describe('createSteeringEngine lifecycle', () => {
	beforeEach(() => {
		mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 })
	})

	afterEach(() => {
		mock.timers.reset()
	})

	it('resolves the promise of start() after onManifest', async () => {
		const events: string[] = []
		const { requester } = createStubRequester(manifestResponse(MANIFEST))
		const engine = createSteeringEngine(config(requester, { onManifest: () => events.push('manifest') }))

		await engine.start()
		events.push('resolved')
		engine.stop()

		deepEqual(events, ['manifest', 'resolved'])
	})

	it('returns the same promise for a second start()', () => {
		const { requester } = createDeferredRequester()
		const engine = createSteeringEngine(config(requester))

		const first = engine.start()
		const second = engine.start()
		engine.stop()

		equal(first, second)
	})

	it('resolves the promise of start() when the requester fails', async () => {
		const engine = createSteeringEngine(config(async () => {
			throw new Error('offline')
		}))

		await engine.start()
		engine.stop()

		equal(engine.pathway, 'CDN-A')
	})

	it('resolves a pending promise of start() on stop() and ignores the late response', async () => {
		const { requester, answers } = createDeferredRequester()
		const changes: string[] = []
		const engine = createSteeringEngine(config(requester, { onPathwayChange: (pathway) => changes.push(pathway) }))

		const promise = engine.start()
		engine.stop()
		await promise

		answers[0]({ status: 200, data: JSON.stringify(MANIFEST) })
		await flush()

		deepEqual(changes, [])
		equal(engine.pathway, 'CDN-A')
	})

	it('waits for the rest of the TTL when it resumes', async () => {
		//#region example
		const { requester, requests } = createStubRequester(manifestResponse(MANIFEST), manifestResponse(MANIFEST))
		const engine = createSteeringEngine(config(requester))

		await engine.start()
		await advance(100000)
		engine.stop()
		await advance(50000)

		await engine.start()
		equal(requests.length, 1)

		await advance(149999)
		equal(requests.length, 1)

		await advance(1)
		engine.stop()

		equal(requests.length, 2)
		//#endregion example
	})

	it('requests at once when it resumes after the TTL', async () => {
		const { requester, requests } = createStubRequester(manifestResponse(MANIFEST), manifestResponse(MANIFEST))
		const engine = createSteeringEngine(config(requester))

		await engine.start()
		engine.stop()
		await advance(300000)

		await engine.start()
		engine.stop()

		equal(requests.length, 2)
	})

	it('selects again on start() when a penalty ended while the engine was stopped', async () => {
		const { requester } = createStubRequester(manifestResponse(MANIFEST))
		const engine = createSteeringEngine(config(requester, { penalty: 1000 }))

		await engine.start()
		engine.penalize()
		equal(engine.pathway, 'CDN-A')

		engine.stop()
		await advance(1000)
		equal(engine.pathway, 'CDN-A')

		await engine.start()
		engine.stop()

		equal(engine.pathway, 'CDN-B')
	})

	it('sends no request on start() after a 410', async () => {
		const { requester, requests } = createStubRequester({ status: 410 })
		const engine = createSteeringEngine(config(requester))

		await engine.start()
		engine.stop()
		await engine.start()
		engine.stop()

		equal(requests.length, 1)
	})

	it('reports a callback error without a caller to onError and continues', async () => {
		const cause = new Error('player bug')
		const errors: SteeringError[] = []
		const { requester } = createStubRequester(manifestResponse(MANIFEST))
		const engine = createSteeringEngine(config(requester, {
			onManifest: () => {
				throw cause
			},
			onError: (error) => errors.push(error),
		}))

		await engine.start()
		engine.stop()

		equal(engine.pathway, 'CDN-B')
		deepEqual(errors, [{ type: SteeringErrorType.CALLBACK, callback: 'onManifest', cause, message: 'The onManifest callback threw.' }])
	})

	it('throws a callback error to the caller of penalize() after it selects', async () => {
		const cause = new Error('player bug')
		const { requester } = createStubRequester(manifestResponse(MANIFEST))
		const engine = createSteeringEngine(config(requester, {
			onPathwayChange: (pathway) => {
				if (pathway === 'CDN-A') {
					throw cause
				}
			},
		}))

		await engine.start()

		throws(() => engine.penalize(), (error) => error === cause)
		engine.stop()

		equal(engine.pathway, 'CDN-A')
	})

	it('throws a callback error from the timer callback without onError', async () => {
		const cause = new Error('player bug')
		let fail = false
		const { requester } = createStubRequester(manifestResponse(MANIFEST))
		const engine = createSteeringEngine(config(requester, {
			penalty: 1000,
			onPathwayChange: () => {
				if (fail) {
					throw cause
				}
			},
		}))

		await engine.start()
		engine.penalize()
		fail = true

		throws(() => mock.timers.tick(1000), (error) => error === cause)
		engine.stop()

		equal(engine.pathway, 'CDN-B')
	})

	it('reports a getThroughput error and sends the request without throughput', async () => {
		const cause = new Error('player bug')
		const errors: SteeringError[] = []
		const { requester, requests } = createStubRequester(manifestResponse(MANIFEST))
		const engine = createSteeringEngine(config(requester, {
			getThroughput: () => {
				throw cause
			},
			onError: (error) => errors.push(error),
		}))

		await engine.start()
		engine.stop()

		equal(requests[0].url, 'https://steering.example.com/manifest.json?_HLS_pathway=%22CDN-A%22')
		deepEqual(errors, [{ type: SteeringErrorType.CALLBACK, callback: 'getThroughput', cause, message: 'The getThroughput callback threw.' }])
	})

	it('throws a callback error of start() from a timer callback without onError', async () => {
		const cause = new Error('player bug')
		const { requester } = createStubRequester(manifestResponse(MANIFEST))
		const engine = createSteeringEngine(config(requester, {
			getThroughput: () => {
				throw cause
			},
		}))

		await engine.start()

		throws(() => mock.timers.tick(1), (error) => error === cause)
		engine.stop()

		equal(engine.pathway, 'CDN-B')
	})
})
```

- [ ] **Step 10: Run the tests and check that they fail**

```bash
npm test -w libs/content-steering
```

Expected: FAIL. The nine new test files report `does not provide an export named` for `createSteeringEngine`, `STEERING_PROTOCOL_DASH`, or `STEERING_ERROR_TYPE_CALLBACK`. The 33 tests of Task 1 and the existing tests pass.

- [ ] **Step 11: Write the public types**

Create `src/SteeringProtocol.ts`:

```ts
import type { ValueOf } from '@svta/cml-utils'

/**
 * The HLS protocol for content steering.
 *
 *
 * @beta
 */
export const STEERING_PROTOCOL_HLS = 'hls' as const

/**
 * The DASH protocol for content steering.
 *
 *
 * @beta
 */
export const STEERING_PROTOCOL_DASH = 'dash' as const

/**
 * The delivery protocols of content steering.
 *
 * @enum
 *
 * @beta
 */
export const SteeringProtocol = {
	/**
	 * HTTP Live Streaming (HLS)
	 */
	HLS: STEERING_PROTOCOL_HLS as typeof STEERING_PROTOCOL_HLS,

	/**
	 * MPEG DASH
	 */
	DASH: STEERING_PROTOCOL_DASH as typeof STEERING_PROTOCOL_DASH,
} as const

/**
 * @beta
 */
export type SteeringProtocol = ValueOf<typeof SteeringProtocol>;
```

Create `src/SteeringErrorType.ts`:

```ts
import type { ValueOf } from '@svta/cml-utils'

/**
 * A Steering Manifest request failed. Matches the SVTA2070 code 2040.
 *
 *
 * @beta
 */
export const STEERING_ERROR_TYPE_LOAD = 'load' as const

/**
 * A Steering Manifest is not valid. Matches the SVTA2070 code 2041.
 *
 *
 * @beta
 */
export const STEERING_ERROR_TYPE_PARSE = 'parse' as const

/**
 * A callback of the player threw, and no caller can receive the exception.
 *
 *
 * @beta
 */
export const STEERING_ERROR_TYPE_CALLBACK = 'callback' as const

/**
 * The types of `SteeringError`.
 *
 * @enum
 *
 * @beta
 */
export const SteeringErrorType = {
	/**
	 * A Steering Manifest request failed.
	 */
	LOAD: STEERING_ERROR_TYPE_LOAD as typeof STEERING_ERROR_TYPE_LOAD,

	/**
	 * A Steering Manifest is not valid.
	 */
	PARSE: STEERING_ERROR_TYPE_PARSE as typeof STEERING_ERROR_TYPE_PARSE,

	/**
	 * A callback of the player threw.
	 */
	CALLBACK: STEERING_ERROR_TYPE_CALLBACK as typeof STEERING_ERROR_TYPE_CALLBACK,
} as const

/**
 * @beta
 */
export type SteeringErrorType = ValueOf<typeof SteeringErrorType>;
```

Create `src/SteeringRequester.ts`:

```ts
import type { HttpRequest, HttpResponse } from '@svta/cml-utils'

/**
 * A function that sends a Steering Manifest request.
 *
 * A `Requester` function from `@svta/cml-request` has a compatible type.
 *
 *
 * @beta
 */
export type SteeringRequester = (request: HttpRequest) => Promise<HttpResponse>;
```

Create `src/SteeringError.ts`:

```ts
import type { STEERING_ERROR_TYPE_CALLBACK, STEERING_ERROR_TYPE_LOAD, STEERING_ERROR_TYPE_PARSE } from './SteeringErrorType.ts'

/**
 * An error that the engine reports to `onError`.
 *
 * `SteeringErrorType` lists the values of `type`.
 *
 *
 * @beta
 */
export type SteeringError =
	| {
		/**
		 * `load` when the request fails, and `parse` when the Steering Manifest is not valid.
		 */
		readonly type: typeof STEERING_ERROR_TYPE_LOAD | typeof STEERING_ERROR_TYPE_PARSE;

		/**
		 * The request URI.
		 */
		readonly url: string;

		/**
		 * The HTTP status, if the server responded.
		 */
		readonly status?: number;

		/**
		 * The exception, for network errors and JSON errors.
		 */
		readonly cause?: unknown;

		/**
		 * A description of the error.
		 */
		readonly message: string;

		/**
		 * The milliseconds until the next request. Absent when no request follows.
		 */
		readonly retryDelay?: number;
	}
	| {
		/**
		 * An exception from a callback of the player.
		 */
		readonly type: typeof STEERING_ERROR_TYPE_CALLBACK;

		/**
		 * The callback that threw.
		 */
		readonly callback: 'acceptClone' | 'getReportedPathways' | 'getThroughput' | 'onManifest' | 'onPathwayChange';

		/**
		 * The exception.
		 */
		readonly cause: unknown;

		/**
		 * A description of the error.
		 */
		readonly message: string;
	};
```

Create `src/SteeringEngineConfig.ts`:

```ts
import type { PathwayClone } from './PathwayClone.ts'
import type { SteeringError } from './SteeringError.ts'
import type { SteeringManifest } from './SteeringManifest.ts'
import type { SteeringProtocol } from './SteeringProtocol.ts'
import type { SteeringRequester } from './SteeringRequester.ts'

/**
 * The configuration of a content steering engine.
 *
 *
 * @beta
 */
export type SteeringEngineConfig = {
	/**
	 * The delivery protocol.
	 */
	protocol: SteeringProtocol;

	/**
	 * The absolute URI of the first Steering Manifest request.
	 */
	uri: string;

	/**
	 * The pathway IDs that the Content Description defines.
	 */
	pathways: readonly string[];

	/**
	 * The pathway that the player applies now. The priority list before the
	 * first valid Steering Manifest starts with this pathway, followed by the
	 * other `pathways`.
	 */
	pathway?: string;

	/**
	 * The penalty duration in milliseconds. The default is
	 * `DEFAULT_PATHWAY_PENALTY` for HLS, and the TTL of the last valid
	 * Steering Manifest for DASH.
	 */
	penalty?: number;

	/**
	 * When `true`, the first request has no steering query parameters.
	 * For DASH, set it from `@queryBeforeStart`.
	 */
	queryBeforeStart?: boolean;

	/**
	 * The function that sends the Steering Manifest requests. The default uses `fetch`.
	 */
	requester?: SteeringRequester;

	/**
	 * Returns the throughput estimate of the player for a pathway, in bits per second.
	 */
	getThroughput?: (pathway: string) => number | undefined;

	/**
	 * DASH only. Returns every pathway that the player used since the
	 * previous request, for `_DASH_pathway`. Without this function, the
	 * engine lists the pathways that it selected since the previous request.
	 */
	getReportedPathways?: () => readonly string[];

	/**
	 * Returns `false` for a valid pathway clone that the player cannot build.
	 * The engine then ignores the clone. The engine calls this function for
	 * each valid clone of each Steering Manifest, before `onManifest`.
	 */
	acceptClone?: (clone: PathwayClone) => boolean;

	/**
	 * Called when the selected pathway changes.
	 */
	onPathwayChange?: (pathway: string) => void;

	/**
	 * Called with each valid Steering Manifest, its pathway clones, the URI
	 * of the response, and the URI of the next request, before the engine
	 * selects a pathway.
	 */
	onManifest?: (manifest: SteeringManifest, clones: readonly PathwayClone[], context: { readonly url: string; readonly reloadUri: string }) => void;

	/**
	 * Called when a request fails, when a Steering Manifest is not valid,
	 * or when a callback throws and no caller can receive the exception.
	 */
	onError?: (error: SteeringError) => void;
};
```

Create `src/SteeringEngine.ts`:

```ts
/**
 * A content steering engine.
 *
 *
 * @beta
 */
export type SteeringEngine = {
	/**
	 * The selected pathway.
	 */
	readonly pathway: string | undefined;

	/**
	 * The selected pathway first, then the other known pathways of the
	 * priority list that are not penalized, in priority order.
	 */
	readonly priority: readonly string[];

	/**
	 * Sends the first request, or resumes the requests after `stop()`.
	 *
	 * @returns A promise that resolves when the engine has processed the
	 * response. The promise never rejects.
	 */
	start(): Promise<void>;

	/**
	 * Cancels the timers and ignores any response that arrives later.
	 * The engine keeps its state.
	 */
	stop(): void;

	/**
	 * Excludes a pathway from the selection for the penalty duration.
	 * The engine selects a pathway before the method returns.
	 *
	 * @param pathway - The pathway. The default is the selected pathway.
	 */
	penalize(pathway?: string): void;

	/**
	 * Replaces the priority list until the next valid Steering Manifest.
	 * The engine selects a pathway before the method returns.
	 *
	 * @param priority - The pathway IDs, in priority order.
	 */
	setPriority(priority: readonly string[]): void;

	/**
	 * Replaces the steering URI, the pathways of the Content Description, or
	 * both. The engine keeps its penalties and its request schedule, and it
	 * selects a pathway before the method returns.
	 *
	 * @param changes - The new values.
	 */
	update(changes: { readonly uri?: string; readonly pathways?: readonly string[] }): void;
};
```

- [ ] **Step 12: Write the internal modules**

Create `src/uniqueStrings.ts`:

```ts
/**
 * Returns the strings of a list without duplicates, in their first order.
 *
 * @param list - The list.
 * @returns The strings of the list.
 *
 * @internal
 */
export function uniqueStrings(list: readonly unknown[]): string[] {
	const result: string[] = []

	for (const item of list) {
		if (typeof item === 'string' && !result.includes(item)) {
			result.push(item)
		}
	}

	return result
}
```

Create `src/parseRetryAfter.ts`:

```ts
const DELAY_SECONDS = /^\d+$/
const HTTP_DATE = /GMT$/

/**
 * Converts a `Retry-After` header value to a delay.
 *
 * @param value - The header value: a number of seconds or an HTTP date.
 * @param now - The current time, in milliseconds since the epoch.
 * @returns The delay in milliseconds, or `undefined` when the value is not valid.
 *
 * @internal
 */
export function parseRetryAfter(value: string | undefined, now: number): number | undefined {
	const text = value?.trim()

	if (!text) {
		return undefined
	}

	if (DELAY_SECONDS.test(text)) {
		return Number(text) * 1000
	}

	const time = HTTP_DATE.test(text) ? Date.parse(text) : NaN

	return Number.isNaN(time) ? undefined : Math.max(0, time - now)
}
```

Create `src/parseSteeringManifest.ts`:

```ts
import type { SteeringManifest } from './SteeringManifest.ts'
import { uniqueStrings } from './uniqueStrings.ts'

/**
 * The result of `parseSteeringManifest`.
 *
 * @internal
 */
export type ParsedSteeringManifest =
	| {
		readonly manifest: SteeringManifest;
		readonly priority: readonly string[];
		readonly clones: readonly unknown[];
		readonly reloadUri: string | undefined;
	}
	| {
		readonly error: string;
		readonly version: boolean;
		readonly cause?: unknown;
	};

/**
 * Parses and checks the body of a Steering Manifest response.
 *
 * The Steering Manifest is valid when VERSION is 1, TTL is a positive
 * number, PATHWAY-PRIORITY has at least one string, and a relative
 * RELOAD-URI resolves. PATHWAY-PRIORITY keeps the first of each string.
 * An absent or empty PATHWAY-CLONES array means no clones.
 *
 * @param data - The response body, as a string or as a parsed JSON value.
 * @param uri - The URI of the response. A relative RELOAD-URI resolves against it.
 * @returns The Steering Manifest, its priority list, its clones, and its
 * resolved RELOAD-URI, or an error. `version` is `true` when the error is a
 * VERSION other than 1.
 *
 * @internal
 */
export function parseSteeringManifest(data: unknown, uri: string): ParsedSteeringManifest {
	let value = data

	if (typeof data === 'string') {
		try {
			value = JSON.parse(data)
		} catch (cause) {
			return { error: `The Steering Manifest from ${uri} is not valid JSON.`, version: false, cause }
		}
	}

	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return { error: `The Steering Manifest from ${uri} is not a JSON object.`, version: false }
	}

	const manifest = value as SteeringManifest

	if (manifest.VERSION !== 1) {
		return { error: `The Steering Manifest from ${uri} has VERSION ${String(manifest.VERSION)}. Only VERSION 1 is supported.`, version: true }
	}

	if (typeof manifest.TTL !== 'number' || !(manifest.TTL > 0)) {
		return { error: `The Steering Manifest from ${uri} has no positive TTL.`, version: false }
	}

	const list: unknown = manifest['PATHWAY-PRIORITY']
	const priority = Array.isArray(list) ? uniqueStrings(list) : []

	if (priority.length === 0) {
		return { error: `The Steering Manifest from ${uri} has no pathway in PATHWAY-PRIORITY.`, version: false }
	}

	const cloneList: unknown = manifest['PATHWAY-CLONES']
	const clones: readonly unknown[] = Array.isArray(cloneList) ? cloneList : []
	const reload: unknown = manifest['RELOAD-URI']

	if (reload === undefined) {
		return { manifest, priority, clones, reloadUri: undefined }
	}

	try {
		if (typeof reload !== 'string') {
			throw new TypeError('RELOAD-URI is not a string')
		}

		return { manifest, priority, clones, reloadUri: new URL(reload, uri).href }
	} catch (cause) {
		return { error: `The RELOAD-URI ${JSON.stringify(reload)} of the Steering Manifest from ${uri} does not resolve.`, version: false, cause }
	}
}
```

Create `src/resolveClones.ts`:

```ts
import { isValidPathwayClone } from './isValidPathwayClone.ts'
import type { PathwayClone } from './PathwayClone.ts'
import { toHostname } from './toHostname.ts'
import type { UriReplacement } from './UriReplacement.ts'

const PATHWAY_ID = /^[\w.-]+$/

/**
 * Returns the valid pathway clones of a Steering Manifest, in array order.
 *
 * @param clones - The `PATHWAY-CLONES` array.
 * @param pathways - The pathway IDs of the Content Description.
 * @returns The valid pathway clones.
 *
 * @see {@link https://datatracker.ietf.org/doc/html/draft-pantos-content-steering-05#section-5 | Pathway Cloning}
 *
 * @internal
 */
export function resolveClones(clones: readonly unknown[], pathways: readonly string[]): PathwayClone[] {
	const known = new Set(pathways)
	const valid: PathwayClone[] = []

	for (const item of clones) {
		const clone = item as PathwayClone

		if (!isValidPathwayClone(clone)) {
			continue
		}

		const id = clone.ID

		if (!PATHWAY_ID.test(id) || known.has(id) || !known.has(clone['BASE-ID']) || !isValidReplacement(clone['URI-REPLACEMENT'])) {
			continue
		}

		known.add(id)
		valid.push(clone)
	}

	return valid
}

function isValidReplacement({ HOST, PARAMS }: UriReplacement): boolean {
	if (HOST !== undefined && (typeof HOST !== 'string' || toHostname(HOST) === undefined)) {
		return false
	}

	if (PARAMS === undefined) {
		return true
	}

	return typeof PARAMS === 'object' && PARAMS !== null && Object.keys(PARAMS).every(name => name !== '' && typeof PARAMS[name] === 'string')
}
```

Create `src/selectPathway.ts`:

```ts
/**
 * Returns the first pathway of a priority list that is known and not penalized.
 *
 * @param priority - The priority list.
 * @param known - The known pathways.
 * @param penalized - The penalized pathways.
 * @returns The pathway, or `undefined` when no pathway qualifies.
 *
 * @see {@link https://datatracker.ietf.org/doc/html/draft-pantos-content-steering-05#section-7 | Steering Client Responsibilities, step 5}
 *
 * @internal
 */
export function selectPathway(priority: readonly string[], known: ReadonlySet<string>, penalized: ReadonlyMap<string, number>): string | undefined {
	return priority.find(pathway => known.has(pathway) && !penalized.has(pathway))
}
```

Create `src/buildSteeringUri.ts`:

```ts
import { replaceQueryParams } from './replaceQueryParams.ts'

/**
 * Sets the steering query parameters on a Steering Manifest URI.
 * A `data` URI gets no parameters.
 *
 * @param uri - The absolute Steering Manifest URI.
 * @param params - The steering query parameters.
 * @returns The request URI.
 *
 * @internal
 */
export function buildSteeringUri(uri: string, params: Readonly<Record<string, string>>): string {
	const url = new URL(uri)

	if (url.protocol === 'data:' || Object.keys(params).length === 0) {
		return uri
	}

	url.search = replaceQueryParams(url.search, params)

	return url.href
}
```

- [ ] **Step 13: Write the engine**

Create `src/createSteeringEngine.ts`:

```ts
import type { HttpRequest, HttpResponse } from '@svta/cml-utils'
import { buildSteeringUri } from './buildSteeringUri.ts'
import { DEFAULT_PATHWAY_PENALTY } from './DEFAULT_PATHWAY_PENALTY.ts'
import { DEFAULT_TTL } from './DEFAULT_TTL.ts'
import { parseRetryAfter } from './parseRetryAfter.ts'
import { parseSteeringManifest } from './parseSteeringManifest.ts'
import type { PathwayClone } from './PathwayClone.ts'
import { resolveClones } from './resolveClones.ts'
import { selectPathway } from './selectPathway.ts'
import type { SteeringEngine } from './SteeringEngine.ts'
import type { SteeringEngineConfig } from './SteeringEngineConfig.ts'
import type { SteeringError } from './SteeringError.ts'
import { STEERING_ERROR_TYPE_CALLBACK, STEERING_ERROR_TYPE_LOAD, STEERING_ERROR_TYPE_PARSE } from './SteeringErrorType.ts'
import type { SteeringManifest } from './SteeringManifest.ts'
import { STEERING_PROTOCOL_DASH, STEERING_PROTOCOL_HLS } from './SteeringProtocol.ts'
import { uniqueStrings } from './uniqueStrings.ts'

const MAX_DELAY = 2147483647

type SteeringRequestError = Exclude<SteeringError, { type: typeof STEERING_ERROR_TYPE_CALLBACK }>

type CallbackName = Extract<SteeringError, { type: typeof STEERING_ERROR_TYPE_CALLBACK }>['callback']

type Failure = {
	readonly name: CallbackName;
	readonly cause: unknown;
}

/**
 * Creates a content steering engine.
 *
 * The engine requests the Steering Manifest, schedules the next request,
 * and selects the pathway that the player must apply.
 *
 * A callback that throws inside `penalize()`, `setPriority()`, or `update()`
 * throws to the caller, after the engine has finished the call. Other
 * callback exceptions go to `onError`. Without `onError`, the engine throws
 * them from a timer callback.
 *
 * @param config - The configuration of the engine.
 * @returns The engine.
 *
 * @throws TypeError when the configuration is not valid.
 *
 * @example
 * {@includeCode ../test/createSteeringEngine.test.ts#example}
 *
 * @see {@link https://datatracker.ietf.org/doc/html/draft-pantos-content-steering-05#section-7 | Steering Client Responsibilities}
 *
 * @beta
 */
export function createSteeringEngine(config: SteeringEngineConfig): SteeringEngine {
	checkConfig(config)

	const {
		protocol,
		penalty,
		queryBeforeStart,
		requester = fetchRequester,
		getThroughput,
		getReportedPathways,
		acceptClone,
		onPathwayChange,
		onManifest,
		onError,
	} = config
	const isDash = protocol === STEERING_PROTOCOL_DASH
	const prefix = isDash ? '_DASH_' : '_HLS_'
	const penalties = new Map<string, number>()

	let pathways: readonly string[] = uniqueStrings(config.pathways)
	let selected = config.pathway
	let configuredUri = config.uri
	let uri = configuredUri
	let ttl = DEFAULT_TTL
	let loaded = false
	let ended = false
	let running = false
	let sent = false
	let session = 0
	let fallbackPriority = true
	let priority: readonly string[] = selected === undefined ? [] : fallbackList()
	let manifestClones: readonly unknown[] = []
	let known: ReadonlySet<string> = new Set(pathways)
	let trail: string[] = selected === undefined ? [] : [selected]
	let nextRequestAt: number | undefined
	let requestTimer: ReturnType<typeof setTimeout> | undefined
	let penaltyTimer: ReturnType<typeof setTimeout> | undefined
	let pending: Promise<void> | undefined
	let settle: (() => void) | undefined
	let failures: Failure[] = []

	function start(): Promise<void> {
		if (running) {
			return pending ?? Promise.resolve()
		}

		return run(false, begin)
	}

	function begin(): Promise<void> {
		running = true
		select()

		if (ended) {
			return Promise.resolve()
		}

		const delay = nextRequestAt === undefined ? 0 : nextRequestAt - Date.now()

		if (delay > 0) {
			scheduleRequest(delay)
			return Promise.resolve()
		}

		const promise = new Promise<void>(resolve => {
			settle = resolve
		})
		const done = () => {
			if (pending === promise) {
				release()
			}
		}

		pending = promise
		void load().then(done, (cause: unknown) => {
			done()
			throw cause
		})

		return promise
	}

	function stop(): void {
		running = false
		session++
		clearTimeout(requestTimer)
		clearTimeout(penaltyTimer)
		requestTimer = undefined
		penaltyTimer = undefined
		release()
	}

	function penalize(pathway: string | undefined = selected): void {
		if (pathway === undefined) {
			return
		}

		penalties.set(pathway, Date.now() + (penalty ?? (isDash ? ttl * 1000 : DEFAULT_PATHWAY_PENALTY)))
		run(true, select)
	}

	function setPriority(list: readonly string[]): void {
		if (!Array.isArray(list) || list.some(id => typeof id !== 'string')) {
			throw new TypeError(`SteeringEngine.setPriority: priority must be an array of strings. Received ${JSON.stringify(list)}.`)
		}

		run(true, () => {
			priority = uniqueStrings(list)
			fallbackPriority = false
			select()
		})
	}

	function update(changes: { readonly uri?: string; readonly pathways?: readonly string[] }): void {
		const { uri: nextUri, pathways: nextPathways } = changes

		if (nextUri !== undefined) {
			checkUri('SteeringEngine.update', nextUri)
		}

		if (nextPathways !== undefined) {
			checkPathways('SteeringEngine.update', nextPathways)
		}

		run(true, () => {
			if (nextPathways !== undefined) {
				pathways = uniqueStrings(nextPathways)

				if (fallbackPriority && priority.length > 0) {
					priority = fallbackList()
				}

				setClones(manifestClones)
			}

			if (nextUri !== undefined && nextUri !== configuredUri) {
				configuredUri = nextUri
				uri = nextUri

				if (ended) {
					ended = false
					scheduleRequest(0)
				}
			}

			select()
		})
	}

	function release(): void {
		settle?.()
		settle = undefined
		pending = undefined
	}

	function run<T>(caller: boolean, body: () => T): T {
		const outer = failures

		failures = []

		try {
			const result = body()

			raise(failures, caller)

			return result
		} finally {
			failures = outer
		}
	}

	function raise(list: readonly Failure[], caller: boolean): void {
		const thrown = caller ? list[0] : undefined

		for (const failure of list) {
			if (failure !== thrown) {
				report({ type: STEERING_ERROR_TYPE_CALLBACK, callback: failure.name, cause: failure.cause, message: `The ${failure.name} callback threw.` })
			}
		}

		if (thrown) {
			throw thrown.cause
		}
	}

	function invoke<A extends unknown[], R>(name: CallbackName, callback: ((...args: A) => R) | undefined, ...args: A): R | undefined {
		if (!callback) {
			return undefined
		}

		try {
			return callback(...args)
		} catch (cause) {
			failures.push({ name, cause })
			return undefined
		}
	}

	function load(): Promise<void> {
		const token = session
		const url = buildSteeringUri(uri, queryParams())

		sent = true
		trail = selected === undefined ? [] : [selected]

		return send({ url, method: 'GET', responseType: 'text' }).then(
			response => {
				if (token === session) {
					run(false, () => receive(url, response))
				}
			},
			(cause: unknown) => {
				if (token === session) {
					retry({ type: STEERING_ERROR_TYPE_LOAD, url, cause, message: `The Steering Manifest request to ${url} failed.` })
				}
			},
		)
	}

	function send(request: HttpRequest): Promise<HttpResponse> {
		try {
			return Promise.resolve(requester(request))
		} catch (cause) {
			return Promise.reject(cause)
		}
	}

	function receive(url: string, response: HttpResponse): void {
		const status = response.status ?? 200

		if (status >= 200 && status < 300) {
			const responseUrl = response.url || url
			const result = parseSteeringManifest(response.data, responseUrl)

			if ('manifest' in result) {
				apply(result.manifest, result.priority, result.clones, result.reloadUri, responseUrl)
			} else if (isDash && result.version) {
				end()
				report({ type: STEERING_ERROR_TYPE_PARSE, url, status, message: result.error })
				fallback()
			} else {
				retry({ type: STEERING_ERROR_TYPE_PARSE, url, status, cause: result.cause, message: result.error })
			}
			return
		}

		if (status === 410) {
			end()
			report({ type: STEERING_ERROR_TYPE_LOAD, url, status, message: `The steering server returned status 410 for ${url}. No request follows.` })

			if (!loaded) {
				fallback()
			}
			return
		}

		const retryAfter = status === 429 ? parseRetryAfter(getHeader(response.headers, 'retry-after'), Date.now()) : undefined

		if (retryAfter !== undefined) {
			if (isDash) {
				ttl = retryAfter / 1000
			}

			retry({ type: STEERING_ERROR_TYPE_LOAD, url, status, message: `The steering server returned status 429 for ${url}.` }, retryAfter)
			return
		}

		retry({ type: STEERING_ERROR_TYPE_LOAD, url, status, message: `The Steering Manifest request to ${url} failed with status ${status}.` })
	}

	function apply(manifest: SteeringManifest, list: readonly string[], clones: readonly unknown[], reloadUri: string | undefined, responseUrl: string): void {
		loaded = true
		ttl = manifest.TTL
		uri = reloadUri ?? uri
		priority = list
		fallbackPriority = false

		const valid = setClones(clones)

		scheduleRequest(ttl * 1000)
		invoke('onManifest', onManifest, manifest, valid, { url: responseUrl, reloadUri: uri })
		select()
	}

	function setClones(clones: readonly unknown[]): PathwayClone[] {
		const valid = resolveClones(clones, pathways).filter(clone => invoke('acceptClone', acceptClone, clone) !== false)

		manifestClones = clones
		known = new Set([...pathways, ...valid.map(clone => clone.ID)])

		return valid
	}

	function fallbackList(): readonly string[] {
		return selected === undefined ? pathways : [selected, ...pathways.filter(pathway => pathway !== selected)]
	}

	function fallback(): void {
		priority = fallbackList()
		fallbackPriority = true
		setClones([])
		select()
	}

	function select(): void {
		const now = Date.now()

		penalties.forEach((expiry, pathway) => {
			if (expiry <= now) {
				penalties.delete(pathway)
			}
		})

		const next = selectPathway(priority, known, penalties)

		if (next !== undefined && next !== selected) {
			selected = next

			if (!trail.includes(next)) {
				trail.push(next)
			}

			invoke('onPathwayChange', onPathwayChange, next)
		}

		schedulePenaltyCheck(now)
	}

	function schedulePenaltyCheck(now: number): void {
		clearTimeout(penaltyTimer)
		penaltyTimer = undefined

		if (!running || penalties.size === 0) {
			return
		}

		let expiry = Infinity

		penalties.forEach(end => {
			expiry = Math.min(expiry, end)
		})

		penaltyTimer = setTimeout(onPenaltyTimer, Math.min(Math.max(expiry - now, 0), MAX_DELAY))
	}

	function onPenaltyTimer(): void {
		penaltyTimer = undefined
		run(false, select)
	}

	function scheduleRequest(delay: number): void {
		nextRequestAt = Date.now() + delay
		clearTimeout(requestTimer)
		requestTimer = running ? setTimeout(onRequestTimer, Math.min(delay, MAX_DELAY)) : undefined
	}

	function onRequestTimer(): void {
		requestTimer = undefined

		const delay = (nextRequestAt ?? 0) - Date.now()

		if (delay > 0) {
			scheduleRequest(delay)
			return
		}

		run(false, () => {
			void load()
		})
	}

	function end(): void {
		ended = true
		nextRequestAt = undefined
		clearTimeout(requestTimer)
		requestTimer = undefined
	}

	function retry(error: Omit<SteeringRequestError, 'retryDelay'>, delay: number = ttl * 1000): void {
		scheduleRequest(delay)
		report({ ...error, retryDelay: delay })
	}

	function report(error: SteeringError): void {
		if (!onError) {
			if (error.type === STEERING_ERROR_TYPE_CALLBACK) {
				throwLater(error.cause)
			}
			return
		}

		try {
			onError(error)
		} catch (cause) {
			throwLater(cause)
		}
	}

	function queryParams(): Record<string, string> {
		const params: Record<string, string> = {}

		if (queryBeforeStart && !sent) {
			return params
		}

		const list = isDash ? reportedPathways() : selected === undefined ? [] : [selected]

		if (list.length === 0) {
			return params
		}

		params[`${prefix}pathway`] = `"${list.join(',')}"`

		const throughputs = list.map(throughputOf)

		if (throughputs.some(value => value !== '')) {
			params[`${prefix}throughput`] = throughputs.join(',')
		}

		return params
	}

	function reportedPathways(): readonly string[] {
		const reported = invoke('getReportedPathways', getReportedPathways)

		return Array.isArray(reported) ? uniqueStrings(reported) : trail
	}

	function throughputOf(pathway: string): string {
		const value = invoke('getThroughput', getThroughput, pathway)

		return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? String(Math.round(value)) : ''
	}

	return {
		get pathway(): string | undefined {
			return selected
		},
		get priority(): readonly string[] {
			const now = Date.now()
			const list = selected === undefined ? [] : [selected]

			for (const id of priority) {
				if (id !== selected && known.has(id) && !((penalties.get(id) ?? 0) > now)) {
					list.push(id)
				}
			}

			return list
		},
		start,
		stop,
		penalize,
		setPriority,
		update,
	}
}

function checkConfig({ protocol, uri, pathways, pathway, penalty }: SteeringEngineConfig): void {
	if (protocol !== STEERING_PROTOCOL_HLS && protocol !== STEERING_PROTOCOL_DASH) {
		throw new TypeError(`createSteeringEngine: protocol must be 'hls' or 'dash'. Received ${JSON.stringify(protocol)}.`)
	}

	checkUri('createSteeringEngine', uri)
	checkPathways('createSteeringEngine', pathways)

	if (pathway !== undefined && !pathways.includes(pathway)) {
		throw new TypeError(`createSteeringEngine: pathway must be one of pathways. Received ${JSON.stringify(pathway)}.`)
	}

	if (penalty !== undefined && (typeof penalty !== 'number' || !Number.isFinite(penalty) || penalty < 0)) {
		throw new TypeError(`createSteeringEngine: penalty must be a finite number of milliseconds, 0 or more. Received ${JSON.stringify(penalty)}.`)
	}
}

function checkUri(caller: string, uri: unknown): void {
	if (typeof uri !== 'string' || !isAbsoluteUri(uri)) {
		throw new TypeError(`${caller}: uri must be an absolute URI. Received ${JSON.stringify(uri)}.`)
	}
}

function checkPathways(caller: string, pathways: unknown): void {
	if (!Array.isArray(pathways) || pathways.length === 0 || pathways.some(id => typeof id !== 'string')) {
		throw new TypeError(`${caller}: pathways must be a non-empty array of strings. Received ${JSON.stringify(pathways)}.`)
	}
}

function isAbsoluteUri(uri: string): boolean {
	try {
		new URL(uri)
		return true
	} catch {
		return false
	}
}

function getHeader(headers: Record<string, string> | undefined, name: string): string | undefined {
	if (!headers) {
		return undefined
	}

	for (const key in headers) {
		if (key.toLowerCase() === name) {
			return headers[key]
		}
	}

	return undefined
}

function throwLater(cause: unknown): void {
	setTimeout(() => {
		throw cause
	}, 0)
}

function fetchRequester(request: HttpRequest): Promise<HttpResponse> {
	const { url, method, headers, credentials, mode } = request

	return fetch(url, { method, headers, credentials, mode }).then(response => response.text().then(data => {
		const responseHeaders: Record<string, string> = {}

		response.headers.forEach((value, key) => {
			responseHeaders[key] = value
		})

		return { request, url: response.url, status: response.status, headers: responseHeaders, data }
	}))
}
```

- [ ] **Step 14: Export the engine**

Replace the export lines of `src/index.ts` with this block. The order is alphabetical without regard to case, like the existing lines:

```ts
export * from './applyUriReplacement.ts'
export * from './createSteeringEngine.ts'
export * from './DEFAULT_PATHWAY_PENALTY.ts'
export * from './DEFAULT_TTL.ts'
export * from './isValidPathwayClone.ts'
export * from './isValidSteeringManifest.ts'
export type * from './PathwayClone.ts'
export type * from './SteeringEngine.ts'
export type * from './SteeringEngineConfig.ts'
export type * from './SteeringError.ts'
export * from './SteeringErrorType.ts'
export type * from './SteeringManifest.ts'
export * from './SteeringProtocol.ts'
export type * from './SteeringRequester.ts'
export type * from './UriReplacement.ts'
```

- [ ] **Step 15: Build and run the tests**

```bash
npm run build -w libs/content-steering && npm test -w libs/content-steering
```

Expected: `ℹ tests 123`, `ℹ pass 123`, and `ℹ fail 0`.

- [ ] **Step 16: Check the API report**

```bash
git diff libs/content-steering/config/cml-content-steering.api.md
```

Expected: the report adds these declarations, and each one has `// @beta`:

- the function `createSteeringEngine`
- the constants `SteeringProtocol`, `STEERING_PROTOCOL_HLS`, and `STEERING_PROTOCOL_DASH`
- the constants `SteeringErrorType`, `STEERING_ERROR_TYPE_LOAD`, `STEERING_ERROR_TYPE_PARSE`, and `STEERING_ERROR_TYPE_CALLBACK`
- the types `SteeringProtocol`, `SteeringErrorType`, `SteeringEngine`, `SteeringEngineConfig`, `SteeringRequester`, and `SteeringError`
- the imports of `HttpRequest`, `HttpResponse`, and `ValueOf` from `@svta/cml-utils`

No internal module appears in the report.

- [ ] **Step 17: Run the repository checks**

```bash
npm run build
npm run typecheck
npx eslint libs/content-steering
```

Expected: the build completes, `tsc --noEmit` prints no error, and `eslint` prints nothing. The build prints some API Extractor warnings for `libs/cmcd`. Those warnings existed before this plan.

- [ ] **Step 18: Add the changelog entries**

In `CHANGELOG.md`, add these lines under `### Added` of `## [Unreleased]`:

```markdown
- `createSteeringEngine`, a content steering engine for HLS and DASH players. It implements the RFC in `rfc/content-steering-engine.md` ([#61](https://github.com/streaming-video-technology-alliance/common-media-library/issues/61))
- `SteeringProtocol`, `STEERING_PROTOCOL_HLS`, and `STEERING_PROTOCOL_DASH` ([#61](https://github.com/streaming-video-technology-alliance/common-media-library/issues/61))
- `SteeringErrorType`, `STEERING_ERROR_TYPE_LOAD`, `STEERING_ERROR_TYPE_PARSE`, and `STEERING_ERROR_TYPE_CALLBACK` ([#61](https://github.com/streaming-video-technology-alliance/common-media-library/issues/61))
```

Add this line under `### Changed`:

```markdown
- The package has a peer dependency on `@svta/cml-utils`. The package imports only types from it ([#61](https://github.com/streaming-video-technology-alliance/common-media-library/issues/61))
```

- [ ] **Step 19: Commit**

```bash
git add libs/content-steering
git commit -s -F - <<'EOF'
feat(content-steering): add createSteeringEngine

Refs #61

Co-Authored-By: <agent name> <model> <noreply@anthropic.com>
EOF
```

### Task 3: Documentation and verification

**Files:**
- Modify: `src/index.ts`, `README.md`

**Interfaces:**
- Consumes: the exports of Tasks 1 and 2.
- Produces: the package documentation and the measurements for the implementation pull request.

- [ ] **Step 1: Update the package links**

Replace the `@see` lines of the comment at the top of `src/index.ts` with:

```ts
 * @see {@link https://datatracker.ietf.org/doc/html/draft-pantos-content-steering-05 | Pathway-based Content Steering}
 * @see {@link https://datatracker.ietf.org/doc/html/draft-pantos-hls-rfc8216bis-22#section-7 | HTTP Live Streaming 2nd Edition, section 7}
 * @see {@link https://www.etsi.org/deliver/etsi_ts/103900_103999/103998/01.01.01_60/ts_103998v010101p.pdf | ETSI TS 103 998 V1.1.1 (2024-01)}
```

- [ ] **Step 2: Rewrite the README**

Replace the content of `README.md`:

````markdown
# @svta/cml-content-steering

Content steering for HLS and DASH players. The package implements Pathway-based Content Steering. It has the Steering Manifest types, validators, a steering engine, and a function for pathway clones.

## Installation

```bash
npm i @svta/cml-content-steering
```

## Usage

### Steering engine

The engine requests the Steering Manifest, schedules the next request, and selects the pathway that the player applies.

```typescript
import { createSteeringEngine } from '@svta/cml-content-steering'

const manifest = { VERSION: 1, TTL: 300, 'PATHWAY-PRIORITY': ['CDN-B', 'CDN-A'] }

const engine = createSteeringEngine({
	protocol: 'hls',
	uri: 'https://steering.example.com/manifest.json',
	pathways: ['CDN-A', 'CDN-B'],
	pathway: 'CDN-A',
	requester: async (request) => ({ request, status: 200, data: JSON.stringify(manifest) }),
	getThroughput: () => 6000000,
	onPathwayChange: (pathway) => console.log(`apply ${pathway}`),
})

await engine.start() // apply CDN-B

engine.penalize() // apply CDN-A
engine.stop()
```

The example uses a requester that returns a fixed Steering Manifest. Without `requester`, the engine uses `fetch`.

### Pathway clones

`applyUriReplacement` builds a URI of a pathway clone from a URI of its base pathway.

```typescript
import { applyUriReplacement } from '@svta/cml-content-steering'

const replacement = { HOST: 'backup2.example.com', PARAMS: { token: 'dkfs1239414' } }

const uri = applyUriReplacement('https://example.com/some/path/to/file', replacement)

console.log(uri) // https://backup2.example.com/some/path/to/file?token=dkfs1239414
```

### Validation

```typescript
import { isValidPathwayClone, isValidSteeringManifest } from '@svta/cml-content-steering'

const pathwayClone = {
	'BASE-ID': 'pathway1',
	ID: 'clone1',
	'URI-REPLACEMENT': {
		HOST: 'example.com',
		PARAMS: {
			param1: 'value1',
		},
	},
}

const manifest = {
	VERSION: 1,
	TTL: 100,
	'PATHWAY-PRIORITY': ['pathway1', 'clone1'],
	'PATHWAY-CLONES': [pathwayClone],
}

console.log(isValidSteeringManifest(manifest)) // true
console.log(isValidPathwayClone(pathwayClone)) // true
```
````

- [ ] **Step 3: Run the README examples**

Build the package, then run each `typescript` block of the README as a module from the repository root:

```bash
npm run build -w libs/content-steering
T=$(mktemp -d)
node -e "const fs=require('fs');const s=fs.readFileSync('libs/content-steering/README.md','utf8');[...s.matchAll(/\`\`\`typescript\n([\s\S]*?)\`\`\`/g)].forEach((m,i)=>fs.writeFileSync(process.argv[1]+'/readme-'+i+'.mjs',m[1]))" "$T"
for f in "$T"/readme-*.mjs; do node --input-type=module < "$f" || echo "FAIL $f"; done
```

Expected: the first block prints `apply CDN-B`, then `apply CDN-A`. No line starts with `FAIL`.

- [ ] **Step 4: Check that a bare import keeps no code**

```bash
T=$(mktemp -d)
echo "import '$PWD/libs/content-steering/dist/index.js'" > "$T/bare.mjs"
npx rollup "$T/bare.mjs" --format es --file "$T/bare.rollup.js" --silent
npx rolldown "$T/bare.mjs" --format esm --file "$T/bare.rolldown.js"
grep -c -v -E '^\s*$|^export \{\s*\};?$' "$T/bare.rollup.js" "$T/bare.rolldown.js"
```

Expected: `0` for both files.

- [ ] **Step 5: Measure the bundle size**

```bash
T=$(mktemp -d)
echo "import { createSteeringEngine, applyUriReplacement } from '$PWD/libs/content-steering/dist/index.js'; globalThis.x = [createSteeringEngine, applyUriReplacement]" > "$T/engine.mjs"
echo "import { applyUriReplacement } from '$PWD/libs/content-steering/dist/index.js'; globalThis.x = applyUriReplacement" > "$T/apply.mjs"
for e in engine apply; do npx rolldown "$T/$e.mjs" --format esm --file "$T/$e.min.js" --minify > /dev/null; echo "$e $(wc -c < "$T/$e.min.js") bytes, $(gzip -9 -c "$T/$e.min.js" | wc -c) gzip"; done
```

Expected, from the prototype:

| Import | Minified | gzip |
|---|---|---|
| `createSteeringEngine` and `applyUriReplacement` | about 9.1 KB | about 3.8 KB |
| `applyUriReplacement` only | about 1.3 KB | about 0.8 KB |

Error messages are about a quarter of the engine bytes. Put the measured values in the pull request description.

- [ ] **Step 6: Run the full checks**

```bash
npm test
npm run build -w docs
```

Expected: `npm test` runs lint, the build, the typecheck, and the tests of all packages without a failure. The documentation build shows no warning for `content-steering`.

- [ ] **Step 7: Commit**

```bash
git add libs/content-steering
git commit -s -F - <<'EOF'
docs(content-steering): document the steering engine

Refs #61

Co-Authored-By: <agent name> <model> <noreply@anthropic.com>
EOF
```

## Phase 2: Player spikes

Each spike replaces the steering code of one player with the engine of Phase 1, in a local clone of the player. The spike checks the analysis in `integration.md` against real code and records the result. A spike does not need to pass every test of the player. It must explain each failure.

The spikes share these rules:

- Put all clones in one directory outside the CML repository: `SPIKES=${SPIKES:-$HOME/steering-spikes}`.
- Use the commit of the player that `architecture.md` and `integration.md` name. The `file:line` references of the analyses are valid at that commit.
- Install the CML package from a local tarball with `npm install --no-save`. A local tarball keeps the `"*"` peer version, so it installs next to the older `@svta/cml-utils` of the player. The publish script changes `"*"` to an exact version, so the peer finding of `integration.md` applies only to a published release.
- Keep each clone local. Do not push, and do not open issues or pull requests in a player repository.
- Record the result in the "Spike results" table of `integration.md`, and commit only that file to the CML repository.

The spikes need Google Chrome for the Karma test runners. The Shaka spike also needs Python 3 and Java for the Shaka build tools. The VHS spike needs the Node version of its `.nvmrc`.

### Task 4: hls.js spike

**Files (in `$SPIKES/hls.js`):**
- Modify: `src/controller/content-steering-controller.ts`, `tests/unit/controller/content-steering-controller.ts`, `api-extractor.json`
- Create: `karma.steering.conf.js`

**Interfaces:**
- Consumes: the package tarball of Phase 1, and the hls.js section of `integration.md`.
- Produces: the hls.js row of the "Spike results" table.

- [ ] **Step 1: Pack the CML package**

In the CML repository, on this branch:

```bash
SPIKES=${SPIKES:-$HOME/steering-spikes}
mkdir -p "$SPIKES/packs"
npm run build -w libs/utils -w libs/content-steering
npm pack -w libs/content-steering --pack-destination "$SPIKES/packs"
git rev-parse --short HEAD
```

Expected: `svta-cml-content-steering-0.23.1.tgz` in `$SPIKES/packs`. Keep the commit hash for the results table.

- [ ] **Step 2: Clone hls.js and record the baseline**

```bash
git clone https://github.com/video-dev/hls.js.git "$SPIKES/hls.js"
cd "$SPIKES/hls.js"
git switch -c spike/cml-steering c721313f028431b107e4a77edf40bb908f8d782c
npm ci
npm install --no-save "$SPIKES"/packs/svta-cml-content-steering-*.tgz
```

`karma start` does not forward a `--grep` argument to mocha, so create `karma.steering.conf.js`:

```js
const base = require('./karma.conf.js')

module.exports = (config) => {
	base(config)
	config.set({ client: { mocha: { grep: process.env.GREP || 'ContentSteeringController' } } })
}
```

```bash
CI=1 npx karma start karma.steering.conf.js
```

Expected: the steering tests pass before any change. Record the count.

- [ ] **Step 3: Add the requester adapter**

In `content-steering-controller.ts`, add `createLoaderRequester` from the hls.js section of `integration.md`. Add `getResponseHeaders`, which reads `Retry-After` in this order:

1. the XMLHttpRequest, with a regular expression over `getAllResponseHeaders()`, because `XhrLoader.getResponseHeader` returns only numbers
2. the fetch `Response`, with `headers.get('Retry-After')`
3. `loader.getResponseHeader('Retry-After')`, for custom loaders

- [ ] **Step 4: Move the controller to the engine**

- Create the engine in `filterParsedLevels`, with the values of the hls.js section of `integration.md`. Wrap `createSteeringEngine` in `try`/`catch`, and log the `TypeError`.
- `startLoad` calls `engine.start()`. `stopLoad` calls `engine.stop()` and aborts the request in flight. MEDIA_DETACHING calls `stop()`. MEDIA_ATTACHED calls `start()` if the controller is started. MANIFEST_LOADING stops the engine and removes it.
- `onManifest` stores PATHWAY-PRIORITY for the `pathwayPriority` getter, updates the clones, and triggers STEERING_MANIFEST_LOADED. `onPathwayChange` filters the levels by pathway and triggers LEVELS_UPDATED.
- In the ERROR listener, call `engine.penalize(errorPathway)` when an engine exists, and set `errorAction.resolved` when the selection changed.
- Build clone URIs with `applyUriReplacement`, with `stableVariantId` for levels and `stableRenditionId` for renditions. Skip a rendition with an empty URI.
- Remove `loadSteeringManifest`, `scheduleRefresh`, `clearTimeout`, `performUriReplacement`, and the three steering types. Import the types from `@svta/cml-content-steering`.
- The `pathwayPriority` setter calls `engine.setPriority()`, and the getter reads `engine.priority`.

- [ ] **Step 5: Adapt the tests**

- Make the steering test helper async, and advance the fake timers after each response.
- Give tests with `levels: []` a real playlist, because the engine needs a non-empty `pathways`.
- Replace assertions on private fields with assertions on events and requests.
- Update the expected `_HLS_pathway` value to `%22<id>%22`.

- [ ] **Step 6: Run the checks**

```bash
npm run type-check
CI=1 npx karma start karma.steering.conf.js
CI=1 npm run test:unit
npm run build && npm run size:check && npx es-check
```

Expected, from the analysis: `type-check` and `es-check` pass. The unit suite fails only for the documented behavior changes: the quotes in `_HLS_pathway`, the clone checks, and the clone lifetime. The error controller probe for a failover before the first Steering Manifest passes (gap 4), and so does the setter probe (gap 9). `size:check` exceeds the budget of the light build by about 2.4 KB brotli. In `api-extractor.json`, add `@svta/cml-content-steering` to `bundledPackages`, and expect `ae-incompatible-release-tags` for the `@beta` tags.

- [ ] **Step 7: Record the result**

Fill the hls.js row of the "Spike results" table in `integration.md`. Give the CML commit, the test commands, the pass and fail counts, the confirmed gaps, and any new finding. Then commit in the CML repository:

```bash
git add plans/content-steering-engine/integration.md
git commit -s -F - <<'EOF'
docs: record the hls.js content steering spike

Co-Authored-By: <agent name> <model> <noreply@anthropic.com>
EOF
```

### Task 5: dash.js spike

**Files (in `$SPIKES/dash.js`):**
- Create: `src/dash/utils/ContentSteeringRequester.js`
- Modify: `src/dash/controllers/ContentSteeringController.js`, `src/streaming/utils/baseUrlResolution/ContentSteeringSelector.js`, `src/streaming/net/HTTPLoader.js`, `src/streaming/models/BaseURLTreeModel.js`, `test/unit/mocks/ContentSteeringControllerMock.js`, `index.d.ts`, `test/unit/test/dash/dash.controllers.ContentSteeringController.js`

**Interfaces:**
- Consumes: the package tarball of Phase 1, and the dash.js section of `integration.md`.
- Produces: the dash.js row of the "Spike results" table.

- [ ] **Step 1: Pack the CML package**

In the CML repository, on this branch:

```bash
SPIKES=${SPIKES:-$HOME/steering-spikes}
mkdir -p "$SPIKES/packs"
npm run build -w libs/utils -w libs/content-steering
npm pack -w libs/content-steering --pack-destination "$SPIKES/packs"
git rev-parse --short HEAD
```

Expected: `svta-cml-content-steering-0.23.1.tgz` in `$SPIKES/packs`.

- [ ] **Step 2: Clone dash.js and record the baseline**

```bash
git clone https://github.com/Dash-Industry-Forum/dash.js.git "$SPIKES/dash.js"
cd "$SPIKES/dash.js"
git switch -c spike/cml-steering acddd0cfee4189d4249026937117eb8c80be619a
npm ci
npm install --no-save "$SPIKES"/packs/svta-cml-content-steering-*.tgz
npx karma start test/unit/config/karma.unit.conf.cjs --grep="ContentSteeringController" --browsers ChromeHeadless
```

Expected: the 32 controller tests pass before any change.

- [ ] **Step 3: Add the requester adapter**

Create `src/dash/utils/ContentSteeringRequester.js` as a FactoryMaker class with `load(httpRequest)`, `getLastRequestUrl()`, and `abort()`. Take `load` from the dash.js section of `integration.md`. Create the `URLLoader` in `setup()` with `errHandler`, `dashMetrics`, `mediaPlayerModel`, and `Errors`. `abort()` calls `urlLoader.abort()`, not `urlLoader.reset()`, because `reset()` empties the SchemeLoaderFactory of the player.

- [ ] **Step 4: Move the controller to the engine**

- `loadSteeringData()` creates the engine on its first call, with the values of the dash.js section of `integration.md`, and returns `engine.start()`. Pass the default service location as `pathway`, and `@queryBeforeStart` as `queryBeforeStart`. `stopSteeringRequestTimer()` calls `engine.stop()`.
- Keep the service location tracking of the controller, and pass it as `getReportedPathways`.
- `triggerSteeringRequest()` calls `engine.start()`. It now sends a request only when one is due. Record this behavior change.
- `onManifest` builds the `ContentSteeringResponse`, stores the clones, and triggers CONTENT_STEERING_REQUEST_COMPLETED. `onPathwayChange` logs. `onError` logs, and after a 429 stores `retryDelay / 1000` as the TTL for BlacklistController.
- SERVICE_LOCATION_BASE_URL_BLACKLIST_ADD calls `engine.penalize(entry)` for a known pathway.
- Add `getPathwayPriority()`, which returns `engine.priority`. ContentSteeringSelector uses it instead of `getCurrentSteeringResponseData().pathwayPriority`.
- Rewrite `getSynthesizedBaseUrlElements` and `getSynthesizedLocationElements` with `applyUriReplacement` for `HOST`. Keep `PARAMS` in `queryParams`. In HTTPLoader, `_addPathwayCloningParameters` calls `applyUriReplacement(request.url, { PARAMS: request.queryParams })`.
- MANIFEST_UPDATED calls `engine.update()` with the resolved steering URI and the service locations.
- Remove `_getSteeringServerUrl`, `_handleSteeringResponse`, `_isValidPathwayClone`, `_startSteeringRequestTimer`, `_handleSteeringResponseError`, and `QUERY_PARAMETER_KEYS`.

- [ ] **Step 5: Adapt the tests**

- Use the number `1` for VERSION in the fixtures of tests 190, 282, 426, 488, 550, and 618 (the line numbers of the test file).
- Give the clone fixtures a HOST without a scheme.
- Set `queryBeforeStart: false` in tests 550 and 618, because the engine omits the parameters on a first request with `@queryBeforeStart`.
- Add `getPathwayPriority() { return []; }` to `ContentSteeringControllerMock`, and add `getPathwayPriority` to `index.d.ts`.

- [ ] **Step 6: Run the checks**

```bash
npx karma start test/unit/config/karma.unit.conf.cjs --grep="ContentSteeringController" --browsers ChromeHeadless
for g in BaseURL BlacklistController LocationSelector HTTPLoader ManifestUpdater; do npx karma start test/unit/config/karma.unit.conf.cjs --grep="$g" --browsers ChromeHeadless || break; done
npm run lint && npx tsc
npm test
```

Expected, from the analysis: the adapted controller tests pass, and the neighbor tests pass. RFC v2 resolves gaps 2, 10, and 11. The RFC rejects gap 12, so record each place where the spike needs a forced request.

- [ ] **Step 7: Check a real stream**

```bash
npm start
```

Open `/samples/advanced/content-steering.html` with a stream that has `@queryBeforeStart`, a short TTL, and a default service location. Check three things: the first request has no `_DASH_` parameters, later requests have `_DASH_pathway=%22<id>%22`, and the service locations of audio and video follow PATHWAY-PRIORITY.

- [ ] **Step 8: Record the result**

Fill the dash.js row of the "Spike results" table in `integration.md`, and commit:

```bash
git add plans/content-steering-engine/integration.md
git commit -s -F - <<'EOF'
docs: record the dash.js content steering spike

Co-Authored-By: <agent name> <model> <noreply@anthropic.com>
EOF
```

### Task 6: Shaka Player spike

**Files (in `$SPIKES/shaka-player`):**
- Create: `lib/util/content_steering_requester.js`, `externs/cml_content_steering.js`
- Modify: `lib/util/content_steering_manager.js`, `lib/dash/dash_parser.js`, `lib/hls/hls_parser.js`, `karma.conf.js`, `test/util/content_steering_manager_unit.js`

**Interfaces:**
- Consumes: an IIFE build of the Phase 1 package, and the Shaka section of `integration.md`.
- Produces: the Shaka Player row of the "Spike results" table.

This spike uses the plugin path: the engine is an external global, like the LCEVC library. The product path is a hand port under `third_party/`, which is out of scope for the spike.

- [ ] **Step 1: Build an IIFE of the engine**

In the CML repository, on this branch:

```bash
SPIKES=${SPIKES:-$HOME/steering-spikes}
CML=$(pwd)
npm run build -w libs/utils -w libs/content-steering
git rev-parse --short HEAD
```

- [ ] **Step 2: Clone Shaka Player and record the baseline**

```bash
git clone https://github.com/shaka-project/shaka-player.git "$SPIKES/shaka-player"
cd "$SPIKES/shaka-player"
git switch -c spike/cml-steering 91ca4dbd95a82ff3b352110a173756d414e5d8cb
npm ci
mkdir -p third_party/cml-content-steering
npx rolldown "$CML/libs/content-steering/dist/index.js" -f iife -n cmlContentSteering -m -o third_party/cml-content-steering/iife.js
python3 build/test.py --uncompiled --quick --filter ContentSteering --browsers Chrome
```

The Shaka build tools are Python scripts of the Shaka repository. Expected: the steering tests pass before any change. Record the count.

- [ ] **Step 3: Declare the external global**

Create `externs/cml_content_steering.js`. It declares `var cmlContentSteering` with `createSteeringEngine` and `applyUriReplacement`. It also declares each property that Shaka and the engine exchange:

- the configuration keys and the engine members
- the fields of the request and the response
- the fields of the Steering Manifest and the clones

Add `third_party/cml-content-steering/iife.js` to the `files` of `karma.conf.js`, next to the LCEVC entry.

- [ ] **Step 4: Add the requester adapter**

Create `lib/util/content_steering_requester.js` with the `request()` method of the Shaka section of `integration.md`. The class owns a `shaka.util.OperationManager`. `destroy()` aborts the operations in flight.

- [ ] **Step 5: Move the manager to the engine**

- `start(protocol, uri, pathways, defaultPathways)` creates the engine with `penalty: 60000`, which keeps the current Shaka penalty, and returns `engine.start()`.
- `onManifest` stores the clones.
- `getLocations(streamId)` builds the failover list from `engine.priority`.
- `banLocation(uri)` finds the pathway by URI prefix and calls `engine.penalize(id)`.
- Resolve clone URIs with `applyUriReplacement`, and record STABLE-VARIANT-ID and STABLE-RENDITION-ID in the HLS parser.
- In the DASH parser, collect `@serviceLocation` from `Location` and every BaseURL before `parsePeriods_`, and wait for `start()` when `@queryBeforeStart` is true. In the HLS parser, collect the pathways from the `EXT-X-STREAM-INF` tags, with `.` for a tag without PATHWAY-ID.
- In the adapter, set `maxAttempts: 1`, so NetworkingEngine does not send a 410 or 429 twice.

- [ ] **Step 6: Run the checks**

```bash
python3 build/gendeps.py
python3 build/test.py --uncompiled --quick --no-build --filter ContentSteering --browsers Chrome
python3 build/build.py
python3 build/test.py --quick --no-build --filter ContentSteering --browsers Chrome
```

Expected, from the analysis: the uncompiled tests pass after the test updates for the behavior changes. The compiled run fails for each property without an extern. Record those properties, because a port must use bracket access for them.

- [ ] **Step 7: Record the result**

Fill the Shaka Player row of the "Spike results" table in `integration.md`, and commit:

```bash
git add plans/content-steering-engine/integration.md
git commit -s -F - <<'EOF'
docs: record the Shaka Player content steering spike

Co-Authored-By: <agent name> <model> <noreply@anthropic.com>
EOF
```

### Task 7: VHS spike

**Files (in `$SPIKES/http-streaming`):**
- Create: `src/content-steering-requester.js`
- Modify: `src/playlist-controller.js`, `src/playlist-loader.js`, `scripts/rollup.config.js`, `scripts/karma.conf.js`, `test/content-steering-controller.test.js`, `test/playlist-controller.test.js`, `test/playlist-loader.test.js`
- Delete: `src/content-steering-controller.js`

**Interfaces:**
- Consumes: the package tarballs of Phase 1, and the VHS section of `integration.md`.
- Produces: the VHS row of the "Spike results" table.

- [ ] **Step 1: Pack the CML packages**

In the CML repository, on this branch:

```bash
SPIKES=${SPIKES:-$HOME/steering-spikes}
mkdir -p "$SPIKES/packs"
npm run build -w libs/utils -w libs/content-steering
npm pack -w libs/utils -w libs/content-steering --pack-destination "$SPIKES/packs"
git rev-parse --short HEAD
```

VHS has no `@svta/cml-utils`, so the spike installs both tarballs.

- [ ] **Step 2: Clone VHS and record the baseline**

```bash
git clone https://github.com/videojs/http-streaming.git "$SPIKES/http-streaming"
cd "$SPIKES/http-streaming"
git switch -c spike/cml-steering a9f9d7ac0264b373f14da1bb2f2e7fe8f2775c4f
nvm use
npm ci
npm install --no-save "$SPIKES"/packs/svta-cml-utils-*.tgz "$SPIKES"/packs/svta-cml-content-steering-*.tgz
```

The VHS Karma setup has no filter option. In `scripts/karma.conf.js`, after `generate()`, add this line:

```js
config.client.qunit.filter = process.env.QUNIT_FILTER
```

```bash
CI_TEST_TYPE=unit npm run build-test
QUNIT_FILTER='/steering|pathway cloning/i' npx karma start scripts/karma.conf.js --browsers ChromeHeadless
```

Expected: the steering tests pass before any change. Record the count.

- [ ] **Step 3: Configure the build**

In `scripts/rollup.config.js`:

- In the `babel(defaults)` hook, set `defaults.exclude = [/node_modules\/(?!@svta\/)/]`, so Babel transpiles the CML code for Chrome 53.
- Do not add `@svta/cml-content-steering` to the external modules, so the CommonJS build inlines it.

- [ ] **Step 4: Add the requester adapter**

Create `src/content-steering-requester.js` with `createSteeringRequester` from the VHS section of `integration.md`.

- [ ] **Step 5: Move PlaylistController to the engine**

- Replace `initContentSteeringController_` with `initSteeringEngine_`. Call it in the first `loadedplaylist` event, after `excludeUnsupportedVariants_()`, with the values of the VHS section of `integration.md`. Wrap `createSteeringEngine` in `try`/`catch`.
- Start the engine on `canplay`, or at once with `queryBeforeStart`. Apply the configured pathway once with `excludeThenChangePathway_`.
- `onPathwayChange` calls `excludeThenChangePathway_(pathway)`.
- `acceptClone` returns `false` for every DASH clone, and for an HLS clone without a playable variant.
- `onManifest` triggers `contentsteeringparsed`, updates the HLS clones, and applies the current selection again.
- In `excludePlaylist`, call `penalize()` for the last rendition of a pathway.
- In `playlist-loader.js`, `createCloneURI_` calls `applyUriReplacement` with `stableVariantId` for absolute URIs. A clone update becomes a delete, then `addClonePathway`.
- A DASH `loadedplaylist` calls `engine.update()` when the steering tag or the set of pathways changes.
- Delete `src/content-steering-controller.js`.

- [ ] **Step 6: Adapt the tests**

- Replace `test/content-steering-controller.test.js` with tests of the adapter and of the PlaylistController wiring.
- Rewrite the steering tests of `test/playlist-controller.test.js`. Add an await after each `respond()`, because the engine processes responses in promise callbacks.
- In `test/playlist-loader.test.js`, update the clone update tests.

- [ ] **Step 7: Run the checks**

```bash
CI_TEST_TYPE=unit npm run build-test
QUNIT_FILTER='/steering|pathway cloning/i' npx karma start scripts/karma.conf.js --browsers ChromeHeadless
CI_TEST_TYPE=unit npm test
npm run build-prod && grep -nE '\?\?|\?\.[A-Za-z_$]' dist/videojs-http-streaming.js | head
```

Expected, from the analysis: the rewritten tests pass. The `grep` finds no `??` and no `?.` in the production build. If it finds some, the Babel `exclude` of Step 3 did not work. Check that `dist/videojs-http-streaming.es.js` inlines the CML code.

- [ ] **Step 8: Record the result**

Fill the VHS row of the "Spike results" table in `integration.md`, and commit:

```bash
git add plans/content-steering-engine/integration.md
git commit -s -F - <<'EOF'
docs: record the VHS content steering spike

Co-Authored-By: <agent name> <model> <noreply@anthropic.com>
EOF
```

## Phase 3: Feedback to the RFC

### Task 8: Report the findings of the spikes

**Files:**
- Modify: `plans/content-steering-engine/integration.md`
- Modify after approval, on the `rfc/content-steering-engine` branch: `rfc/content-steering-engine.md`

**Interfaces:**
- Consumes: the spike results of Tasks 4 to 7 in `integration.md`.
- Produces: a list of new RFC changes for the maintainer, and after approval, revision v3 of the RFC.

RFC v2 already applies the decisions on the 19 gaps of `integration.md`. This task reports only what the spikes find beyond them.

- [ ] **Step 1: Check the spike results**

Tasks 4 to 7 fill the "Spike results" table of `integration.md`. Check that each row is complete. If a spike result contradicts the analysis, add a sentence to the section of that player that names the difference.

- [ ] **Step 2: Write the list of new findings**

For each new finding, give the RFC section, the proposed change, the players that need it, and the evidence from the spike. Put the findings that block a player first. List a finding that concerns all of CML, not only this package, separately.

- [ ] **Step 3: Send the list to the maintainer**

Send the list to the maintainer and wait for a decision on each row. Do not change the RFC, and do not comment on PR #471, before the decision.

- [ ] **Step 4: Apply the approved changes**

```bash
git switch rfc/content-steering-engine
git pull --ff-only
```

Edit `rfc/content-steering-engine.md` for each approved row. Add revision v3 to the revision history, with one sentence for each change. Then check the prose and commit:

```bash
bash plans/writing-style-compliance/check.sh origin/main rfc/content-steering-engine.md
git add rfc/content-steering-engine.md
git commit -s -F - <<'EOT'
docs(rfc): apply the findings of the player spikes

Co-Authored-By: <agent name> <model> <noreply@anthropic.com>
EOT
git push origin rfc/content-steering-engine
```

Expected: `check.sh` reports `PASS` for `chars`, `length`, and `abbrev`.

- [ ] **Step 5: Merge the RFC branch into this branch**

```bash
git switch feat/content-steering-engine-impl
git merge --no-edit --signoff rfc/content-steering-engine
```

Expected: the merge completes. If `integration.md` conflicts, keep the version with the spike results.
