# Content Steering Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a three-layer content steering engine (pure functions, stateful processor, I/O engine) to the `@svta/cml-content-steering` package.

**Architecture:** Layer 1 (pure functions) implements atomic spec operations with zero side effects. Layer 2 (`SteeringProcessor`) composes them into the spec's 7-step algorithm with state management. Layer 3 (`SteeringEngine`) adds I/O via injected fetch/schedule callbacks. Each layer builds on the previous and is independently usable.

**Tech Stack:** TypeScript (strict, `isolatedDeclarations`, `verbatimModuleSyntax`), Node.js built-in `node:test` runner with `node:assert`, `tsdown` bundler, `api-extractor` for API reports.

**Package:** `@svta/cml-content-steering` at `libs/content-steering/`

**Build/test commands:**
- Build: `npm run build -w libs/content-steering`
- Test: `npm test -w libs/content-steering`
- Typecheck: `npm run typecheck`

**Conventions observed from existing code:**
- Imports use `.ts` extensions (`import type { Foo } from './Foo.ts'`)
- Tests import from the package name (`import { foo } from '@svta/cml-content-steering'`)
- Use `type` not `interface` for type definitions
- All exports have TSDoc with `@beta` tag (existing) or `@public` tag (per code-quality rules)
- Constants are `UPPER_SNAKE_CASE`
- Functions are verbs, types are nouns
- One logical unit per file, `export type *` for type-only files in barrel
- Test data lives in `test/` as named constants (e.g., `MANIFEST.ts`, `PATHWAY_CLONE.ts`)
- Tests use `describe`/`it` from `node:test`, `equal`/`deepEqual`/`assert` from `node:assert`
- Example regions marked with `// #region example` and `// #endregion example`
- No tabs — the existing code uses tabs for indentation
- Actually: existing code DOES use tabs. Match that.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/UriReplacement.ts` | Modify | Add index signature for CDP extensions |
| `src/SteeringResponse.ts` | Create | Type for engine I/O response |
| `src/SteeringError.ts` | Create | Type for error notifications |
| `src/SteeringResponseResult.ts` | Create | Discriminated union from `parseSteeringResponse` |
| `src/ProcessResult.ts` | Create | Discriminated union from `SteeringProcessor.processResponse` |
| `src/PathwayCloneResult.ts` | Create | Result from `applyPathwayCloning` |
| `src/CdpDescriptor.ts` | Create | CDP configuration type |
| `src/SteeringProcessorConfig.ts` | Create | Processor configuration type |
| `src/SteeringEngineConfig.ts` | Create | Engine configuration type |
| `src/selectPathway.ts` | Create | Pure function: spec Step 5 |
| `src/applyPathwayCloning.ts` | Create | Pure function: spec Section 5 |
| `src/applyUriReplacement.ts` | Create | Pure function: URI replacement algorithm |
| `src/buildSteeringUrl.ts` | Create | Pure function: URL builder |
| `src/parseSteeringResponse.ts` | Create | Pure function: HTTP response parser |
| `src/SteeringProcessor.ts` | Create | Layer 2: stateful processor |
| `src/SteeringEngine.ts` | Create | Layer 3: I/O engine |
| `src/HLS_CDP.ts` | Create | Built-in HLS CDP descriptor |
| `src/DASH_CDP.ts` | Create | Built-in DASH CDP descriptor |
| `src/index.ts` | Modify | Add new exports to barrel |
| `test/MANIFESTS.ts` | Create | Shared test manifests |
| `test/STEERING_RESPONSE.ts` | Create | Shared test response helpers |
| `test/selectPathway.test.ts` | Create | Tests for selectPathway |
| `test/applyUriReplacement.test.ts` | Create | Tests for applyUriReplacement |
| `test/applyPathwayCloning.test.ts` | Create | Tests for applyPathwayCloning |
| `test/buildSteeringUrl.test.ts` | Create | Tests for buildSteeringUrl |
| `test/parseSteeringResponse.test.ts` | Create | Tests for parseSteeringResponse |
| `test/SteeringProcessor.test.ts` | Create | Tests for SteeringProcessor |
| `test/SteeringEngine.test.ts` | Create | Tests for SteeringEngine |

---

### Task 1: Extend UriReplacement with index signature

**Files:**
- Modify: `libs/content-steering/src/UriReplacement.ts`

- [ ] **Step 1: Modify UriReplacement to accept CDP extensions**

Open `libs/content-steering/src/UriReplacement.ts`. Add an index signature so CDP-specific keys (like HLS's `PER-VARIANT-URIS`) are accepted:

```typescript
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
	 * CDP-specific extension fields (e.g., HLS PER-VARIANT-URIS).
	 */
	[cdpExtension: string]: unknown;
};
```

- [ ] **Step 2: Build to verify no type errors**

Run: `npm run build -w libs/content-steering`
Expected: Build succeeds. The index signature is compatible with all existing usage since `HOST` and `PARAMS` are explicitly typed.

- [ ] **Step 3: Run existing tests to confirm no regressions**

Run: `npm test -w libs/content-steering`
Expected: All 12 tests pass.

- [ ] **Step 4: Commit**

```bash
git add libs/content-steering/src/UriReplacement.ts
git commit -s -m "feat(content-steering): add index signature to UriReplacement for CDP extensions"
```

---

### Task 2: Create new type definitions

**Files:**
- Create: `libs/content-steering/src/SteeringResponse.ts`
- Create: `libs/content-steering/src/SteeringError.ts`
- Create: `libs/content-steering/src/SteeringResponseResult.ts`
- Create: `libs/content-steering/src/ProcessResult.ts`
- Create: `libs/content-steering/src/PathwayCloneResult.ts`
- Create: `libs/content-steering/src/CdpDescriptor.ts`
- Create: `libs/content-steering/src/SteeringProcessorConfig.ts`
- Create: `libs/content-steering/src/SteeringEngineConfig.ts`

- [ ] **Step 1: Create SteeringResponse.ts**

```typescript
/**
 * The response from a content steering server request.
 *
 * @beta
 */
export type SteeringResponse = {
	/**
	 * The HTTP status code.
	 */
	readonly status: number;

	/**
	 * The response body as a string.
	 */
	readonly body: string;

	/**
	 * The response headers. Must support `get(name)` lookup.
	 */
	readonly headers: { get(name: string): string | null };
};
```

- [ ] **Step 2: Create SteeringError.ts**

```typescript
/**
 * An error from the content steering engine.
 *
 * @beta
 */
export type SteeringError = {
	/**
	 * The HTTP status code, if the error originated from an HTTP response.
	 */
	readonly status?: number;

	/**
	 * A description of the error.
	 */
	readonly message: string;
};
```

- [ ] **Step 3: Create SteeringResponseResult.ts**

```typescript
import type { SteeringManifest } from './SteeringManifest.ts'

/**
 * The parsed result of a content steering server response.
 *
 * @beta
 */
export type SteeringResponseResult =
	| { readonly type: 'success'; readonly manifest: SteeringManifest }
	| { readonly type: 'gone' }
	| { readonly type: 'throttled'; readonly retryAfter: number | null }
	| { readonly type: 'error'; readonly status: number }
	| { readonly type: 'invalid' };
```

- [ ] **Step 4: Create ProcessResult.ts**

```typescript
/**
 * The result of processing a steering server response through the processor.
 *
 * @beta
 */
export type ProcessResult =
	| { readonly type: 'success'; readonly pathwayChanged: boolean; readonly preferredPathway: string | undefined }
	| { readonly type: 'gone' }
	| { readonly type: 'throttled'; readonly retryAfter: number }
	| { readonly type: 'error'; readonly status: number };
```

- [ ] **Step 5: Create PathwayCloneResult.ts**

```typescript
import type { UriReplacement } from './UriReplacement.ts'

/**
 * The result of applying pathway cloning to a single clone definition.
 *
 * @beta
 */
export type PathwayCloneResult = {
	/**
	 * The Pathway ID for the clone.
	 */
	readonly id: string;

	/**
	 * The Pathway ID of the base pathway.
	 */
	readonly baseId: string;

	/**
	 * The URI replacement to apply for this clone.
	 */
	readonly uriReplacement: UriReplacement;
};
```

- [ ] **Step 6: Create CdpDescriptor.ts**

```typescript
/**
 * Describes CDP-specific behavior for the content steering engine.
 *
 * @beta
 */
export type CdpDescriptor = {
	/**
	 * The CDP format name used as a prefix for query parameters
	 * (e.g., 'HLS' produces `_HLS_pathway`).
	 */
	readonly formatName: string;

	/**
	 * Formats a throughput value for the steering server query parameter.
	 * Defaults to `String(value)` if not provided.
	 */
	readonly formatThroughput?: (value: number) => string;

	/**
	 * Formats a pathway value for the steering server query parameter.
	 * Defaults to `String(value)` if not provided.
	 */
	readonly formatPathway?: (value: string | string[]) => string;

	/**
	 * CDP-specific URI-REPLACEMENT extension keys
	 * (e.g., `['PER-VARIANT-URIS', 'PER-RENDITION-URIS']` for HLS).
	 */
	readonly uriReplacementExtensions?: readonly string[];
};
```

- [ ] **Step 7: Create SteeringProcessorConfig.ts**

```typescript
/**
 * Configuration for the steering processor.
 *
 * @beta
 */
