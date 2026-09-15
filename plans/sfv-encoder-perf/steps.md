# Encoder performance: implementation steps

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply findings 1 to 6 of [audit.md](audit.md) to `@svta/cml-structured-field-values` without changing any output, fix finding 7 in `@svta/cml-utils`, and open an issue for the side findings.

**Architecture:** The container serializers stop wrapping bare values in `SfItem`. They read `value` and `params` from an `SfItem` or use the bare value, and join member strings once. The leaf serializers keep their signatures. `serializeInnerList` gains a `(list, params)` overload so the containers can pass a bare array without an allocation. `serializeDecimal` compares the magnitude as a number.

**Tech Stack:** TypeScript, Node 24 `node:test`, the `structured-field-tests` corpus, tsdown build, api-extractor.

## Global constraints

- Output must stay identical to `main` on the bench inputs and the corpus. One exception: `serializeDecimal` fails on values of `1e21` and above.
- Every error message stays the same, except the array text in `encodeSfItem([1, 2])`.
- No module-scope side effects. Regex constants are allowed, `STRING_REGEX` is the precedent.
- Tests import from the package name. Build before test.
- Commit with `git commit -s`, conventional type, and the `Co-Authored-By` trailer.
- Do not bump versions. Add changelog notes under `## [Unreleased]`.

---

### Task 1: `serializeDecimal` magnitude check

**Files:**
- Modify: `libs/structured-field-values/src/serialize/serializeDecimal.ts`
- Test: `libs/structured-field-values/test/serializeDecimal.test.ts`

- [x] **Step 1: Add the failing assertions**

```ts
assert.throws(() => serializeDecimal(1e21), /failed to serialize "1e\+21" as Decimal/)
assert.throws(() => serializeDecimal(-1e21), /failed to serialize "-1e\+21" as Decimal/)
```

- [x] **Step 2: Run the test and confirm it fails**

Run from `libs/structured-field-values`: `node --test test/serializeDecimal.test.ts`
Expected: `Missing expected exception`, because the function returns `1e+21.0`.

- [x] **Step 3: Replace the string length check**

```ts
if (Math.abs(roundedValue) >= 1e12) {
	throw serializeError(value, DECIMAL)
}
```

- [x] **Step 4: Build and run the package tests**

Run from the repository root: `npm run build -w libs/structured-field-values && npm test -w libs/structured-field-values`
Expected: all tests pass.

- [x] **Step 5: Commit**

`fix(structured-field-values): reject decimals of 1e21 and above`

### Task 2: `serializeInnerList` accepts a list and parameters

**Files:**
- Modify: `libs/structured-field-values/src/serialize/serializeInnerList.ts`
- Create: `libs/structured-field-values/test/serializeInnerList.test.ts`

**Interfaces:**
- Produces: `serializeInnerList(value: SfInnerList): string` and `serializeInnerList(value: SfItem[] | SfBareItem[], params?: SfParameters): string`. Task 4 calls the second form.

- [x] **Step 1: Write the failing test**

```ts
import { serializeInnerList, SfItem, SfToken } from '@svta/cml-structured-field-values'
import assert from 'node:assert'
import test from 'node:test'

test('serializeInnerList', () => {
	assert.deepStrictEqual(serializeInnerList({ value: [1, 2], params: { a: 1 } }), '(1 2);a=1')
	assert.deepStrictEqual(serializeInnerList({ value: [new SfItem(1, { q: true }), new SfItem('x')], params: {} }), '(1;q "x")')
	assert.deepStrictEqual(serializeInnerList([1, 2]), '(1 2)')
	assert.deepStrictEqual(serializeInnerList([1, 2], { a: new SfToken('t') }), '(1 2);a=t')
	assert.deepStrictEqual(serializeInnerList([]), '()')
})
```

- [x] **Step 2: Run the test and confirm it fails**

Expected: `TypeError`, because the array form has no `value.value`.

- [x] **Step 3: Implement the overload with an index loop**

```ts
export function serializeInnerList(value: SfInnerList): string;
export function serializeInnerList(value: SfItem[] | SfBareItem[], params?: SfParameters): string;
export function serializeInnerList(value: SfInnerList | SfItem[] | SfBareItem[], params?: SfParameters): string {
	let list: SfItem[] | SfBareItem[]
	if (Array.isArray(value)) {
		list = value
	}
	else {
		list = value.value
		params = value.params
	}

	let output = '('
	for (let i = 0; i < list.length; i++) {
		if (i > 0) {
			output += ' '
		}
		output += serializeItem(list[i])
	}

	return `${output})${serializeParams(params)}`
}
```

