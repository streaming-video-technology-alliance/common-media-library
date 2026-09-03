---
status: draft
---

# RFC: Consumer-defined XML builders

| | |
|---|---|
| **Author** | Casey Occhialini |
| **Date** | 2026-09-02 (revised 2026-09-03) |
| **Package** | `@svta/cml-xml` |
| **Breaking change** | No |
| **Tracking** | [#424](https://github.com/streaming-video-technology-alliance/common-media-library/issues/424), [dash.js#4984](https://github.com/Dash-Industry-Forum/dash.js/issues/4984) |
| **Design record** | `plans/xml-incremental-parser/` |

> **Revision note.** The first draft proposed an incremental parser, `XmlParser`, with `write(chunk)` and
> `end()`. Review ([#431](https://github.com/streaming-video-technology-alliance/common-media-library/pull/431))
> found that every blocking problem sat in the streaming half, that #432 had already put the flat scanner
> and an internal builder on `main`, and that dash.js parses complete strings. This revision proposes the
> builder contract with a one-shot entry point. Incremental input is deferred to its own RFC. Its design
> notes are under "Deferred: incremental input" in `plans/xml-incremental-parser/findings.md`. The file
> name keeps the original working name.

## Summary

Add `buildXml(input, builder, options)`. It runs the scanner that #432 shipped and hands each element,
text run, CDATA section, comment, and doctype to a *builder* that the consumer supplies. It assembles no
`XmlNode` tree. The builder decides what an element becomes: whatever `createElement` returns is the
parent that the element's children receive, and the child that `appendChild` receives when the element
completes. Returning `undefined` skips the element. A manifest parser can therefore produce its final
objects in the single tokenization pass, with no intermediate tree.

`parseXml` keeps its signature and output. It and `buildXml` share one scanner, and three grammar fixes to
that scanner land for both. New public members: `buildXml`, `XmlBuilder<TElement, TDocument>`,
`XmlBuildOptions`, and `XmlParseError`.

```ts
import { buildXml, type XmlBuilder } from '@svta/cml-xml'

type Node = { tagName: string; attributes: Record<string, string>; children: Node[]; text: string }

const builder: XmlBuilder<Node> = {
	createDocument: () => ({ tagName: '#document', attributes: {}, children: [], text: '' }),
	createElement: (parent, name, attributes, localName) => ({ tagName: localName, attributes, children: [], text: '' }),
	appendChild: (parent, child) => { parent.children.push(child) },
	appendText: (parent, text) => { parent.text += text },
}

const document = buildXml('<MPD><Period id="1"/></MPD>', builder)
```

## Motivation

dash.js parses every DASH manifest with `parseXml` and then walks the tree a second time in
`DashParser.processNode`. That pass converts attribute strings with its matchers, turns children into named
properties and arrays, and attaches `tagName`, `__text`, and `__children`. [#424](https://github.com/streaming-video-technology-alliance/common-media-library/issues/424)
asked for a faster parser on dense `SegmentTimeline` manifests. The investigation (`plans/xml-parse-perf/`)
found that the tree parser could gain about 30 percent and that the 2x dash.js prototyped came from
deleting its own second pass. #432 then rewrote `parseXml` as a flat scanner and took 20 to 40 percent.

What remains is structural. Every consumer this library knows builds something other than an `XmlNode`
tree: dash.js builds its manifest object, a HAM adapter flattens the manifest into presentations and
segments, shaka-player walks its own tree with `findChildren`, the PlayReady helpers in `@svta/cml-drm`
pull two values out of a small document. Each one pays for a tree it does not want and then writes the
walk that turns it into what it does want. `parseXml` has no extension point for that: its options change
what the tree contains, not what the output is.

The scanner on `main` already reports every construct to an internal builder. This RFC makes that builder
public, defines its contract, and fixes three tokenization errors in the scanner while its contract is
being written down. On top of #432 the performance headroom for dash.js is modest, and the RFC says so
under Measured results. The case rests on what the API lets a consumer do: shape the output directly,
skip what it does not need, get an error instead of a plausible partial document when the input is cut
off, and never allocate a tree.

## Guide-level explanation

### The builder contract

A builder is a plain object of functions. `buildXml` calls `createDocument` once, unless a root value is
supplied in the options, then `createElement` for every start tag with the enclosing element's value as
`parent`. Whatever `createElement` returns becomes the parent for that element's children, and
`appendChild` receives it when the element completes.

```ts
export type XmlBuilder<TElement, TDocument = TElement> = {
	createDocument?: (this: void) => TDocument;
	createElement: (this: void, parent: TDocument | TElement, name: string, attributes: Record<string, string>, localName: string, prefix: string | null) => TElement | undefined;
	appendChild?: (this: void, parent: TDocument | TElement, child: TElement, name: string) => void;
	appendText?: (this: void, parent: TDocument | TElement, text: string, name: string) => void;
	appendCdata?: (this: void, parent: TDocument | TElement, text: string, name: string) => void;
	appendComment?: (this: void, parent: TDocument | TElement, text: string, name: string) => void;
	appendDoctype?: (this: void, parent: TDocument | TElement, text: string, name: string) => void;
};
```

`name` is the tag name as written (`tt:span`), `localName` the part after the prefix (`span`), and `prefix`
the part before it (`tt`) or `null`. Without a prefix, `localName` is the same string as `name`. A builder
that does not care about namespaces declares three parameters.

`appendChild` runs when the child is complete, after all of the child's own children are appended, so it
is post-order. Its trailing `name` is the child's tag name. The text callbacks receive the parent's tag
name, the empty string at document level. With the name passed in, a builder can return a bare value such
as `{ t, d, r }` for `<S>` and route it by name in `appendChild`.

Text arrives once per run, untrimmed and entity-decoded. Runs that are only whitespace are dropped unless
`keepWhitespace` is set. A builder that has no `appendCdata` receives CDATA content through `appendText`,
so character data is never lost by omission. Comments and doctypes arrive as their inner text, between
`<!--` and `-->` and after `<!`. A handler opts in by existing: without `appendComment`, the scanner skips
comments and never slices them out of the input.

Property syntax and `this: void` are deliberate. Under `strictFunctionTypes` only property-typed functions
check their parameters contravariantly, and the scanner calls the functions detached from the builder
object, so a method that used `this` would fail at runtime.

### Building a manifest object

This example is illustrative. It shows the shape of a dash.js-style builder with a handful of array
elements and one conversion rule. The faithful port of `processNode`, with all of its matchers and array
elements, lives in `plans/xml-incremental-parser/prototype/dash.ts` and is tested for identical output.

```ts
import { buildXml, type XmlBuilder } from '@svta/cml-xml'

type DashNode = Record<string, unknown> & {
	tagName: string;
	__children: DashNode[];
	__text?: string;
};

type DashDocument = { root: DashNode | undefined }

const ARRAY_NODES = new Set(['Period', 'AdaptationSet', 'Representation', 'S', 'BaseURL', 'ContentProtection'])
const NUMERIC = /^[-+]?[0-9]+[.]?[0-9]*([eE][-+]?[0-9]+)?$/

const dashBuilder: XmlBuilder<DashNode, DashDocument> = {
	createDocument: () => ({ root: undefined }),

	createElement(parent, name, attributes, localName) {
		const node: DashNode = { tagName: localName, __children: [] }
		for (const key in attributes) {
			const value = attributes[key]
			node[key] = localName === 'S' ? parseInt(value, 10) : key !== 'id' && NUMERIC.test(value) ? parseFloat(value) : value
		}
		return node
	},

	appendChild(parent, child, name) {
		if ('root' in parent) {
			parent.root = child
			return
		}
		parent.__children.push(child)
		const existing = parent[name]
		if (Array.isArray(existing)) {
			existing.push(child)
		}
		else if (ARRAY_NODES.has(name)) {
			parent[name] = [child]
		}
		else {
			parent[name] = child
		}
	},

	appendText(parent, text) {
		if (!('root' in parent)) {
			parent.__text = text.trim()
		}
	},
}

export function parseManifest(manifestText: string): DashNode | undefined {
	return buildXml(manifestText, dashBuilder).root
}
```

The `<S>` branch is the DASH-specific fast path that #424 asked for. It belongs in the player, where the
schema is known. The builder object is a module-level constant on purpose: the scanner's call sites then
see the same functions on every parse, which keeps them monomorphic (see Implementation notes). Because
the document has its own type, `parent` is a union and `'root' in parent` tells the two apart. In a real
port the check is a type guard on a marker that no attribute can collide with, since attribute names
become properties of the node.

### Flattening builders

A builder that flattens the manifest, as a HAM converter does, cannot finish an `<S>` inside
`createElement`. A segment needs the Representation id and bandwidth for its URL, and in most manifests
the `SegmentTemplate` sits on the AdaptationSet, so its `<S>` children arrive before the Representations
that share it. The builder keeps a compact record per `<S>` and expands the records when the
Representation, or the Period, completes in `appendChild`:

```ts
import { buildXml, type XmlBuilder } from '@svta/cml-xml'

type Timeline = { t: number; d: number; r: number }[]
type Level = { name: string; attributes: Record<string, string>; timeline: Timeline; segments: string[] }
type Model = { segments: string[] }

const flattening: XmlBuilder<Level, Model> = {
	createDocument: () => ({ segments: [] }),
	createElement: (parent, name, attributes, localName) => {
		const timeline = 'timeline' in parent && localName !== 'AdaptationSet' && localName !== 'Period' ? parent.timeline : []
		return { name: localName, attributes, timeline, segments: [] }
	},
	appendChild: (parent, child) => {
		if (child.name === 'S') {
			const parentTimeline = 'timeline' in parent ? parent.timeline : []
			parentTimeline.push({ t: Number(child.attributes['t'] ?? -1), d: Number(child.attributes['d']), r: Number(child.attributes['r'] ?? 0) })
		}
		else if (child.name === 'Representation') {
			for (const entry of child.timeline) {
				child.segments.push(`${child.attributes['id']}/${entry.t}.m4s`)
			}
			if ('timeline' in parent) {
				parent.segments.push(...child.segments)
			}
		}
		else if ('segments' in parent) {
			parent.segments.push(...child.segments)
		}
	},
}

export function listSegments(manifestText: string): string[] {
	return buildXml(manifestText, flattening).segments
}
```

That is still one pass, but it depends on document order: the XSD sequence puts `SegmentTemplate` before
`Representation` and `BaseURL` before `Period`, and a builder written this way relies on it, where a tree
consumer does not care.

### Skipping subtrees

Return `undefined` from `createElement` to skip an element. The scanner reports nothing inside it, calls no
`appendChild` for it, and still checks the close tags in the skipped region:

```ts
import { buildXml, type XmlBuilder } from '@svta/cml-xml'

type Named = { name: string; children: Named[] }

const withoutMetrics: XmlBuilder<Named> = {
	createDocument: () => ({ name: '#document', children: [] }),
	createElement: (parent, name) => (name === 'Metrics' ? undefined : { name, children: [] }),
	appendChild: (parent, child) => { parent.children.push(child) },
}

const document = buildXml('<MPD><Metrics><Range/></Metrics><Period/></MPD>', withoutMetrics)
// document.children[0].children.map(child => child.name) is ['Period']
```

### Errors

`buildXml` requires a complete document. An element left open or a construct cut off by the end of the
input throws, as do the errors `parseXml` already reports: a malformed attribute, an unclosed quote, a
mismatched or stray close tag. Every error is an `XmlParseError`, an `Error` subclass with the message text
`parseXml` has always produced plus `offset`, `line`, and `column` fields:

```ts
import { buildXml, XmlParseError } from '@svta/cml-xml'

try {
	buildXml(manifestText, dashBuilder)
}
catch (error) {
	if (error instanceof XmlParseError) {
		console.warn(`manifest rejected at offset ${error.offset} (line ${error.line}, column ${error.column})`)
	}
	throw error
}
```

### `parseXml`

`parseXml` does not change for callers. It is one builder over the same scanner, as #432 made it, and keeps
its tolerance for truncated input: a document cut off between tags yields the nodes parsed so far. Its
errors become `XmlParseError` instances with the same messages.

## Reference-level explanation

### Public API

```ts
export type XmlBuildOptions<TDocument> = {
	root?: TDocument;
	keepWhitespace?: boolean;
};

export type XmlBuilder<TElement, TDocument = TElement> = {
	createDocument?: (this: void) => TDocument;
	createElement: (this: void, parent: TDocument | TElement, name: string, attributes: Record<string, string>, localName: string, prefix: string | null) => TElement | undefined;
	appendChild?: (this: void, parent: TDocument | TElement, child: TElement, name: string) => void;
	appendText?: (this: void, parent: TDocument | TElement, text: string, name: string) => void;
	appendCdata?: (this: void, parent: TDocument | TElement, text: string, name: string) => void;
	appendComment?: (this: void, parent: TDocument | TElement, text: string, name: string) => void;
	appendDoctype?: (this: void, parent: TDocument | TElement, text: string, name: string) => void;
};

export class XmlParseError extends Error {
	readonly offset: number;
	readonly line: number;
	readonly column: number;
}

export function buildXml<TElement, TDocument = TElement>(input: string, builder: XmlBuilder<TElement, TDocument>, options?: XmlBuildOptions<TDocument>): TDocument;
```

`TElement` and `TDocument` are inferred from the builder. `buildXml` returns `options.root` when given,
otherwise the result of `builder.createDocument()`, and throws a `TypeError` when neither exists.
`getElementsByName`, `serializeXml`, `XmlNode`, `XmlParseOptions`, and the `parseXml` signature are
unchanged.

### Callback semantics

- `createDocument` is called once, before scanning, unless `options.root` is set. Its result is the parent
  of every top-level element, text run, doctype, and comment, and `buildXml` returns it.
- `createElement(parent, name, attributes, localName, prefix)` is called when a start tag has been read
  completely, before any of the element's content. `attributes` is a fresh object per element with values
  already entity-decoded. The consumer owns it and may keep or mutate it. A return value of `undefined`
  skips the element: nothing inside it is reported, `appendChild` is not called for it, and close tags
  inside it are still checked.
- `appendChild(parent, child, name)` is called when the element completes: at its close tag, or directly
  after `createElement` for a self-closing tag. Siblings complete in document order, so post-order appends
  preserve child order. `name` is the child's tag name as written.
- `appendText(parent, text, name)` is called once per text run, when the run ends at the next `<` or at the
  end of the input. The text is entity-decoded and never trimmed. Runs that contain only space, tab, CR,
  and LF are dropped unless `keepWhitespace` is set. `name` is the parent's tag name, `''` at document
  level. Text at document level goes to the document value.
- `appendCdata(parent, text, name)` receives the content between `<![CDATA[` and `]]>`, not decoded. When
  the builder has no `appendCdata`, `appendText` receives the same content.
- `appendComment(parent, text, name)` receives the text between `<!--` and `-->`. Without the handler, the
  scanner skips comments without slicing them.
- `appendDoctype(parent, text, name)` receives the text after `<!` up to the `>` that ends the declaration,
  honoring a bracketed internal subset and quoted literals.
- The XML declaration and processing instructions are skipped.
- Builder functions are called detached from the builder object and must not rely on `this`.

### Grammar fixes

Three tokenization errors in the scanner are fixed for both entry points. They change `parseXml` output
only on inputs it currently gets wrong.

| Construct | Today | Fixed |
|---|---|---|
| Processing instruction or declaration | ends at the first `>`, so `<?pi a > b?>` yields a PI and the text ` b?>` | ends at `?>` (XML 1.0, sections 2.6 and 2.8) |
| Doctype | ends at the first `>` outside `[...]`, so `<!DOCTYPE a SYSTEM "x>y">` splits inside the literal | a `>` inside a quoted literal does not end it |
| Attribute name | must start with an ASCII letter; any other leading character is skipped, so `<a _x="1">` yields `x` | starts with any XML NameStartChar (`_`, `:`, letters including non-ASCII) |

Eight inputs of the 109-case parity corpus change, each listed with its reason in
`plans/xml-incremental-parser/equivalence.md`. Two are shape consequences rather than grammar: because
comments are delivered as inner text, the `parseXml` tree builder re-adds the delimiters, and a comment
cut off by the end of the input or the malformed `<!--->` now reads `<!-- x-->` and `<!---->` with
`keepComments`. Everything else in the corpus is byte-identical.

### Strictness

`buildXml` throws when the input ends inside a start tag, a close tag, a comment, a CDATA section, a
doctype, a processing instruction, or a quoted attribute value, and when an element is still open at the
end. The message is `Unexpected end of input inside <name>` for an open element and
`Unexpected end of input inside a start tag` and its siblings for constructs, with `Line`, `Column`, and
`Char: end of input` as today's messages report them. A response that ends cleanly mid-document is
therefore an error, not a plausible partial manifest.

`parseXml` keeps its documented tolerance: input cut off between tags yields the nodes parsed so far, an
element left open keeps the children parsed so far, and the errors #430 introduced for malformed
attributes and mismatched close tags stay as they are. The difference is a flag on the shared scanner,
internal to `parseXml`.

### Interaction with the existing API

`parseXml` stays directly on the scanner, as #432 shipped it, with eight prebuilt tree builders
(`keepWhitespace` x `keepComments` x `includeParentElement`) as module-level constants. Trimming moves
from the scanner into the tree builder, which is where the `keepWhitespace` semantics of `parseXml` live
now. A `parseXml`-only bundle never includes `buildXml`.

`parseXml` throws `XmlParseError` where it threw `Error`. `instanceof Error` still holds and the messages
are unchanged, so no caller breaks. Callers that want the position read `offset` instead of parsing the
message.

### Measured results

The prototype under `plans/xml-incremental-parser/prototype/` runs against `main` after #432 with the
checked-in livesim2 fixture. `plans/xml-incremental-parser/benchmark.md` has the method, all tables, and
the forced-GC run. One process per variant and input, 4 warm-up calls, medians of natural-GC runs, Node
24.16 on an M1 Pro on battery. Treat the absolute numbers as indicative. The relative numbers are the
result.

The contract changes cost `parseXml` nothing measurable. The phase-one scanner carries the skip checks,
the name arguments, the untrimmed text policy, the NameStartChar test, and the quoted-literal doctype
scan on its hot path:

| Input | `parseXml` on `main` | `parseXml` on the phase-one scanner |
|---|---:|---:|
| pretty `/>`, 100k `<S>`, 3.7 MB | 22.7 ms | 23.1 ms (+1.7%) |
| minified `/>`, 100k `<S>`, 2.6 MB | 16.4 ms | 16.7 ms (+1.9%) |
| pretty `</S>`, 100k `<S>`, 3.9 MB | 24.7 ms | 24.8 ms (+0.5%) |
| livesim2 real, 5,402 `<S>`, 170 KB | 0.821 ms | 0.804 ms (-2.0%) |
| livesim2-scale synthetic, 148 KB | 0.694 ms | 0.716 ms (+3.2%) |
| `bbb_30fps.mpd`, 3 KB | 0.015 ms | 0.015 ms (+2.5%) |

For dash.js the baseline is `main`'s `parseXml` plus a faithful port of `processNode`. The faithful
one-pass builder produces objects identical to that pipeline, XmlNode leftovers included. The lean builder
keeps only what the rest of dash.js reads and handles `<S>` without the matcher chain:

| Input | dash.js today on `main` | One pass, faithful | One pass, lean |
|---|---:|---:|---:|
| pretty `/>`, 100k `<S>` | 41.4 ms | 37.7 ms (-9%) | 32.9 ms (-21%) |
| minified `/>`, 100k `<S>` | 35.8 ms | 33.5 ms (-6%) | 30.6 ms (-15%) |
| pretty `</S>`, 100k `<S>` | 40.1 ms | 39.5 ms (-1%) | 34.7 ms (-13%) |
| livesim2 real, 5,402 `<S>` | 1.38 ms | 1.43 ms (+3%) | 1.30 ms (-6%) |
| livesim2-scale synthetic | 1.36 ms | 1.42 ms (+4%) | 1.34 ms (-2%) |
| `bbb_30fps.mpd` | 0.032 ms | 0.034 ms (+5%) | 0.032 ms (0%) |

Three things follow. First, with #432 on `main` the tree is no longer where dash.js's time goes: removing
it while keeping every object and conversion `processNode` performs gains almost nothing. Second, the
headroom this API adds is 13 to 21 percent on the stress manifests and single digits on real-sized ones,
and it comes from the second pass's object shapes and the matcher chain, which a builder can drop and a
tree walk cannot. Third, the 2x that #424 asked for is not reachable by this API alone. Before #432 the
whole dash.js pipeline took 51.4 ms on the stress input. `main` takes 41.4 ms and the lean builder 32.9
ms, a 36 percent reduction from where the issue started, most of it from #432.

Two builders sharing one process, which is what an application with `parseXml` and one custom builder
does, cost each a few percent: `parseXml` and the lean builder land within about 6 percent of their
isolated medians on the large inputs.

The forced-GC run holds one unexplained result. With a full GC before every call and one variant per
process, the faithful builder runs 4 to 5 times slower on the 150 KB inputs and the lean builder 16 to 46
percent slower than today's pipeline on the small inputs, while `parseXml` is unaffected. The effect
disappears when the builder alternates with `parseXml` in one process, and `processNode`, which creates
the same object shapes, does not show it. It reads like V8 hidden-class or stub-cache churn from
dynamically shaped objects in an isolated process rather than a property of the scanner, but it is not
diagnosed. The implementation must measure it with `--trace-deopt` and the guide should recommend
creating each object with all of its fields present.

### Bundle size

`tsdown --minify`, `@svta/cml-utils` external, each entry bundled alone:

| Entry | Minified | Gzipped |
|---|---:|---:|
| `parseXml` on `main` (#432) | 3,797 B | 1,494 B |
| whole `@svta/cml-xml` on `main` | 4,301 B | 1,734 B |
| `parseXml` on the phase-one scanner | 5,004 B | 1,947 B |
| `buildXml` alone | 4,000 B | 1,640 B |
| whole package after phase one | 5,224 B | 2,012 B |

A `parseXml`-only bundle grows by about 450 bytes gzipped: the strict-mode branches, the NameStartChar
test, the quoted-literal doctype scan, the skip checks, and `XmlParseError` live in the shared scanner,
and the tree builder grows from four to eight variants. A `buildXml`-only bundle is about 150 bytes
gzipped larger than `parseXml` is on `main` today and carries no tree builder.

### Implementation notes

- The scanner takes primitives, the two stack arrays, and the builder object, and writes nothing back to
  a per-parse object. #432 established that shape because an object created per parse gets a fresh V8
  hidden class after every full GC, and the first reassignment of a field the constructor initialized
  deoptimizes every function compiled against it. `buildXml` keeps to it: the root goes into the stack,
  nothing else is allocated per parse.
- Every character read is guarded (`cc = ++pos < length ? input.charCodeAt(pos) : 0`), as on `main`.
- Builders should be module-level constants so the call targets inside the scanner are stable across
  parses. `parseXml` prebuilds its eight variants. Per-parse input goes through `options.root`, not
  through a closure.
- The scanner's callback slots are read once per scan into locals. Skipping is a `current !== undefined`
  check at each callback site.
- `this: void` on the callbacks needs `'@typescript-eslint/no-invalid-void-type': ['error',
  { allowAsThisParameter: true }]` in the repository's ESLint configuration.
- Module scope stays free of side effects: numeric constants, functions, and the prebuilt builders behind
  `/* @__PURE__ */`.

### Testing

The prototype's `equivalence.ts` passes 778 checks against `main` with 34 expected differences, all
accounted for by the eight corpus cases above (`plans/xml-incremental-parser/equivalence.md`). The
implementation carries them over:

1. The parity corpus and fixtures from #432, regenerated for exactly the eight cases, with three new cases
   for the grammar fixes.
2. `buildXml` tests. Every truncated corpus input throws `XmlParseError`, and every other input produces
   what `parseXml` produces. Root injection, the name arguments, skipping, the text policy, the CDATA
   fallback, the inner-text shapes, and the error fields each get a test.
3. The faithful dash.js builder compared `deepStrictEqual` to `parseXml` plus `processNode` on the
   fixtures and the synthetic manifests.
4. The benchmark from the prototype folded into `libs/xml/bench/`.

## Drawbacks

- Modest performance headroom: 13 to 21 percent for a lean dash.js builder on stress manifests and
  single digits on real ones, on top of #432. A reader who expected the 2x from #424 will not find it
  here. The RFC's case is the consumer-shaped output, the skip, and the strictness.
- Size for tree users: `parseXml`-only bundles grow by about 450 bytes gzipped, because the grammar
  fixes, the strict branches, and the error class sit in the shared scanner.
- `parseXml` output changes on eight corpus inputs. All are malformed or rare constructs, and two of them
  (`<!--->`, a comment cut off by the end of input) change shape as a consequence of inner-text delivery.
- Flattening builders depend on document order, which tree consumers never had to think about.
- Callbacks are harder to debug than a tree. A mistake in `appendChild` shows up as a wrong structure, not
  as an exception.
- Six parameters on `createElement` and three on the append callbacks. Most builders declare fewer, and
  the trailing ones cost the scanner nothing, but the type reads long.
- The forced-GC anomaly under Measured results is unexplained.

## Rationale and alternatives

A one-shot entry point now, incremental input later. The first draft made `write`/`end` the core. Review
found the carry rescanning quadratic for a long construct and a denial-of-service path on remote input,
found that `end()` had to become strict, and found the chunked benchmarks confounded by string
representation. All of that is streaming work. Meanwhile #432 had shipped the scanner and dash.js parses
complete strings, so `buildXml` is a small wrapper that delivers the contract today. The streaming design,
with the fixes review asked for, is recorded for a follow-up RFC.

SAX-style events cost the same to run as builder callbacks, but they leave the consumer to keep a stack to
know where it is. That bookkeeping is why dash.js chose a tree plus a second pass over its earlier X2JS
pipeline. Passing the parent's value into every callback removes the stack from the consumer, and it costs
the scanner one array it already keeps.

A pull parser, a cursor that the consumer advances as in `XmlReader`, quick-xml, or StAX, is resumable by
nature, but generators are slow in JavaScript and a cursor makes the API chatty for a manifest consumer.

A lazy tree that materializes attributes on access buys nothing when the consumer reads every `<S>`
immediately, which dash.js does, and it puts proxies or getters on the hot path.

`DOMParser` is unavailable in workers, dash.js moved off it for speed, and it produces a heavier tree than
the one this RFC removes.

One scanner for both entry points, with the grammar fixes applied to both. A compatibility mode that kept
`parseXml` mis-tokenizing processing instructions and doctypes would freeze known errors behind a flag.
Fixing a wrong check is a bug fix, so the fixes ship for both, and the eight corpus inputs that change are
listed rather than hidden.

Attributes as a record, not per-attribute callbacks. Per-attribute callbacks were prototyped in the first
draft. They force the consumer to create the element before it knows the attributes, which rules out
immutable objects and constructors that take them, and they gained a few percent on the stress input. The
`<S>` branch in the guide recovers most of that within the record contract.

Local name and prefix as arguments, and the name on the append callbacks. The scanner has all three on
hand: it finds the colon while scanning the name and keeps the names stack for close-tag checks. Passing
them costs nothing on the hot path and removes an `indexOf` or a discriminant field from every builder.
Trailing positions keep short builders valid.

Root injection over closures. A builder that needs per-parse input, a base URL or a logger or counters,
cannot close over it if the builder is a module-level constant, and module-level mutable state breaks the
moment two parses interleave. `options.root` supplies the per-parse value and `createDocument` becomes
optional.

Inner text for comments, doctypes, and CDATA. The first draft delivered comments with their delimiters
and doctypes with a leading `!` because `XmlNode` stores them that way. The builder layer exists to shape
output, and the tree builder can re-add what `XmlNode` expects. The price is two malformed-comment inputs
whose delimiters the tree builder can no longer reproduce.

Strict `buildXml`. A parser that a player points at a network response must not turn a truncated body
into a plausible partial manifest. `parseXml` keeps its tolerance because existing callers rely on it, and
the difference is one flag on the shared scanner.

No DASH-specific parsing in the parser. #424 asked for it as an option. The investigation measured 5.6
percent for `<S>` handling inside `parseXml`, and it would make attribute types depend on element names.
The builder puts that specialization in the player, where the schema is known.

Names. `createElement` and `appendChild` are DOM vocabulary that every web developer knows, and they say
what the consumer does: build. `startElement` and `endElement` describe what the parser saw. The DOM
names are proposed, and open (see Unresolved questions).

## Prior art

- expat's `XML_Parse(parser, buffer, length, isFinal)` reports complete constructs as they are seen and
  terminates the rest on the final call. The incremental follow-up will look like this.
- sax-js and saxes use `parser.write(chunk).close()` with `onopentag`, `onclosetag`, and `ontext`
  handlers. xml2js builds its tree on top of sax-js, which is the pattern this RFC lets consumers skip.
- htmlparser2 uses `parser.write(chunk)` and `parser.end()` with a handler object.
- tXml 6 accepts a `filter` callback during parsing and has `transformStream` for streamed nodes.
  `parseXml` derives from tXml.
- Pull parsers: .NET `XmlReader`, Java StAX, Rust `quick-xml`, Go `encoding/xml` `Decoder.Token`.
  Considered and not chosen (see Rationale and alternatives).
- Players: shaka-player's `TXml` builds a tree and walks it with `findChildren` and `parseAttr`. dash.js
  moved from X2JS over `DOMParser` to its own tXml port (dash.js PR 4180) and then to `@svta/cml-xml`
  (dash.js PR 4719), and kept the tree-then-walk pipeline throughout.
- This repository: `readIsoBoxes` takes a reader map that decides what each box becomes, and
  `WebVttParser` delivers cues through callbacks instead of a document.

## Unresolved questions

1. Names: `XmlBuilder` with `createElement` and `appendChild` (proposed), or `XmlHandlers` with
   `startElement` and `endElement`?
2. The entry point's name: `buildXml` (proposed), or a name that says "parse", such as `parseXmlWith`?
3. Skipping through `undefined` (proposed) or through a dedicated sentinel export, which would let
   `TElement` include `undefined`?
4. Whether `keepWhitespace` belongs on `XmlBuildOptions`, or builders should always receive every run and
   drop blanks themselves. Proposed: keep the option, since dropping blank runs in the scanner saves a
   slice and a call per run on pretty-printed manifests.
5. Whether the forced-GC anomaly is a property of the benchmark or of builders with dynamic shapes, which
   the implementation should settle with `--trace-deopt` before the guide gives advice on object shapes.

## Future possibilities

- Incremental input: `XmlParser` with `write` and `end` on the same scanner, with lexical progress kept
  across writes, a buffered-construct limit, strict `end()`, and comparable chunk benchmarks. Design
  notes under "Deferred: incremental input" in `plans/xml-incremental-parser/findings.md`.
- A HAM builder as the second reference consumer, exercising inheritance, fan-out to segments, and
  deferred completion, before any generic "objectify" builder.
- A Web Streams `XmlTransformer` once the incremental parser exists.

## Revision history

- 2026-09-02: initial draft, an incremental parser with `write` and `end`.
- 2026-09-02: review fixes (text accumulation in the Summary example, the completion rule for processing
  instructions, reproducible scripts in the design record) and a plain-language pass.
- 2026-09-03: reshaped after review. Incremental input is deferred to a follow-up RFC and `buildXml` is
  the one-shot entry point. The contract gains root injection, name arguments, skipping, untrimmed text,
  the CDATA fallback, inner-text shapes, `TElement`/`TDocument`, property syntax with `this: void`,
  `XmlParseError`, and strict end-of-input handling. Three grammar fixes land for both entry points, and
  the measurements are redone against `main` after #432 with an executable prototype.

## Final Decision

Pending community review.