export type SteeringProcessorConfig = {
	/**
	 * The penalty duration in milliseconds for penalized pathways.
	 * Defaults to {@link DEFAULT_PATHWAY_PENALTY} (300000ms).
	 */
	readonly penalty?: number;

	/**
	 * Whether to validate steering manifests using {@link isValidSteeringManifest}.
	 * Defaults to `true`.
	 */
	readonly validate?: boolean;
};
```

- [ ] **Step 8: Create SteeringEngineConfig.ts**

```typescript
import type { CdpDescriptor } from './CdpDescriptor.ts'
import type { SteeringError } from './SteeringError.ts'
import type { SteeringManifest } from './SteeringManifest.ts'
import type { SteeringResponse } from './SteeringResponse.ts'

/**
 * Configuration for the steering engine.
 *
 * @beta
 */
export type SteeringEngineConfig = {
	/**
	 * Fetches the steering manifest from the given URL.
	 * The signal is used to abort the request when the engine stops.
	 */
	readonly fetch: (url: string, signal: AbortSignal) => Promise<SteeringResponse>;

	/**
	 * Schedules a function to run after a delay in milliseconds.
	 * Returns a function that cancels the scheduled execution.
	 */
	readonly schedule: (fn: () => void, ms: number) => () => void;

	/**
	 * Returns the current throughput estimate, or `null` if unavailable.
	 */
	readonly getThroughput: () => number | null;

	/**
	 * Returns the currently active pathway ID(s), or `null` if unavailable.
	 */
	readonly getCurrentPathway: () => string | string[] | null;

	/**
	 * The CDP descriptor for protocol-specific behavior.
	 */
	readonly cdp: CdpDescriptor;

	/**
	 * Called when the preferred pathway changes.
	 */
	readonly onPathwayChange?: (pathway: string) => void;

	/**
	 * Called when a steering manifest is successfully loaded.
	 */
	readonly onManifestLoaded?: (manifest: SteeringManifest) => void;

	/**
	 * Called when a steering request fails.
	 */
	readonly onError?: (error: SteeringError) => void;

	/**
	 * Called when steering is permanently stopped (e.g., HTTP 410).
	 */
	readonly onStopped?: () => void;

	/**
	 * The penalty duration in milliseconds for penalized pathways.
	 * Defaults to {@link DEFAULT_PATHWAY_PENALTY} (300000ms).
	 */
	readonly penalty?: number;

	/**
	 * Whether to validate steering manifests using {@link isValidSteeringManifest}.
	 * Defaults to `true`.
	 */
	readonly validate?: boolean;
};
```

- [ ] **Step 9: Build to verify types compile**

Run: `npm run build -w libs/content-steering`
Expected: Build succeeds (types are not yet exported, but the compiler checks them via barrel imports in later tasks).

Actually — these files aren't imported yet. Just run `npm run typecheck` to verify the individual files have no syntax errors:

Run: `npx tsc --noEmit -p libs/content-steering/tsconfig.json`
Expected: No errors (unused files are fine since `include` covers all of `src/`).

- [ ] **Step 10: Commit**

```bash
git add libs/content-steering/src/SteeringResponse.ts libs/content-steering/src/SteeringError.ts libs/content-steering/src/SteeringResponseResult.ts libs/content-steering/src/ProcessResult.ts libs/content-steering/src/PathwayCloneResult.ts libs/content-steering/src/CdpDescriptor.ts libs/content-steering/src/SteeringProcessorConfig.ts libs/content-steering/src/SteeringEngineConfig.ts
git commit -s -m "feat(content-steering): add type definitions for steering engine"
```

---

### Task 3: Implement and test `selectPathway`

**Files:**
- Create: `libs/content-steering/src/selectPathway.ts`
- Create: `libs/content-steering/test/selectPathway.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
import { selectPathway } from '@svta/cml-content-steering'
import { deepEqual, equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('selectPathway', () => {
	it('provides a valid example', () => {
		// #region example
		const priority = ['CDN-A', 'CDN-B', 'CDN-C']
		const penalized = new Set<string>()

		const pathway = selectPathway(priority, penalized)

		equal(pathway, 'CDN-A')
		// #endregion example
	})

	it('returns the first pathway when none are penalized', () => {
		equal(selectPathway(['a', 'b', 'c'], new Set()), 'a')
	})

	it('skips penalized pathways and returns the first non-penalized', () => {
		equal(selectPathway(['a', 'b', 'c'], new Set(['a'])), 'b')
	})

	it('returns undefined when all pathways are penalized', () => {
		equal(selectPathway(['a', 'b'], new Set(['a', 'b'])), undefined)
	})

	it('returns undefined for an empty priority array', () => {
		equal(selectPathway([], new Set()), undefined)
	})

	it('ignores penalized IDs not in the priority list', () => {
		equal(selectPathway(['a', 'b'], new Set(['x', 'y'])), 'a')
	})
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w libs/content-steering`
Expected: FAIL — `selectPathway` is not exported from `@svta/cml-content-steering`.

- [ ] **Step 3: Write the implementation**

Create `libs/content-steering/src/selectPathway.ts`:

```typescript
/**
 * Returns the first non-penalized pathway from the priority list.
 *
 * Implements Content Steering spec Step 5 (Content Steering Evaluation).
 *
 * @param priority - Pathway IDs ordered by preference (first = most preferred).
 * @param penalized - Set of pathway IDs currently penalized.
 * @returns The first non-penalized pathway ID, or `undefined` if none available.
 *
 * @example
 * {@includeCode ../test/selectPathway.test.ts#example}
 *
 * @beta
 */
export function selectPathway(priority: string[], penalized: Set<string>): string | undefined {
	for (const id of priority) {
		if (!penalized.has(id)) {
			return id
		}
	}
	return undefined
}
```

- [ ] **Step 4: Add export to index.ts**

Add this line to `libs/content-steering/src/index.ts` in the exports section:

```typescript
export * from './selectPathway.ts'
```

- [ ] **Step 5: Build and run tests**

Run: `npm run build -w libs/content-steering && npm test -w libs/content-steering`
Expected: All tests pass including the 6 new `selectPathway` tests.

- [ ] **Step 6: Commit**

```bash
git add libs/content-steering/src/selectPathway.ts libs/content-steering/test/selectPathway.test.ts libs/content-steering/src/index.ts
git commit -s -m "feat(content-steering): add selectPathway pure function"
```

---

### Task 4: Implement and test `applyUriReplacement`

**Files:**
- Create: `libs/content-steering/src/applyUriReplacement.ts`
- Create: `libs/content-steering/test/applyUriReplacement.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
import { applyUriReplacement } from '@svta/cml-content-steering'
import type { UriReplacement } from '@svta/cml-content-steering'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('applyUriReplacement', () => {
	it('provides a valid example', () => {
		// #region example
		const replacement: UriReplacement = {
			HOST: 'cdn2.example.com',
			PARAMS: { token: 'abc123' },
		}

		const result = applyUriReplacement('https://cdn1.example.com/video/seg1.ts', replacement)

		equal(result, 'https://cdn2.example.com/video/seg1.ts?token=abc123')
		// #endregion example
	})

	it('replaces the hostname when HOST is provided', () => {
		const result = applyUriReplacement(
			'https://old.example.com/path/file.ts',
			{ HOST: 'new.example.com' },
		)
		equal(result, 'https://new.example.com/path/file.ts')
	})

	it('appends PARAMS sorted by key', () => {
		const result = applyUriReplacement(
			'https://cdn.example.com/seg.ts',
			{ PARAMS: { z: '1', a: '2' } },
		)
		equal(result, 'https://cdn.example.com/seg.ts?a=2&z=1')
	})

	it('replaces existing query parameter with same name from PARAMS', () => {
		const result = applyUriReplacement(
			'https://cdn.example.com/seg.ts?token=old',
			{ PARAMS: { token: 'new' } },
		)
		equal(result, 'https://cdn.example.com/seg.ts?token=new')
	})

	it('applies HOST and PARAMS together', () => {
		const result = applyUriReplacement(
			'https://old.example.com/seg.ts',
			{ HOST: 'new.example.com', PARAMS: { key: 'val' } },
		)
		equal(result, 'https://new.example.com/seg.ts?key=val')
	})

	it('uses PER-VARIANT-URIS override when stableId matches', () => {
		const replacement: UriReplacement = {
			HOST: 'fallback.example.com',
			'PER-VARIANT-URIS': { 'tier6': 'https://special.example.com/tier6.m3u8' },
		}
		const result = applyUriReplacement(
			'https://cdn.example.com/tier6.m3u8',
			replacement,
			'tier6',
		)
		equal(result, 'https://special.example.com/tier6.m3u8')
	})

	it('uses PER-RENDITION-URIS override when stableId matches', () => {
		const replacement: UriReplacement = {
			HOST: 'fallback.example.com',
			'PER-RENDITION-URIS': { 'audio_en': 'https://special.example.com/audio_en.m3u8' },
		}
		const result = applyUriReplacement(
			'https://cdn.example.com/audio.m3u8',
			replacement,
			'audio_en',
		)
		equal(result, 'https://special.example.com/audio_en.m3u8')
	})

	it('falls back to HOST when stableId does not match any extension', () => {
		const replacement: UriReplacement = {
			HOST: 'fallback.example.com',
			'PER-VARIANT-URIS': { 'tier10': 'https://special.example.com/tier10.m3u8' },
		}
		const result = applyUriReplacement(
			'https://cdn.example.com/tier6.m3u8',
			replacement,
			'tier6',
		)
		equal(result, 'https://fallback.example.com/tier6.m3u8')
	})

	it('preserves path, hash, and credentials', () => {
		const result = applyUriReplacement(
			'https://user:pass@old.example.com/a/b/c.ts#frag',
			{ HOST: 'new.example.com' },
		)
		equal(result, 'https://user:pass@new.example.com/a/b/c.ts#frag')
	})

	it('returns the original URI when replacement has no HOST or PARAMS', () => {
		const result = applyUriReplacement(
			'https://cdn.example.com/seg.ts',
			{},
		)
		equal(result, 'https://cdn.example.com/seg.ts')
	})

	it('percent-encodes reserved characters in PARAMS values', () => {
		const result = applyUriReplacement(
			'https://cdn.example.com/seg.ts',
			{ PARAMS: { 'q': 'hello world' } },
		)
		equal(result, 'https://cdn.example.com/seg.ts?q=hello+world')
	})
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w libs/content-steering`
Expected: FAIL — `applyUriReplacement` is not exported.

- [ ] **Step 3: Write the implementation**

Create `libs/content-steering/src/applyUriReplacement.ts`:

```typescript
import type { UriReplacement } from './UriReplacement.ts'

/**
 * Applies URI replacement rules to a URI per the Content Steering spec Section 5.
 *
 * If a CDP-extension key (e.g., `PER-VARIANT-URIS`) contains a match for `stableId`,
 * that URI is used directly. Otherwise, HOST replaces the hostname and PARAMS are
 * appended sorted by UTF-8 key order, replacing existing params of the same name.
 *
 * @param uri - The original URI to transform.
 * @param replacement - The URI-REPLACEMENT object from a pathway clone.
 * @param stableId - Optional stable variant/rendition ID for CDP-extension lookups.
 * @returns The transformed URI string.
 *
 * @example
 * {@includeCode ../test/applyUriReplacement.test.ts#example}
 *
 * @beta
 */
export function applyUriReplacement(uri: string, replacement: UriReplacement, stableId?: string): string {
	// Check CDP-extension keys (e.g., PER-VARIANT-URIS, PER-RENDITION-URIS)
	if (stableId !== undefined) {
		for (const key in replacement) {
			if (key === 'HOST' || key === 'PARAMS') {
				continue
			}
			const map = replacement[key]
			if (typeof map === 'object' && map !== null && stableId in map) {
				return (map as Record<string, string>)[stableId]
			}
		}
	}

	const url = new URL(uri)

	if (replacement.HOST) {
		url.hostname = replacement.HOST
	}

	if (replacement.PARAMS) {
		const keys = Object.keys(replacement.PARAMS).sort()
		for (const key of keys) {
			url.searchParams.set(key, replacement.PARAMS[key])
		}
	}

	return url.toString()
}
```

- [ ] **Step 4: Add export to index.ts**

Add to `libs/content-steering/src/index.ts`:

```typescript
export * from './applyUriReplacement.ts'
```

- [ ] **Step 5: Build and run tests**

Run: `npm run build -w libs/content-steering && npm test -w libs/content-steering`
Expected: All tests pass including the new `applyUriReplacement` tests.

- [ ] **Step 6: Commit**

```bash
git add libs/content-steering/src/applyUriReplacement.ts libs/content-steering/test/applyUriReplacement.test.ts libs/content-steering/src/index.ts
git commit -s -m "feat(content-steering): add applyUriReplacement pure function"
```

---

### Task 5: Implement and test `applyPathwayCloning`

**Files:**
- Create: `libs/content-steering/src/applyPathwayCloning.ts`
- Create: `libs/content-steering/test/applyPathwayCloning.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
import { applyPathwayCloning } from '@svta/cml-content-steering'
import type { PathwayClone, PathwayCloneResult } from '@svta/cml-content-steering'
import { deepEqual, equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('applyPathwayCloning', () => {
	it('provides a valid example', () => {
		// #region example
		const clones: PathwayClone[] = [{
			'BASE-ID': 'CDN-A',
			'ID': 'CDN-B',
			'URI-REPLACEMENT': { HOST: 'cdn-b.example.com' },
		}]

		const pathways = new Map([['CDN-A', { id: 'CDN-A' }]])
		const results = applyPathwayCloning(clones, (id) => pathways.get(id))

		equal(results.length, 1)
		equal(results[0].id, 'CDN-B')
		equal(results[0].baseId, 'CDN-A')
		// #endregion example
	})

	it('clones a pathway with HOST replacement', () => {
		const clones: PathwayClone[] = [{
			'BASE-ID': 'A',
			'ID': 'B',
			'URI-REPLACEMENT': { HOST: 'b.example.com' },
		}]
		const pathways = new Map([['A', {}]])
		const results = applyPathwayCloning(clones, (id) => pathways.get(id))

		equal(results.length, 1)
		deepEqual(results[0], {
			id: 'B',
			baseId: 'A',
			uriReplacement: { HOST: 'b.example.com' },
		})
	})

	it('clones a pathway with PARAMS', () => {
		const clones: PathwayClone[] = [{
			'BASE-ID': 'A',
			'ID': 'B',
			'URI-REPLACEMENT': { PARAMS: { token: 'xyz' } },
		}]
		const pathways = new Map([['A', {}]])
		const results = applyPathwayCloning(clones, (id) => pathways.get(id))

		equal(results.length, 1)
		deepEqual(results[0].uriReplacement, { PARAMS: { token: 'xyz' } })
	})

	it('supports chained clones where clone B references clone A', () => {
		const clones: PathwayClone[] = [
			{
				'BASE-ID': 'original',
				'ID': 'clone-A',
				'URI-REPLACEMENT': { HOST: 'a.example.com' },
			},
			{
				'BASE-ID': 'clone-A',
				'ID': 'clone-B',
				'URI-REPLACEMENT': { HOST: 'b.example.com' },
			},
		]
		const pathways = new Map([['original', {}]])
		const results = applyPathwayCloning(clones, (id) => pathways.get(id))

		equal(results.length, 2)
		equal(results[0].id, 'clone-A')
		equal(results[1].id, 'clone-B')
		equal(results[1].baseId, 'clone-A')
	})

	it('skips a clone with an unresolvable BASE-ID', () => {
		const clones: PathwayClone[] = [{
			'BASE-ID': 'nonexistent',
			'ID': 'B',
			'URI-REPLACEMENT': { HOST: 'b.example.com' },
		}]
		const results = applyPathwayCloning(clones, () => undefined)

		equal(results.length, 0)
	})

	it('skips a clone with a duplicate ID', () => {
		const clones: PathwayClone[] = [
			{
				'BASE-ID': 'A',
				'ID': 'B',
				'URI-REPLACEMENT': { HOST: 'b1.example.com' },
			},
			{
				'BASE-ID': 'A',
				'ID': 'B',
				'URI-REPLACEMENT': { HOST: 'b2.example.com' },
			},
		]
		const pathways = new Map([['A', {}]])
		const results = applyPathwayCloning(clones, (id) => pathways.get(id))

		equal(results.length, 1)
		equal(results[0].uriReplacement.HOST, 'b1.example.com')
	})

	it('returns an empty array for an empty clones array', () => {
		const results = applyPathwayCloning([], () => undefined)
		deepEqual(results, [])
	})
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w libs/content-steering`
Expected: FAIL — `applyPathwayCloning` not exported.

- [ ] **Step 3: Write the implementation**

Create `libs/content-steering/src/applyPathwayCloning.ts`:

```typescript
import type { PathwayClone } from './PathwayClone.ts'
import type { PathwayCloneResult } from './PathwayCloneResult.ts'

/**
 * Applies pathway cloning per the Content Steering spec Section 5.
 *
 * Resolves BASE-ID references via the `getPathway` lookup. Supports chained
 * clones where a later clone references an earlier clone as its BASE-ID.
 * Skips clones with unresolvable BASE-ID or duplicate ID.
 *
 * @param clones - The PATHWAY-CLONES array from the steering manifest.
 * @param getPathway - Lookup function returning the pathway object for a given ID, or `undefined`.
 * @returns An array of successfully resolved pathway clone results.
 *
 * @example
 * {@includeCode ../test/applyPathwayCloning.test.ts#example}
 *
 * @beta
 */
export function applyPathwayCloning(clones: PathwayClone[], getPathway: (id: string) => object | undefined): PathwayCloneResult[] {
	const results: PathwayCloneResult[] = []
	const resolved = new Map<string, PathwayCloneResult>()

	for (const clone of clones) {
		const id = clone['ID']
		const baseId = clone['BASE-ID']

		// Skip duplicates
		if (resolved.has(id)) {
			continue
		}

		// Check original pathways first, then earlier clones
		const base = getPathway(baseId) ?? resolved.get(baseId)
		if (base === undefined) {
			continue
		}

		const result: PathwayCloneResult = {
			id,
			baseId,
			uriReplacement: clone['URI-REPLACEMENT'],
		}

		results.push(result)
		resolved.set(id, result)
	}

	return results
}
```

- [ ] **Step 4: Add exports to index.ts**

Add to `libs/content-steering/src/index.ts`:

```typescript
export * from './applyPathwayCloning.ts'
export type * from './PathwayCloneResult.ts'
```

- [ ] **Step 5: Build and run tests**

Run: `npm run build -w libs/content-steering && npm test -w libs/content-steering`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add libs/content-steering/src/applyPathwayCloning.ts libs/content-steering/src/PathwayCloneResult.ts libs/content-steering/test/applyPathwayCloning.test.ts libs/content-steering/src/index.ts
git commit -s -m "feat(content-steering): add applyPathwayCloning pure function"
```

---

### Task 6: Implement and test `buildSteeringUrl`

**Files:**
- Create: `libs/content-steering/src/buildSteeringUrl.ts`
- Create: `libs/content-steering/test/buildSteeringUrl.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
import { buildSteeringUrl } from '@svta/cml-content-steering'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('buildSteeringUrl', () => {
	it('provides a valid example', () => {
		// #region example
		const url = buildSteeringUrl('https://steering.example.com/manifest.json', {
			_HLS_pathway: 'CDN-A',
			_HLS_throughput: '5000000',
		})

		equal(url, 'https://steering.example.com/manifest.json?_HLS_pathway=CDN-A&_HLS_throughput=5000000')
		// #endregion example
	})

	it('appends query params to a clean URL', () => {
		const url = buildSteeringUrl('https://example.com/steer', { a: '1' })
		equal(url, 'https://example.com/steer?a=1')
	})

	it('appends with & when URL already has query params', () => {
		const url = buildSteeringUrl('https://example.com/steer?existing=yes', { a: '1' })
		equal(url, 'https://example.com/steer?existing=yes&a=1')
	})

	it('returns the URL unchanged when params is empty', () => {
		const url = buildSteeringUrl('https://example.com/steer', {})
		equal(url, 'https://example.com/steer')
	})

	it('encodes reserved characters in param values', () => {
		const url = buildSteeringUrl('https://example.com/steer', { q: 'a b&c' })
		equal(url, 'https://example.com/steer?q=a+b%26c')
	})

	it('handles multiple params', () => {
		const url = buildSteeringUrl('https://example.com/steer', {
			_DASH_pathway: 'CDN-A',
			_DASH_throughput: '5000',
		})
		equal(url, 'https://example.com/steer?_DASH_pathway=CDN-A&_DASH_throughput=5000')
	})
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w libs/content-steering`
Expected: FAIL — `buildSteeringUrl` not exported.

- [ ] **Step 3: Write the implementation**

Create `libs/content-steering/src/buildSteeringUrl.ts`:

```typescript
/**
 * Builds a content steering server request URL with query parameters.
 *
 * Appends parameters to the base URL, preserving any existing query parameters.
 *
 * @param baseUrl - The steering server URL.
 * @param params - Query parameters to append (e.g., `_HLS_pathway`, `_HLS_throughput`).
 * @returns The complete URL string with query parameters.
 *
 * @example
 * {@includeCode ../test/buildSteeringUrl.test.ts#example}
 *
 * @beta
 */
export function buildSteeringUrl(baseUrl: string, params: Record<string, string>): string {
	const url = new URL(baseUrl)

	for (const key in params) {
		url.searchParams.set(key, params[key])
	}

	return url.toString()
}
```

- [ ] **Step 4: Add export to index.ts**

Add to `libs/content-steering/src/index.ts`:

```typescript
export * from './buildSteeringUrl.ts'
```

- [ ] **Step 5: Build and run tests**

Run: `npm run build -w libs/content-steering && npm test -w libs/content-steering`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add libs/content-steering/src/buildSteeringUrl.ts libs/content-steering/test/buildSteeringUrl.test.ts libs/content-steering/src/index.ts
git commit -s -m "feat(content-steering): add buildSteeringUrl pure function"
```

---

### Task 7: Implement and test `parseSteeringResponse`

**Files:**
- Create: `libs/content-steering/src/parseSteeringResponse.ts`
- Create: `libs/content-steering/test/STEERING_RESPONSE.ts`
- Create: `libs/content-steering/test/parseSteeringResponse.test.ts`

- [ ] **Step 1: Create test helper for steering responses**

Create `libs/content-steering/test/STEERING_RESPONSE.ts`:

```typescript
import type { SteeringResponse } from '@svta/cml-content-steering'

export function createResponse(status: number, body: string, headers?: Record<string, string>): SteeringResponse {
	const headerMap = new Map(Object.entries(headers ?? {}))
	return {
		status,
		body,
		headers: { get: (name: string) => headerMap.get(name) ?? null },
	}
}
```

- [ ] **Step 2: Write the test file**

Create `libs/content-steering/test/parseSteeringResponse.test.ts`:

```typescript
import { parseSteeringResponse } from '@svta/cml-content-steering'
import { deepEqual, equal } from 'node:assert'
import { describe, it } from 'node:test'
import { createResponse } from './STEERING_RESPONSE.ts'

describe('parseSteeringResponse', () => {
	it('provides a valid example', () => {
		// #region example
		const response = createResponse(200, JSON.stringify({
			VERSION: 1,
			TTL: 300,
			'PATHWAY-PRIORITY': ['CDN-A', 'CDN-B'],
		}))

		const result = parseSteeringResponse(response.status, response.body, response.headers)

		equal(result.type, 'success')
		// #endregion example
	})

	it('parses a 200 with valid manifest as success', () => {
		const manifest = { VERSION: 1, TTL: 100, 'PATHWAY-PRIORITY': ['a'] }
		const response = createResponse(200, JSON.stringify(manifest))
		const result = parseSteeringResponse(response.status, response.body, response.headers)

		equal(result.type, 'success')
		if (result.type === 'success') {
			deepEqual(result.manifest, manifest)
		}
	})

	it('parses a 200 with RELOAD-URI and PATHWAY-CLONES', () => {
		const manifest = {
			VERSION: 1,
			TTL: 60,
			'RELOAD-URI': 'https://example.com/new',
			'PATHWAY-PRIORITY': ['a'],
			'PATHWAY-CLONES': [{
				'BASE-ID': 'a',
				'ID': 'b',
				'URI-REPLACEMENT': { HOST: 'b.example.com' },
			}],
		}
		const response = createResponse(200, JSON.stringify(manifest))
		const result = parseSteeringResponse(response.status, response.body, response.headers)

		equal(result.type, 'success')
		if (result.type === 'success') {
			equal(result.manifest['RELOAD-URI'], 'https://example.com/new')
		}
	})

	it('returns invalid for a 200 with unparseable JSON', () => {
		const response = createResponse(200, 'not json')
		const result = parseSteeringResponse(response.status, response.body, response.headers)

		equal(result.type, 'invalid')
	})

	it('returns invalid for a 200 with wrong VERSION', () => {
		const response = createResponse(200, JSON.stringify({
			VERSION: 2, TTL: 100, 'PATHWAY-PRIORITY': ['a'],
		}))
		const result = parseSteeringResponse(response.status, response.body, response.headers)

		equal(result.type, 'invalid')
	})

	it('returns gone for HTTP 410', () => {
		const response = createResponse(410, '')
		const result = parseSteeringResponse(response.status, response.body, response.headers)

		equal(result.type, 'gone')
	})

	it('returns throttled for HTTP 429 with Retry-After', () => {
		const response = createResponse(429, '', { 'Retry-After': '120' })
		const result = parseSteeringResponse(response.status, response.body, response.headers)

		equal(result.type, 'throttled')
		if (result.type === 'throttled') {
			equal(result.retryAfter, 120)
		}
	})

	it('returns throttled for HTTP 429 without Retry-After', () => {
		const response = createResponse(429, '')
		const result = parseSteeringResponse(response.status, response.body, response.headers)

		equal(result.type, 'throttled')
		if (result.type === 'throttled') {
			equal(result.retryAfter, null)
		}
	})

	it('returns error with status for HTTP 404', () => {
		const response = createResponse(404, '')
		const result = parseSteeringResponse(response.status, response.body, response.headers)

		equal(result.type, 'error')
		if (result.type === 'error') {
			equal(result.status, 404)
		}
	})

	it('returns error with status for HTTP 500', () => {
		const response = createResponse(500, '')
		const result = parseSteeringResponse(response.status, response.body, response.headers)

		equal(result.type, 'error')
		if (result.type === 'error') {
			equal(result.status, 500)
		}
	})

	it('preserves unrecognized keys in the manifest', () => {
		const manifest = {
			VERSION: 1,
			TTL: 100,
			'PATHWAY-PRIORITY': ['a'],
			'X-CUSTOM': 'value',
		}
		const response = createResponse(200, JSON.stringify(manifest))
		const result = parseSteeringResponse(response.status, response.body, response.headers)

		equal(result.type, 'success')
		if (result.type === 'success') {
			equal((result.manifest as Record<string, unknown>)['X-CUSTOM'], 'value')
		}
	})
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -w libs/content-steering`
Expected: FAIL — `parseSteeringResponse` not exported.

- [ ] **Step 4: Write the implementation**

Create `libs/content-steering/src/parseSteeringResponse.ts`:

```typescript
import type { SteeringManifest } from './SteeringManifest.ts'
import type { SteeringResponseResult } from './SteeringResponseResult.ts'

/**
 * Parses an HTTP response from a content steering server into a discriminated result.
 *
 * Implements the HTTP status code handling from Content Steering spec Step 7:
 * - 200: Parse JSON, validate VERSION === 1
 * - 410: Gone — steering should be disabled
 * - 429: Too Many Requests — extract Retry-After header
 * - Other: Error with status code
 *
 * @param status - The HTTP status code.
 * @param body - The response body as a string.
 * @param headers - The response headers.
 * @returns A discriminated result describing the response.
 *
 * @example
 * {@includeCode ../test/parseSteeringResponse.test.ts#example}
 *
 * @beta
 */
export function parseSteeringResponse(status: number, body: string, headers: { get(name: string): string | null }): SteeringResponseResult {
	if (status === 410) {
		return { type: 'gone' }
	}

	if (status === 429) {
		const retryAfter = headers.get('Retry-After')
		return {
			type: 'throttled',
			retryAfter: retryAfter !== null ? Number(retryAfter) : null,
		}
	}

	if (status < 200 || status >= 300) {
		return { type: 'error', status }
	}

	let manifest: SteeringManifest
	try {
		manifest = JSON.parse(body) as SteeringManifest
	}
	catch {
		return { type: 'invalid' }
	}

	if (manifest.VERSION !== 1) {
		return { type: 'invalid' }
	}

	return { type: 'success', manifest }
}
```

- [ ] **Step 5: Add exports to index.ts**

Add to `libs/content-steering/src/index.ts`:

```typescript
export * from './parseSteeringResponse.ts'
export type * from './SteeringResponseResult.ts'
export type * from './SteeringResponse.ts'
export type * from './SteeringError.ts'
```

- [ ] **Step 6: Build and run tests**

Run: `npm run build -w libs/content-steering && npm test -w libs/content-steering`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add libs/content-steering/src/parseSteeringResponse.ts libs/content-steering/src/SteeringResponseResult.ts libs/content-steering/src/SteeringResponse.ts libs/content-steering/src/SteeringError.ts libs/content-steering/test/parseSteeringResponse.test.ts libs/content-steering/test/STEERING_RESPONSE.ts libs/content-steering/src/index.ts
git commit -s -m "feat(content-steering): add parseSteeringResponse pure function"
```

---

### Task 8: Implement and test `SteeringProcessor`

**Files:**
- Create: `libs/content-steering/src/SteeringProcessor.ts`
- Create: `libs/content-steering/test/MANIFESTS.ts`
- Create: `libs/content-steering/test/SteeringProcessor.test.ts`

- [ ] **Step 1: Create shared test manifest data**

Create `libs/content-steering/test/MANIFESTS.ts`:

```typescript
import type { SteeringManifest } from '@svta/cml-content-steering'

export const BASIC_MANIFEST: SteeringManifest = {
	VERSION: 1,
	TTL: 300,
	'PATHWAY-PRIORITY': ['CDN-A', 'CDN-B', 'CDN-C'],
}

export const MANIFEST_WITH_RELOAD: SteeringManifest = {
	VERSION: 1,
	TTL: 60,
	'RELOAD-URI': 'https://steering.example.com/v2',
	'PATHWAY-PRIORITY': ['CDN-B', 'CDN-A'],
}

export const MANIFEST_WITH_CLONES: SteeringManifest = {
	VERSION: 1,
	TTL: 120,
	'PATHWAY-PRIORITY': ['CDN-A', 'CDN-B', 'CDN-C'],
	'PATHWAY-CLONES': [{
		'BASE-ID': 'CDN-A',
		'ID': 'CDN-C',
		'URI-REPLACEMENT': { HOST: 'cdn-c.example.com' },
	}],
}
```

- [ ] **Step 2: Write the test file**

Create `libs/content-steering/test/SteeringProcessor.test.ts`:

```typescript
import { SteeringProcessor } from '@svta/cml-content-steering'
import { deepEqual, equal } from 'node:assert'
import { describe, it } from 'node:test'
import { BASIC_MANIFEST, MANIFEST_WITH_CLONES, MANIFEST_WITH_RELOAD } from './MANIFESTS.ts'
import { createResponse } from './STEERING_RESPONSE.ts'

function headers(map?: Record<string, string>): { get(name: string): string | null } {
	const m = new Map(Object.entries(map ?? {}))
	return { get: (name: string) => m.get(name) ?? null }
}

describe('SteeringProcessor', () => {
	it('provides a valid example', () => {
		// #region example
		const processor = new SteeringProcessor()
		const body = JSON.stringify(BASIC_MANIFEST)

		const result = processor.processResponse(200, body, headers(), 1000)

		equal(result.type, 'success')
		equal(processor.getPreferredPathway(1000), 'CDN-A')
		// #endregion example
	})

	describe('processResponse', () => {
		it('updates priority, ttl, and lastUpdated on success', () => {
			const processor = new SteeringProcessor()
			const result = processor.processResponse(200, JSON.stringify(BASIC_MANIFEST), headers(), 5000)

			equal(result.type, 'success')
			equal(processor.getPreferredPathway(5000), 'CDN-A')

			const reload = processor.shouldReload(5000)
			equal(reload.reload, false)
			equal(reload.delay, 300000)
		})

		it('registers clones from PATHWAY-CLONES', () => {
			const processor = new SteeringProcessor({ validate: false })
			processor.processResponse(200, JSON.stringify(MANIFEST_WITH_CLONES), headers(), 1000)

			const clone = processor.getClone('CDN-C')
			equal(clone?.id, 'CDN-C')
			equal(clone?.baseId, 'CDN-A')
			equal(clone?.uriReplacement.HOST, 'cdn-c.example.com')
		})

		it('updates reloadUrl from RELOAD-URI', () => {
			const processor = new SteeringProcessor({ validate: false })
			processor.processResponse(200, JSON.stringify(MANIFEST_WITH_RELOAD), headers(), 1000)

			equal(processor.getReloadUrl(), 'https://steering.example.com/v2')
		})

		it('detects pathway change on success', () => {
			const processor = new SteeringProcessor({ validate: false })

			const r1 = processor.processResponse(200, JSON.stringify(BASIC_MANIFEST), headers(), 1000)
			equal(r1.type, 'success')
			if (r1.type === 'success') {
				equal(r1.pathwayChanged, true)
				equal(r1.preferredPathway, 'CDN-A')
			}

			const r2 = processor.processResponse(200, JSON.stringify(BASIC_MANIFEST), headers(), 2000)
			if (r2.type === 'success') {
				equal(r2.pathwayChanged, false)
			}
		})

		it('rejects invalid manifest when validation is enabled', () => {
			const processor = new SteeringProcessor({ validate: true })
			const invalid = { VERSION: 1, TTL: 0, 'PATHWAY-PRIORITY': ['a'] }
			const result = processor.processResponse(200, JSON.stringify(invalid), headers(), 1000)

			equal(result.type, 'error')
		})

		it('sets enabled to false on HTTP 410', () => {
			const processor = new SteeringProcessor()
			const result = processor.processResponse(410, '', headers(), 1000)

			equal(result.type, 'gone')
			equal(processor.shouldReload(1000).reload, false)
		})

		it('updates TTL from Retry-After on HTTP 429', () => {
			const processor = new SteeringProcessor()
			// First load a manifest to establish state
			processor.processResponse(200, JSON.stringify(BASIC_MANIFEST), headers(), 1000)

			const result = processor.processResponse(429, '', headers({ 'Retry-After': '60' }), 2000)

			equal(result.type, 'throttled')
			if (result.type === 'throttled') {
				equal(result.retryAfter, 60)
			}
		})

		it('leaves state unchanged on error', () => {
			const processor = new SteeringProcessor()
			processor.processResponse(200, JSON.stringify(BASIC_MANIFEST), headers(), 1000)

			processor.processResponse(500, '', headers(), 2000)

			equal(processor.getPreferredPathway(2000), 'CDN-A')
		})
	})

	describe('getPreferredPathway', () => {
		it('returns the first priority pathway', () => {
			const processor = new SteeringProcessor()
			processor.processResponse(200, JSON.stringify(BASIC_MANIFEST), headers(), 1000)

			equal(processor.getPreferredPathway(1000), 'CDN-A')
		})

		it('prunes expired penalties', () => {
			const processor = new SteeringProcessor({ penalty: 100 })
			processor.processResponse(200, JSON.stringify(BASIC_MANIFEST), headers(), 1000)
			processor.penalize('CDN-A', 1000)

			equal(processor.getPreferredPathway(1050), 'CDN-B')
			equal(processor.getPreferredPathway(1200), 'CDN-A')
		})

		it('returns undefined when all pathways are penalized', () => {
			const processor = new SteeringProcessor({ penalty: 100 })
			processor.processResponse(200, JSON.stringify(BASIC_MANIFEST), headers(), 1000)
			processor.penalize('CDN-A', 1000)
			processor.penalize('CDN-B', 1000)
			processor.penalize('CDN-C', 1000)

			equal(processor.getPreferredPathway(1050), undefined)
		})
	})

	describe('penalize', () => {
		it('adds pathway to penalized set and returns new preferred', () => {
			const processor = new SteeringProcessor()
			processor.processResponse(200, JSON.stringify(BASIC_MANIFEST), headers(), 1000)

			const newPreferred = processor.penalize('CDN-A', 1000)
			equal(newPreferred, 'CDN-B')
		})

		it('returns undefined when penalizing makes all pathways unavailable', () => {
			const processor = new SteeringProcessor()
			const manifest = { VERSION: 1, TTL: 100, 'PATHWAY-PRIORITY': ['A'] }
			processor.processResponse(200, JSON.stringify(manifest), headers(), 1000)

			const newPreferred = processor.penalize('A', 1000)
			equal(newPreferred, undefined)
		})

		it('is a no-op for unknown pathway IDs', () => {
			const processor = new SteeringProcessor()
			processor.processResponse(200, JSON.stringify(BASIC_MANIFEST), headers(), 1000)

			processor.penalize('nonexistent', 1000)
			equal(processor.getPreferredPathway(1000), 'CDN-A')
		})
	})

	describe('shouldReload', () => {
		it('returns reload true after TTL has elapsed', () => {
			const processor = new SteeringProcessor()
			processor.processResponse(200, JSON.stringify(BASIC_MANIFEST), headers(), 1000)

			const result = processor.shouldReload(301001)
			equal(result.reload, true)
		})

		it('returns reload false before TTL has elapsed', () => {
			const processor = new SteeringProcessor()
			processor.processResponse(200, JSON.stringify(BASIC_MANIFEST), headers(), 1000)

			const result = processor.shouldReload(100000)
			equal(result.reload, false)
			equal(result.delay, 201000)
		})

		it('returns reload false when disabled', () => {
			const processor = new SteeringProcessor()
			processor.processResponse(410, '', headers(), 1000)

			const result = processor.shouldReload(999999)
			equal(result.reload, false)
		})
	})

	describe('reset', () => {
		it('clears all state to initial defaults', () => {
			const processor = new SteeringProcessor()
			processor.processResponse(200, JSON.stringify(BASIC_MANIFEST), headers(), 1000)
			processor.penalize('CDN-A', 1000)

			processor.reset()

			equal(processor.getPreferredPathway(2000), undefined)
			equal(processor.getReloadUrl(), null)
			equal(processor.getClone('CDN-C'), undefined)
		})
	})
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -w libs/content-steering`
Expected: FAIL — `SteeringProcessor` not exported.

- [ ] **Step 4: Write the implementation**

Create `libs/content-steering/src/SteeringProcessor.ts`:

```typescript
import { DEFAULT_PATHWAY_PENALTY } from './DEFAULT_PATHWAY_PENALTY.ts'
import { DEFAULT_TTL } from './DEFAULT_TTL.ts'
import { applyPathwayCloning } from './applyPathwayCloning.ts'
import { isValidSteeringManifest } from './isValidSteeringManifest.ts'
import { parseSteeringResponse } from './parseSteeringResponse.ts'
import { selectPathway } from './selectPathway.ts'
import type { PathwayCloneResult } from './PathwayCloneResult.ts'
import type { ProcessResult } from './ProcessResult.ts'
import type { SteeringManifest } from './SteeringManifest.ts'
import type { SteeringProcessorConfig } from './SteeringProcessorConfig.ts'

/**
 * Manages content steering state and implements the spec's 7-step client algorithm.
 *
 * Composes pure functions into a stateful processor. Does not perform any I/O
 * or timer scheduling — the caller owns the fetch loop and passes responses
 * through {@link SteeringProcessor.processResponse}.
 *
 * @example
 * {@includeCode ../test/SteeringProcessor.test.ts#example}
 *
 * @beta
 */
export class SteeringProcessor {
	private pathwayPriority: string[] = []
	private penalized: Map<string, number> = new Map()
	private clones: Map<string, PathwayCloneResult> = new Map()
	private ttl: number = DEFAULT_TTL
	private reloadUri: string | null = null
	private enabled: boolean = true
	private lastUpdated: number = 0
	private lastManifest: SteeringManifest | null = null
	private readonly penalty: number
	private readonly validate: boolean
	private previousPreferred: string | undefined = undefined

	constructor(config?: SteeringProcessorConfig) {
		this.penalty = config?.penalty ?? DEFAULT_PATHWAY_PENALTY
		this.validate = config?.validate ?? true
	}

	/**
	 * Processes a steering server HTTP response and updates internal state.
	 *
	 * @param status - The HTTP status code.
	 * @param body - The response body.
	 * @param headers - The response headers.
	 * @param now - Current timestamp in milliseconds. Defaults to `performance.now()`.
	 */
	processResponse(status: number, body: string, headers: { get(name: string): string | null }, now?: number): ProcessResult {
		const timestamp = now ?? performance.now()
		const result = parseSteeringResponse(status, body, headers)

		switch (result.type) {
			case 'success': {
				const { manifest } = result

				if (this.validate && !isValidSteeringManifest(manifest)) {
					return { type: 'error', status: 200 }
				}

				this.lastManifest = manifest
				this.pathwayPriority = manifest['PATHWAY-PRIORITY']
				this.ttl = manifest.TTL
				this.lastUpdated = timestamp

				if (manifest['RELOAD-URI'] !== undefined) {
					this.reloadUri = manifest['RELOAD-URI']
				}

				if (manifest['PATHWAY-CLONES']) {
					const cloneResults = applyPathwayCloning(
						manifest['PATHWAY-CLONES'],
						(id) => this.clones.get(id),
					)
					for (const clone of cloneResults) {
						this.clones.set(clone.id, clone)
					}
				}

				const preferred = this.getPreferredPathway(timestamp)
				const pathwayChanged = preferred !== this.previousPreferred
				this.previousPreferred = preferred

				return { type: 'success', pathwayChanged, preferredPathway: preferred }
			}

			case 'gone': {
				this.enabled = false
				return { type: 'gone' }
			}

			case 'throttled': {
				const retryAfter = result.retryAfter ?? this.ttl
				if (result.retryAfter !== null) {
					this.ttl = result.retryAfter
				}
				return { type: 'throttled', retryAfter }
			}

			case 'invalid':
				return { type: 'error', status: 200 }

			case 'error':
				return { type: 'error', status: result.status }
		}
	}

	/**
	 * Returns the highest-priority non-penalized pathway.
	 *
	 * @param now - Current timestamp in milliseconds. Defaults to `performance.now()`.
	 */
	getPreferredPathway(now?: number): string | undefined {
		const timestamp = now ?? performance.now()

		for (const [id, expiry] of this.penalized.entries()) {
			if (timestamp >= expiry) {
				this.penalized.delete(id)
			}
		}

		return selectPathway(this.pathwayPriority, new Set(this.penalized.keys()))
	}

	/**
	 * Penalizes a pathway and returns the new preferred pathway.
	 *
	 * @param pathwayId - The pathway ID to penalize.
	 * @param now - Current timestamp in milliseconds. Defaults to `performance.now()`.
	 */
	penalize(pathwayId: string, now?: number): string | undefined {
		const timestamp = now ?? performance.now()
		this.penalized.set(pathwayId, timestamp + this.penalty)
		const preferred = this.getPreferredPathway(timestamp)
		this.previousPreferred = preferred
		return preferred
	}

	/**
	 * Returns whether the steering manifest should be reloaded.
	 *
	 * @param now - Current timestamp in milliseconds. Defaults to `performance.now()`.
	 */
	shouldReload(now?: number): { reload: boolean; url: string | null; delay: number } {
		if (!this.enabled) {
			return { reload: false, url: null, delay: 0 }
		}

		const timestamp = now ?? performance.now()
		const nextReload = this.lastUpdated + (this.ttl * 1000)
		const delay = Math.max(0, nextReload - timestamp)

		return {
			reload: delay <= 0,
			url: this.reloadUri,
			delay,
		}
	}

	/**
	 * Returns the current RELOAD-URI, or `null`.
	 */
	getReloadUrl(): string | null {
		return this.reloadUri
	}

	/**
	 * Returns a pathway clone by ID, or `undefined`.
	 */
	getClone(id: string): PathwayCloneResult | undefined {
		return this.clones.get(id)
	}

	/**
	 * Returns the current TTL in seconds.
	 */
	getTtl(): number {
		return this.ttl
	}

	/**
	 * Returns the last successfully processed steering manifest, or `null`.
	 */
	getManifest(): SteeringManifest | null {
		return this.lastManifest
	}

	/**
	 * Resets all state to initial defaults.
	 */
	reset(): void {
		this.pathwayPriority = []
		this.penalized.clear()
		this.clones.clear()
		this.ttl = DEFAULT_TTL
		this.reloadUri = null
		this.enabled = true
		this.lastUpdated = 0
		this.lastManifest = null
		this.previousPreferred = undefined
	}
}
```

- [ ] **Step 5: Add exports to index.ts**

Add to `libs/content-steering/src/index.ts`:

```typescript
export * from './SteeringProcessor.ts'
export type * from './ProcessResult.ts'
export type * from './SteeringProcessorConfig.ts'
```

- [ ] **Step 6: Build and run tests**

Run: `npm run build -w libs/content-steering && npm test -w libs/content-steering`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add libs/content-steering/src/SteeringProcessor.ts libs/content-steering/src/ProcessResult.ts libs/content-steering/src/SteeringProcessorConfig.ts libs/content-steering/test/MANIFESTS.ts libs/content-steering/test/SteeringProcessor.test.ts libs/content-steering/src/index.ts
git commit -s -m "feat(content-steering): add SteeringProcessor class"
```

---

### Task 9: Implement and test CDP descriptors

**Files:**
- Create: `libs/content-steering/src/HLS_CDP.ts`
- Create: `libs/content-steering/src/DASH_CDP.ts`

- [ ] **Step 1: Create HLS_CDP.ts**

```typescript
import type { CdpDescriptor } from './CdpDescriptor.ts'

/**
 * CDP descriptor for HLS content steering.
 *
 * Produces query parameters `_HLS_pathway` and `_HLS_throughput`.
 * Supports `PER-VARIANT-URIS` and `PER-RENDITION-URIS` URI-REPLACEMENT extensions.
 *
 * @beta
 */
export const HLS_CDP: CdpDescriptor = {
	formatName: 'HLS',
	uriReplacementExtensions: ['PER-VARIANT-URIS', 'PER-RENDITION-URIS'],
}
```

- [ ] **Step 2: Create DASH_CDP.ts**

```typescript
import type { CdpDescriptor } from './CdpDescriptor.ts'

/**
 * CDP descriptor for DASH content steering.
 *
 * Produces query parameters `_DASH_pathway` and `_DASH_throughput`.
 * Formats pathway as comma-separated values for multi-pathway reporting.
 * Formats throughput in kbps (DASH convention).
 *
 * @beta
 */
export const DASH_CDP: CdpDescriptor = {
	formatName: 'DASH',
	formatPathway: (v: string | string[]): string => Array.isArray(v) ? v.join(',') : v,
	formatThroughput: (v: number): string => String(Math.round(v / 1000)),
}
```

- [ ] **Step 3: Add exports to index.ts**

Add to `libs/content-steering/src/index.ts`:

```typescript
export * from './HLS_CDP.ts'
export * from './DASH_CDP.ts'
export type * from './CdpDescriptor.ts'
```

- [ ] **Step 4: Build and run tests**

Run: `npm run build -w libs/content-steering && npm test -w libs/content-steering`
Expected: All existing tests pass. CDP descriptors are tested via SteeringEngine in Task 10.

- [ ] **Step 5: Commit**

```bash
git add libs/content-steering/src/HLS_CDP.ts libs/content-steering/src/DASH_CDP.ts libs/content-steering/src/CdpDescriptor.ts libs/content-steering/src/index.ts
git commit -s -m "feat(content-steering): add HLS_CDP and DASH_CDP descriptors"
```

---

### Task 10: Implement and test `SteeringEngine`

**Files:**
- Create: `libs/content-steering/src/SteeringEngine.ts`
- Create: `libs/content-steering/test/SteeringEngine.test.ts`

- [ ] **Step 1: Write the test file**

Create `libs/content-steering/test/SteeringEngine.test.ts`:

```typescript
import { SteeringEngine, HLS_CDP, DASH_CDP } from '@svta/cml-content-steering'
import type { SteeringEngineConfig, SteeringManifest, SteeringResponse } from '@svta/cml-content-steering'
import { deepEqual, equal } from 'node:assert'
import { describe, it } from 'node:test'
import { BASIC_MANIFEST, MANIFEST_WITH_RELOAD } from './MANIFESTS.ts'

type Timer = { fn: () => void; ms: number; cancelled: boolean }

function createTestHarness(manifest?: SteeringManifest) {
	const fetches: { url: string; signal: AbortSignal }[] = []
	const timers: Timer[] = []
	const events: { type: string; data?: unknown }[] = []
	let throughput: number | null = null
	let currentPathway: string | string[] | null = null
	let fetchResponse: SteeringResponse = {
		status: 200,
		body: JSON.stringify(manifest ?? BASIC_MANIFEST),
		headers: { get: () => null },
	}

	const config: SteeringEngineConfig = {
		fetch: async (url, signal) => {
			fetches.push({ url, signal })
			return fetchResponse
		},
		schedule: (fn, ms) => {
			const timer: Timer = { fn, ms, cancelled: false }
			timers.push(timer)
			return () => { timer.cancelled = true }
		},
		getThroughput: () => throughput,
		getCurrentPathway: () => currentPathway,
		cdp: HLS_CDP,
		onPathwayChange: (pathway) => events.push({ type: 'pathwayChange', data: pathway }),
		onManifestLoaded: (m) => events.push({ type: 'manifestLoaded', data: m }),
		onError: (err) => events.push({ type: 'error', data: err }),
		onStopped: () => events.push({ type: 'stopped' }),
	}

	return {
		config,
		fetches,
		timers,
		events,
		setThroughput: (v: number | null) => { throughput = v },
		setCurrentPathway: (v: string | string[] | null) => { currentPathway = v },
		setFetchResponse: (v: SteeringResponse) => { fetchResponse = v },
	}
}

describe('SteeringEngine', () => {
	it('provides a valid example', async () => {
		// #region example
		const harness = createTestHarness()
		const engine = new SteeringEngine(harness.config)

		engine.start('https://steering.example.com/manifest.json')
		await Promise.resolve()

		equal(harness.fetches.length, 1)
		equal(harness.events[0]?.type, 'manifestLoaded')

		engine.destroy()
		// #endregion example
	})

	describe('lifecycle', () => {
		it('start triggers initial fetch', async () => {
			const harness = createTestHarness()
			const engine = new SteeringEngine(harness.config)

			engine.start('https://example.com/steer')
			await Promise.resolve()

			equal(harness.fetches.length, 1)
			equal(harness.fetches[0].url.startsWith('https://example.com/steer'), true)

			engine.destroy()
		})

		it('start with same URL is idempotent', async () => {
			const harness = createTestHarness()
			const engine = new SteeringEngine(harness.config)

			engine.start('https://example.com/steer')
			await Promise.resolve()
			engine.start('https://example.com/steer')
			await Promise.resolve()

			equal(harness.fetches.length, 1)

			engine.destroy()
		})

		it('start with different URL cancels previous and starts new', async () => {
			const harness = createTestHarness()
			const engine = new SteeringEngine(harness.config)

			engine.start('https://example.com/steer1')
			await Promise.resolve()
			engine.start('https://example.com/steer2')
			await Promise.resolve()

			equal(harness.fetches.length, 2)

			engine.destroy()
		})

		it('stop cancels pending timer', async () => {
			const harness = createTestHarness()
			const engine = new SteeringEngine(harness.config)

			engine.start('https://example.com/steer')
			await Promise.resolve()

			equal(harness.timers.length, 1)
			engine.stop()
			equal(harness.timers[0].cancelled, true)

			engine.destroy()
		})

		it('destroy stops and prevents further operations', async () => {
			const harness = createTestHarness()
			const engine = new SteeringEngine(harness.config)

			engine.start('https://example.com/steer')
			await Promise.resolve()

			engine.destroy()

			engine.start('https://example.com/steer2')
			await Promise.resolve()
			equal(harness.fetches.length, 1)
		})
	})

	describe('fetch-parse-apply loop', () => {
		it('fires onManifestLoaded and schedules next load on success', async () => {
			const harness = createTestHarness()
			const engine = new SteeringEngine(harness.config)

			engine.start('https://example.com/steer')
			await Promise.resolve()

			equal(harness.events.some(e => e.type === 'manifestLoaded'), true)
			equal(harness.timers.length, 1)
			equal(harness.timers[0].ms, BASIC_MANIFEST.TTL * 1000)

			engine.destroy()
		})

		it('fires onPathwayChange on first successful load', async () => {
			const harness = createTestHarness()
			const engine = new SteeringEngine(harness.config)

			engine.start('https://example.com/steer')
			await Promise.resolve()

			const pathwayEvent = harness.events.find(e => e.type === 'pathwayChange')
			equal(pathwayEvent?.data, 'CDN-A')

			engine.destroy()
		})

		it('fires onStopped and schedules no timer on HTTP 410', async () => {
			const harness = createTestHarness()
			harness.setFetchResponse({ status: 410, body: '', headers: { get: () => null } })
			const engine = new SteeringEngine(harness.config)

			engine.start('https://example.com/steer')
			await Promise.resolve()

			equal(harness.events.some(e => e.type === 'stopped'), true)
			equal(harness.timers.length, 0)

			engine.destroy()
		})

		it('schedules at Retry-After on HTTP 429', async () => {
			const harness = createTestHarness()
			const retryHeaders = new Map([['Retry-After', '60']])
			harness.setFetchResponse({
				status: 429,
				body: '',
				headers: { get: (name: string) => retryHeaders.get(name) ?? null },
			})
			const engine = new SteeringEngine(harness.config)

			engine.start('https://example.com/steer')
			await Promise.resolve()

			equal(harness.timers.length, 1)
			equal(harness.timers[0].ms, 60000)

			engine.destroy()
		})

		it('fires onError and schedules retry on server error', async () => {
			const harness = createTestHarness()
			harness.setFetchResponse({ status: 500, body: '', headers: { get: () => null } })
			const engine = new SteeringEngine(harness.config)

			engine.start('https://example.com/steer')
			await Promise.resolve()

			equal(harness.events.some(e => e.type === 'error'), true)
			equal(harness.timers.length, 1)

			engine.destroy()
		})

		it('does not fire callbacks when fetch is aborted', async () => {
			const harness = createTestHarness()
			harness.config = {
				...harness.config,
				fetch: async (_url, signal) => {
					return new Promise((_resolve, reject) => {
						signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
					})
				},
			}
			const engine = new SteeringEngine(harness.config)

			engine.start('https://example.com/steer')
			engine.stop()
			await Promise.resolve()

			equal(harness.events.length, 0)

			engine.destroy()
		})
	})

	describe('query parameters', () => {
		it('includes throughput and pathway when getters return values', async () => {
			const harness = createTestHarness()
			harness.setThroughput(5000000)
			harness.setCurrentPathway('CDN-A')
			const engine = new SteeringEngine(harness.config)

			engine.start('https://example.com/steer')
			await Promise.resolve()

			const url = new URL(harness.fetches[0].url)
			equal(url.searchParams.get('_HLS_throughput'), '5000000')
			equal(url.searchParams.get('_HLS_pathway'), 'CDN-A')

			engine.destroy()
		})

		it('omits params when getters return null', async () => {
			const harness = createTestHarness()
			const engine = new SteeringEngine(harness.config)

			engine.start('https://example.com/steer')
			await Promise.resolve()

			const url = new URL(harness.fetches[0].url)
			equal(url.searchParams.has('_HLS_throughput'), false)
			equal(url.searchParams.has('_HLS_pathway'), false)

			engine.destroy()
		})

		it('formats DASH params via CDP descriptor', async () => {
			const harness = createTestHarness()
			harness.config = { ...harness.config, cdp: DASH_CDP }
			harness.setThroughput(5000000)
			harness.setCurrentPathway(['CDN-A', 'CDN-B'])
			const engine = new SteeringEngine(harness.config)

			engine.start('https://example.com/steer')
			await Promise.resolve()

			const url = new URL(harness.fetches[0].url)
			equal(url.searchParams.get('_DASH_throughput'), '5000')
			equal(url.searchParams.get('_DASH_pathway'), 'CDN-A,CDN-B')

			engine.destroy()
		})
	})

	describe('penalization', () => {
		it('fires onPathwayChange when preferred pathway changes', async () => {
			const harness = createTestHarness()
			const engine = new SteeringEngine(harness.config)

			engine.start('https://example.com/steer')
			await Promise.resolve()
			harness.events.length = 0

			engine.penalize('CDN-A')
			equal(harness.events.some(e => e.type === 'pathwayChange' && e.data === 'CDN-B'), true)

			engine.destroy()
		})

		it('does not fire callback when preferred pathway is unchanged', async () => {
			const harness = createTestHarness()
			const engine = new SteeringEngine(harness.config)

			engine.start('https://example.com/steer')
			await Promise.resolve()
			harness.events.length = 0

			engine.penalize('CDN-C')
			equal(harness.events.filter(e => e.type === 'pathwayChange').length, 0)

			engine.destroy()
		})
	})

	describe('loading guard', () => {
		it('does not produce concurrent fetches', async () => {
			let resolveFirst: ((v: SteeringResponse) => void) | null = null
			const harness = createTestHarness()
			let callCount = 0
			harness.config = {
				...harness.config,
				fetch: async (_url, _signal) => {
					callCount++
					if (callCount === 1) {
						return new Promise<SteeringResponse>((resolve) => { resolveFirst = resolve })
					}
					return { status: 200, body: JSON.stringify(BASIC_MANIFEST), headers: { get: () => null } }
				},
			}
			const engine = new SteeringEngine(harness.config)

			engine.start('https://example.com/steer')
			engine.start('https://example.com/steer')

			equal(callCount, 1)

			resolveFirst!({ status: 200, body: JSON.stringify(BASIC_MANIFEST), headers: { get: () => null } })
			await Promise.resolve()

			engine.destroy()
		})
	})
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w libs/content-steering`
Expected: FAIL — `SteeringEngine` not exported.

- [ ] **Step 3: Write the implementation**

Create `libs/content-steering/src/SteeringEngine.ts`:

```typescript
import { buildSteeringUrl } from './buildSteeringUrl.ts'
import { SteeringProcessor } from './SteeringProcessor.ts'
import type { SteeringEngineConfig } from './SteeringEngineConfig.ts'

/**
 * Content steering engine that manages the full fetch-parse-apply loop.
 *
 * Wires a {@link SteeringProcessor} to real I/O via injected dependencies
 * for fetching, timer scheduling, and player state access.
 *
 * @example
 * {@includeCode ../test/SteeringEngine.test.ts#example}
 *
 * @beta
 */
export class SteeringEngine {
	private readonly config: SteeringEngineConfig
	private readonly processor: SteeringProcessor
	private controller: AbortController | null
	private cancelTimer: (() => void) | null = null
	private url: string | null = null
	private loading: boolean = false
	private destroyed: boolean = false

	constructor(config: SteeringEngineConfig) {
		this.config = config
		this.processor = new SteeringProcessor({
			penalty: config.penalty,
			validate: config.validate,
		})
		this.controller = new AbortController()
	}

	/**
	 * Starts the steering loop. Triggers the initial fetch immediately.
	 * Idempotent if called with the same URL while already running.
	 *
	 * @param url - The steering server URL.
	 * @param _pathways - Reserved for future use (initial pathway list).
	 */
	start(url: string, _pathways?: string[]): void {
		if (this.destroyed) {
			return
		}

		if (this.url === url && (this.loading || this.cancelTimer !== null)) {
			return
		}

		if (this.url !== null && this.url !== url) {
			this.stop()
		}

		this.url = url
		this.load()
	}

	/**
	 * Stops the steering loop. Cancels pending timer and in-flight fetch.
	 * Processor state is preserved.
	 */
	stop(): void {
		this.cancelTimer?.()
		this.cancelTimer = null
		this.controller?.abort()
		this.controller = new AbortController()
	}

	/**
	 * Penalizes a pathway. Fires `onPathwayChange` if the preferred pathway changes.
	 *
	 * @param pathwayId - The pathway ID to penalize.
	 */
	penalize(pathwayId: string): void {
		if (this.destroyed) {
			return
		}

		const previousPreferred = this.processor.getPreferredPathway()
		const newPreferred = this.processor.penalize(pathwayId)

		if (newPreferred !== undefined && newPreferred !== previousPreferred) {
			this.config.onPathwayChange?.(newPreferred)
		}
	}

	/**
	 * Destroys the engine. Stops the loop and resets processor state.
	 * The engine is not reusable after this call.
	 */
	destroy(): void {
		if (this.destroyed) {
			return
		}

		this.destroyed = true
		this.stop()
		this.processor.reset()
		this.controller = null
	}

	private load(): void {
		if (this.loading || this.destroyed || this.url === null) {
			return
		}

		this.loading = true

		const params: Record<string, string> = {}
		const { cdp } = this.config

		const throughput = this.config.getThroughput()
		if (throughput !== null) {
			const formatted = cdp.formatThroughput ? cdp.formatThroughput(throughput) : String(throughput)
			params[`_${cdp.formatName}_throughput`] = formatted
		}

		const pathway = this.config.getCurrentPathway()
		if (pathway !== null) {
			const formatted = cdp.formatPathway ? cdp.formatPathway(pathway) : String(pathway)
			params[`_${cdp.formatName}_pathway`] = formatted
		}

		const reloadUrl = this.processor.getReloadUrl()
		const requestUrl = buildSteeringUrl(reloadUrl ?? this.url, params)

		this.config.fetch(requestUrl, this.controller!.signal).then(
			(response) => {
				if (this.destroyed) {
					return
				}

				this.loading = false

				const result = this.processor.processResponse(
					response.status,
					response.body,
					response.headers,
				)

					switch (result.type) {
					case 'success':
						this.config.onManifestLoaded?.(this.processor.getManifest()!)
						if (result.pathwayChanged && result.preferredPathway !== undefined) {
							this.config.onPathwayChange?.(result.preferredPathway)
						}
						this.scheduleNext(this.processor.getTtl() * 1000)
						break

					case 'gone':
						this.config.onStopped?.()
						break

					case 'throttled':
						this.scheduleNext(result.retryAfter * 1000)
						break

					case 'error':
						this.config.onError?.({ status: result.status, message: `Steering request failed with status ${result.status}` })
						this.scheduleNext(this.processor.getTtl() * 1000)
						break
				}
			},
			(error: unknown) => {
				this.loading = false

				if (this.destroyed) {
					return
				}

				if (error instanceof DOMException && error.name === 'AbortError') {
					return
				}

				this.config.onError?.({ message: String(error) })
				this.scheduleNext(this.processor.getTtl() * 1000)
			},
		)
	}

	private scheduleNext(ms: number): void {
		if (this.destroyed) {
			return
		}

		this.cancelTimer?.()
		this.cancelTimer = this.config.schedule(() => {
			this.cancelTimer = null
			this.load()
		}, ms)
	}
}
```

- [ ] **Step 4: Add exports to index.ts**

Add to `libs/content-steering/src/index.ts`:

```typescript
export * from './SteeringEngine.ts'
export type * from './SteeringEngineConfig.ts'
```

- [ ] **Step 5: Build and run tests**

Run: `npm run build -w libs/content-steering && npm test -w libs/content-steering`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add libs/content-steering/src/SteeringEngine.ts libs/content-steering/src/SteeringEngineConfig.ts libs/content-steering/test/SteeringEngine.test.ts libs/content-steering/src/index.ts
git commit -s -m "feat(content-steering): add SteeringEngine class"
```

---

### Task 11: Final verification and version bump

**Files:**
- Modify: `libs/content-steering/package.json`
- Modify: `libs/content-steering/CHANGELOG.md`

- [ ] **Step 1: Run the full build and test suite**

Run: `npm run build -w libs/content-steering && npm test -w libs/content-steering`
Expected: All tests pass (12 existing + new tests).

- [ ] **Step 2: Run typecheck across the entire project**

Run: `npm run typecheck`
Expected: No type errors.

- [ ] **Step 3: Bump the package version**

Since this adds significant new public API surface (pure functions, SteeringProcessor, SteeringEngine, CDP descriptors, new types), this is a minor version bump.

Run: `npm run ver content-steering 0.24.0`

If that command isn't available, manually update `libs/content-steering/package.json` version to `"0.24.0"`.

- [ ] **Step 4: Update CHANGELOG.md**

Add a new section at the top of `libs/content-steering/CHANGELOG.md`:

```markdown
## [0.24.0] - YYYY-MM-DD

### Added

- `selectPathway` — pure function implementing spec Step 5 (Content Steering Evaluation)
- `applyPathwayCloning` — pure function implementing spec Section 5 (Pathway Cloning)
- `applyUriReplacement` — pure function implementing URI replacement algorithm
- `buildSteeringUrl` — pure function for building steering server request URLs
- `parseSteeringResponse` — pure function for parsing HTTP responses from steering servers
- `SteeringProcessor` — stateful processor implementing the spec's 7-step client algorithm
- `SteeringEngine` — I/O engine with injected fetch/schedule dependencies
- `HLS_CDP` — built-in CDP descriptor for HLS content steering
- `DASH_CDP` — built-in CDP descriptor for DASH content steering
- Types: `SteeringResponse`, `SteeringError`, `SteeringResponseResult`, `ProcessResult`, `PathwayCloneResult`, `CdpDescriptor`, `SteeringProcessorConfig`, `SteeringEngineConfig`

### Changed

- `UriReplacement` now accepts an index signature for CDP-specific extension fields
```

Replace `YYYY-MM-DD` with today's date.

- [ ] **Step 5: Run final build and tests**

Run: `npm run build -w libs/content-steering && npm test -w libs/content-steering`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add libs/content-steering/package.json libs/content-steering/CHANGELOG.md
git commit -s -m "chore(content-steering): bump version to 0.24.0"
```