- [x] **Step 4: Build, test, commit**

`perf(structured-field-values): serialize inner lists without a mapped array`

### Task 3: Leaf serializers

**Files:**
- Modify: `libs/structured-field-values/src/serialize/serializeKey.ts`, `serializeToken.ts`, `serializeString.ts`, `serializeParams.ts`
- Test: `libs/structured-field-values/test/serializeKey.test.ts`, `serializeString.test.ts`, create `serializeParams.test.ts`

- [x] **Step 1: Add guard tests that pass today and must keep passing**

```ts
// serializeKey.test.ts
assert.throws(() => serializeKey(''), /failed to serialize "" as Key/)
assert.throws(() => serializeKey('A'), /failed to serialize "A" as Key/)
assert.throws(() => serializeKey('0a'), /failed to serialize "0a" as Key/)
assert.throws(() => serializeKey('-a'), /failed to serialize "-a" as Key/)
assert.throws(() => serializeKey('a b'), /failed to serialize "a b" as Key/)
assert.throws(() => serializeKey('aé'), /failed to serialize "aé" as Key/)

// serializeString.test.ts
assert.deepStrictEqual(serializeString(''), `""`)
assert.deepStrictEqual(serializeString('a\\"b'), `"a\\\\\\"b"`)
assert.deepStrictEqual(serializeString('tab\tend'.replace('\t', ' ')), `"tab end"`)
assert.throws(() => serializeString('str\ting'), /failed to serialize "str\ting" as String/)

// serializeParams.test.ts
assert.deepStrictEqual(serializeParams(undefined), '')
assert.deepStrictEqual(serializeParams({}), '')
assert.deepStrictEqual(serializeParams({ a: 1, b: true, c: 'x', d: new SfToken('t'), e: false }), `;a=1;b;c="x";d=t;e=?0`)
assert.throws(() => serializeParams({ A: 1 }), /failed to serialize "A" as Key/)
```

- [x] **Step 2: Run the tests, confirm they pass against the current build**

- [x] **Step 3: Rewrite the four functions**

`serializeKey`: `typeof` guard, first character `a-z` or `*`, then `a-z 0-9 _ - . *` by `charCodeAt`.
`serializeToken`: module constant `TOKEN_REGEX = /^[a-zA-Z*][!#$%&'*+\-.^_`|~\w:/]*$/`.
`serializeString`: module constants `STRING_ESCAPE_REGEX = /[\x00-\x1f\x7f"\\]/`, `BACKSLASH_REGEX = /\\/g`, `DQUOTE_REGEX = /"/g`. Return `"${value}"` when `STRING_ESCAPE_REGEX` does not match.
`serializeParams`: `Object.keys` loop with `+=`.

- [x] **Step 4: Build, test, commit**

`perf(structured-field-values): validate keys and strings in one pass`

### Task 4: Container serializers

**Files:**
- Create: `libs/structured-field-values/src/serialize/serializeMember.ts` (package private, not exported from `serialize/index.ts`)
- Create: `libs/structured-field-values/src/serialize/serializeDictMember.ts` (package private)
- Modify: `serializeDict.ts`, `serializeList.ts`, `encodeSfItem.ts`
- Test: `encodeSfDict.test.ts`, `encodeSfList.test.ts`, `encodeSfItem.test.ts`

**Interfaces:**
- `serializeMember(member: SfMember): string`: inner list for an array or an `SfItem` with an array value, item otherwise.
- `serializeDictMember(key: string, member: SfMember): string`: key, then parameters only for `true`, else `=` and the member.

- [x] **Step 1: Add guard tests that pass today**

```ts
// encodeSfDict.test.ts
assert.deepStrictEqual(encodeSfDict({ a: [1, 2], b: new SfItem([new SfItem(1, { x: true })], { y: 2 }) }), 'a=(1 2), b=(1;x);y=2')
assert.deepStrictEqual(encodeSfDict({ a: new SfItem(true, { p: 1 }), b: true, c: new SfItem(false, { q: 2 }) }), 'a;p=1, b, c=?0;q=2')
assert.deepStrictEqual(encodeSfDict({ a: new SfItem('x', { p: 1, q: true }) }), 'a="x";p=1;q')
assert.throws(() => encodeSfDict(new Map([[1, 2]])), /failed to serialize "1" as Key/)
assert.throws(() => encodeSfDict({ A: 1 }), /failed to serialize "A" as Key/)

// encodeSfList.test.ts
assert.deepStrictEqual(encodeSfList([[1, 2], 3, new SfItem([4], { a: 1 }), new SfItem(5, { b: true })]), '(1 2), 3, (4);a=1, 5;b')
assert.deepStrictEqual(encodeSfList([true, false]), '?1, ?0')

// encodeSfItem.test.ts
assert.deepStrictEqual(encodeSfItem('a', { p: 1, q: true }), '"a";p=1;q')
assert.deepStrictEqual(encodeSfItem(new SfItem('a', { p: 1 })), '"a";p=1')
assert.throws(() => encodeSfItem([1, 2]), /as Bare Item/)
```

- [x] **Step 2: Run the tests, confirm they pass against the current build**

- [x] **Step 3: Rewrite the containers**

`serializeDict`: `Object.keys` loop or `Map` iteration, `parts.push(serializeDictMember(key, member))`, `parts.join(separator)`.
`serializeList`: index loop that appends the members with `+=`. A parts array with `join` measured 15% slower on a 20-member list. Remove the `as any` TODO.
`encodeSfItem`: `serializeItem(value)` for an `SfItem`, else `serializeBareItem(value) + serializeParams(params)`.

- [x] **Step 4: Build, test, typecheck, lint**

Run from the repository root: `npm run build -w libs/structured-field-values && npm test -w libs/structured-field-values && npm run typecheck && npx eslint libs/structured-field-values`

- [x] **Step 5: Commit**

`perf(structured-field-values): serialize containers without wrapper objects`

### Task 5: Benchmark

**Files:**
- Create: `libs/structured-field-values/bench/bench.ts`, `libs/structured-field-values/bench/inputs.ts`
- Modify: `libs/structured-field-values/package.json` (add `"bench": "node bench/bench.ts"`)

- [x] **Step 1: Port `plans/sfv-encoder-perf/bench` to TypeScript.** Variants: this build and `--baseline=<dist path>`. Build the inputs with the `SfItem` and `SfToken` classes of the variant under test, so `instanceof` matches. Modes: timing, allocation, `--verify` against the corpus.
- [x] **Step 2: Run `npm run bench -w libs/structured-field-values -- --baseline=temp/dist/index.js --verify`** and confirm zero differences except the decimal case. Result: 1258 identical.
- [x] **Step 3: Run the timing bench and record the table in `audit.md`.**
- [x] **Step 4: Commit** `chore(structured-field-values): add an encoder benchmark`

### Task 6: Changelog, API report, tree-shaking probe

- [x] Add `### Changed` and `### Fixed` notes under `## [Unreleased]` in `libs/structured-field-values/CHANGELOG.md`.
- [x] Review the diff of `config/cml-structured-field-values.api.md`. The only expected change is the `serializeInnerList` overload.
- [x] Bundle a bare `import '@svta/cml-structured-field-values'` with Rollup and tsdown. Nothing but import lines may survive.
- [x] Run `npm test` at the repository root.
- [x] Commit `docs(structured-field-values): changelog and design record for the encoder changes`, push the branch, hand the PR to Casey.

### Task 7: `encodeBase64` in utils (branch from `main`)

**Files:**
- Modify: `libs/utils/src/encodeBase64.ts`
- Create: `libs/utils/test/encodeBase64.test.ts`
- Modify: `libs/utils/CHANGELOG.md`

- [ ] **Step 1: Write the failing test**

```ts
test('encodeBase64 handles inputs above the argument limit', () => {
	const bytes = new Uint8Array(200_000).map((_, i) => i & 255)
	const encoded = encodeBase64(bytes)
	assert.deepStrictEqual(encoded.length, 266_668)
	assert.deepStrictEqual(decodeBase64(encoded), bytes)
})
```

Expected failure: `RangeError: Maximum call stack size exceeded`.

- [ ] **Step 2: Encode in 32 KB chunks**

```ts
export function encodeBase64(binary: Uint8Array): string {
	let text = ''
	for (let i = 0; i < binary.length; i += 0x8000) {
		text += String.fromCharCode.apply(null, binary.subarray(i, i + 0x8000) as unknown as number[])
	}
	return btoa(text)
}
```

- [ ] **Step 3: Build utils and structured-field-values, run both test suites, commit, push.**

### Task 8: Issue for the side findings

- [ ] Open one issue with the four correctness findings from `audit.md`, one section each, with the reproducing call and the RFC reference.
