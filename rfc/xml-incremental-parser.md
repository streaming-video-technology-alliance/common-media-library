---
status: draft
---

# RFC: Incremental XML parser with consumer-defined builders

| | |
|---|---|
| **Author** | Casey Occhialini |
| **Date** | 2026-09-02 |
| **Package** | `@svta/cml-xml` |
| **Breaking change** | No |
| **Tracking** | [#424](https://github.com/streaming-video-technology-alliance/common-media-library/issues/424), [dash.js#4984](https://github.com/Dash-Industry-Forum/dash.js/issues/4984) |
| **Design record** | `plans/xml-incremental-parser/` |

## Summary

Add an incremental parser, `XmlParser`. It tokenizes XML and hands each element, text run, CDATA section, comment, and doctype to a *builder* that the consumer supplies. It assembles no `XmlNode` tree. The builder decides what an element becomes: whatever `createElement` returns is the parent that the element's children receive, and the child that `appendChild` receives when the element completes. A manifest parser can therefore produce its final objects in the single tokenization pass, with no intermediate tree and no second walk.

The parser takes input through `write(chunk)` and finishes with `end()`. The same object parses a whole string, a `fetch` body as it arrives, or a large string in slices between event-loop turns. `parseXml` keeps its signature and output, becomes one builder on top of the new scanner, and gets faster.

```ts
import { XmlParser, type XmlBuilder } from '@svta/cml-xml'

type Node = Record<string, unknown> & { tagName: string; children: Node[]; text?: string }

const builder: XmlBuilder<Node> = {
	createDocument: () => ({ tagName: '#document', children: [] }),
	createElement: (parent, name, attributes, localName) => ({ tagName: localName, children: [], ...attributes }),
	appendChild: (parent, child) => { parent.children.push(child) },
	appendText: (parent, text) => { parent.text = (parent.text ?? '') + text },
}

const document = new XmlParser(builder).write('<MPD><Period id="1"/></MPD>').end()
```

## Motivation

dash.js parses every DASH manifest with `parseXml` and then walks the tree a second time in `DashParser.processNode`. That pass converts attribute strings with its matchers, turns children into named properties and arrays, and attaches `tagName`, `__text`, and `__children`. On a live manifest with a dense `SegmentTimeline`, both passes run on the main thread at every refresh. [#424](https://github.com/streaming-video-technology-alliance/common-media-library/issues/424) measured about 30 ms for `parseXml` inside a 40 ms manifest parse on a 100,000 `<S>` stress manifest, and asked for a faster parser on dense self-closing elements.

The investigation for #424 (`plans/xml-parse-perf/`) bounded what any change inside `parseXml` can achieve. Tokenization is about two thirds of the cost and building `XmlNode` objects the remaining third. A flat, non-recursive rewrite with identical output gains 18 to 30 percent. A DASH-specific fast path for `<S>` gains 5.6 percent and breaks the contract that attribute values are strings. The 2x prototype that dash.js built did not tokenize any faster. It deleted their second pass and parsed `<S>` attributes as integers on the spot. This library can offer both only through an API that lets the consumer build its final structures while the scanner runs.

No existing extension point does this. `parseXml` returns one fixed shape, and its options only change what the tree contains. A consumer that wants a different shape has to build the tree and transform it, and that transform is the cost. The pattern repeats outside dash.js. shaka-player forks tXml, builds a tree, then walks it with `findChildren` and `parseAttr`. The cmaf-ham sample uses xml2js, a tree builder on top of the sax-js event parser. The PlayReady helpers in `@svta/cml-drm` call `parseXml` and `getElementsByName`. None of them want XML nodes.

The same design fixes two more problems of a whole-string synchronous parser. A 25 ms parse is one long task that delays input handling at every refresh, and on TV-class CPUs the same parse takes several times longer. And a manifest that is still downloading cannot be parsed until the last byte arrives, although tokenization could run behind the network.

## Guide-level explanation

### The builder contract

A builder is a plain object of functions. The parser calls `createDocument` once. Then it calls `createElement` for every start tag, with the value that the enclosing element's `createElement` returned as `parent`. Whatever `createElement` returns becomes the parent for that element's children, and `appendChild` receives it when the element completes.

```ts
export type XmlBuilder<T> = {
	createDocument(): T;
	createElement(parent: T, name: string, attributes: Record<string, string>, localName: string, prefix: string | null): T;
	appendChild?(parent: T, child: T): void;
	appendText?(parent: T, text: string): void;
	appendCdata?(parent: T, text: string): void;
	appendComment?(parent: T, text: string): void;
	appendDoctype?(parent: T, text: string): void;
};
```

`name` is the tag name as written (`tt:span`), `localName` the part after the prefix (`span`), and `prefix` the part before it (`tt`) or `null`. Without a prefix, `localName` is the same string as `name` and nothing extra is allocated. A builder that does not care about namespaces declares three parameters and ignores the rest.

`appendChild` runs when the child is complete, after all of the child's own children are appended, so it is post-order. A consumer that wants the child visible in the parent from the start attaches it inside `createElement`, since the parent is right there. Text arrives once per run, after the run ends at the next `<` or at `end()`, so a run split across chunks is still one call. Defining a handler opts in: without `appendComment`, the parser skips comments and never slices them out of the input.

### dash.js in one pass

This replaces `parseXml` plus `processNode`. No `XmlNode` is allocated. The objects created here are the ones the rest of the player consumes. In this example, `convert` replaces the dash.js matcher chain and `ARRAY_NODES` its `arrayNodes` list.

```ts
import { XmlParser, type XmlBuilder } from '@svta/cml-xml'

type DashNode = Record<string, unknown> & {
	tagName: string;
	__children: DashNode[];
	__text?: string;
	__prefix?: string;
};

const ARRAY_NODES = new Set(['Period', 'AdaptationSet', 'Representation', 'S', 'BaseURL', 'ContentProtection'])
const NUMERIC = /^[-+]?[0-9]+[.]?[0-9]*([eE][-+]?[0-9]+)?$/

function convert(tagName: string, key: string, value: string): unknown {
	return key !== 'id' && NUMERIC.test(value) ? parseFloat(value) : value
}

const dashBuilder: XmlBuilder<DashNode> = {
	createDocument: () => ({ tagName: '#document', __children: [] }),

	createElement(parent, name, attributes, localName, prefix) {
		if (localName === 'S') {
			// SegmentTimeline entry: a handful of integer attributes and no children.
			const node: DashNode = { tagName: 'S', __children: [] }
			const { t, d, r, k } = attributes
			if (t !== undefined) node['t'] = parseInt(t, 10)
			if (d !== undefined) node['d'] = parseInt(d, 10)
			if (r !== undefined) node['r'] = parseInt(r, 10)
			if (k !== undefined) node['k'] = parseInt(k, 10)
			return node
		}
		const node: DashNode = { tagName: localName, __children: [] }
		if (prefix !== null) {
			node.__prefix = prefix
		}
		for (const key in attributes) {
			node[key] = convert(localName, key, attributes[key])
		}
		return node
	},

	appendChild(parent, child) {
		parent.__children.push(child)
		const existing = parent[child.tagName]
		if (Array.isArray(existing)) {
			existing.push(child)
		}
		else if (ARRAY_NODES.has(child.tagName)) {
			parent[child.tagName] = [child]
		}
		else {
			parent[child.tagName] = child
		}
	},

	appendText(parent, text) {
		parent.__text = text
	},
}

export function parseManifest(manifestText: string): DashNode {
	const document = new XmlParser(dashBuilder).write(manifestText).end()
	return document['MPD'] as DashNode
}
```

The `<S>` branch is the DASH-specific fast path that #424 asked for. It belongs in the player, where the schema is known. The builder object is a module-level constant on purpose: the parser's call sites then see the same functions at every refresh, which keeps them monomorphic and inlinable (see Implementation notes). `appendText` keeps only the last text run of an element because `processNode` does the same today (`node.__text = child.nodeValue` for each text child). A builder that has to preserve mixed content accumulates instead, as the Summary example does.

### Feeding the parser

Whole string, as above: one `write`, then `end`.

Streaming from `fetch`, so tokenization runs while the manifest downloads:

```ts
import { XmlParser } from '@svta/cml-xml'

export async function parseManifestResponse(response: Response): Promise<DashNode> {
	const parser = new XmlParser(dashBuilder)
	await response.body!
		.pipeThrough(new TextDecoderStream())
		.pipeTo(new WritableStream({ write: chunk => { parser.write(chunk) } }))
	return parser.end()['MPD'] as DashNode
}
```

Slicing a string that is already in memory, so that no single task runs long:

```ts
import { XmlParser } from '@svta/cml-xml'

const SLICE = 256 * 1024

function yieldToEventLoop(): Promise<void> {
	const scheduler = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler
	return scheduler?.yield ? scheduler.yield() : new Promise(resolve => setTimeout(resolve))
}

export async function parseManifestInSlices(manifestText: string): Promise<DashNode> {
	const parser = new XmlParser(dashBuilder)
	for (let i = 0; i < manifestText.length; i += SLICE) {
		parser.write(manifestText.slice(i, i + SLICE))
		await yieldToEventLoop()
	}
	return parser.end()['MPD'] as DashNode
}
```

Chromium and Firefox ship `scheduler.yield()` and Safari does not, hence the `setTimeout` fallback. The total CPU time is the same as for the whole-string call (see Measured results). What changes is that the work is split into tasks short enough not to block input.

### `parseXml` becomes a builder

The existing function keeps its signature, options, and output. It stops owning a tokenizer:

```ts
import { XmlParser, type XmlBuilder, type XmlNode, type XmlParseOptions } from '@svta/cml-xml'

function textNode(nodeName: string, nodeValue: string): XmlNode {
	return { nodeName, nodeValue, attributes: {}, childNodes: [] }
}

const xmlNodeBuilder: XmlBuilder<XmlNode> = {
	createDocument: () => ({ nodeName: '#document', nodeValue: null, childNodes: [], attributes: {} }),
	createElement: (parent, name, attributes, localName, prefix) => ({ nodeName: name, nodeValue: null, attributes, childNodes: [], prefix, localName }),
	appendChild: (parent, child) => { parent.childNodes.push(child) },
	appendText: (parent, text) => { parent.childNodes.push(textNode('#text', text)) },
	appendCdata: (parent, text) => { parent.childNodes.push(textNode('#cdata', text)) },
	appendDoctype: (parent, text) => { parent.childNodes.push(textNode('#doctype', text)) },
}

export function parseXml(input: string, options: XmlParseOptions = {}): XmlNode {
	return new XmlParser(xmlNodeBuilder, options).write(input).end()
}
```

`keepComments` selects a builder variant that defines `appendComment`. `includeParentElement` selects a variant that sets `parentElement` inside `createElement` and the text handlers. Both stay internal to `parseXml`.

## Reference-level explanation

### Public API

Three additions to `@svta/cml-xml`. No existing signature changes.

```ts
export type XmlParserOptions = {
	keepWhitespace?: boolean;
};

export type XmlBuilder<T> = {
	createDocument(): T;
	createElement(parent: T, name: string, attributes: Record<string, string>, localName: string, prefix: string | null): T;
	appendChild?(parent: T, child: T): void;
	appendText?(parent: T, text: string): void;
	appendCdata?(parent: T, text: string): void;
	appendComment?(parent: T, text: string): void;
	appendDoctype?(parent: T, text: string): void;
};

export class XmlParser<T> {
	constructor(builder: XmlBuilder<T>, options?: XmlParserOptions);
	write(chunk: string): this;
	end(): T;
}
```

`T` is inferred from the builder. `write` returns the parser, so the one-shot form reads `new XmlParser(b).write(s).end()`.

### Callback semantics

- The parser calls `createDocument` once, in the constructor. Its result is the parent of every top-level element, text run, doctype, and comment, and `end()` returns it.
- The parser calls `createElement(parent, name, attributes, localName, prefix)` when it has read a start tag completely, before any of the element's content. `name` is the tag name as written. `localName` and `prefix` split it at the first colon. Without a colon, `localName === name` and `prefix === null`. `attributes` is a fresh object per element with values already entity-decoded. The consumer owns it and may keep or mutate it. Malformed attributes are errors, exactly as in `parseXml` since #430.
- The parser calls `appendChild(parent, child)` when the element completes: at its close tag, directly after `createElement` for a self-closing tag, or during `end()` for an element the input never closed. Siblings complete in document order, so post-order appends preserve child order.
- The parser calls `appendText(parent, text)` once per text run, when the run completes. With `keepWhitespace` unset (the default), the text is entity-decoded and trimmed, and runs that are empty after trimming are not delivered. With `keepWhitespace: true`, the text is entity-decoded and delivered as is when non-empty. Text at document level goes to the document value.
- `appendCdata(parent, text)` receives the raw content between `<![CDATA[` and `]]>`, not decoded.
- `appendComment(parent, text)` receives the whole comment including `<!--` and `-->`, the same value as the `#comment` node that `parseXml` produces with `keepComments`. Without the handler, the parser skips comments.
- `appendDoctype(parent, text)` receives the text from `!` to before the closing `>`, and honors a bracketed internal subset. This is the same value as a `#doctype` node.
- The parser skips the XML declaration and processing instructions, as today.
- Builder functions must not call `write` or `end` on the parser that is invoking them.

### Incremental tokenization

`write(chunk)` prepends the tail carried from the previous call, if any, and scans the result in streaming mode: a construct is consumed only when it is complete. Complete means:

- the closing `>` of a start tag as found by the attribute scanner (a `>` inside a quoted value does not count),
- the `>` of a close tag,
- the next `>` for a declaration or processing instruction (`parseXml` does not look for `?>`, so a `>` inside processing-instruction data ends the construct today, and that stays),
- `-->` for a comment,
- `]]>` for CDATA,
- the `>` outside `[...]` for a doctype,
- the next `<` for a text run.

The first incomplete construct stops the scan. Everything from its start is carried into the next `write`.

`end()` scans the carry in final mode, where the end of input terminates every construct exactly as `parseXml` treats a truncated document today. It then completes still-open elements from the innermost outwards through `appendChild`, and returns the document value.

One scanner runs both modes. So `new XmlParser(b).write(s).end()` produces the same callbacks as feeding `s` in any split, and `parseXml(s)` on the new scanner produces the same tree as today. Both were verified on the prototype (see Testing).

The carry is bounded by the size of one construct: one tag, one text run, one comment. In a manifest that is a few dozen bytes. On the 3.7 MB stress manifest split in 64 KB chunks, the largest carry was 30 characters. A construct that spans many chunks is rescanned from its start on each `write`. A document with a multi-megabyte text node therefore still parses correctly but costs more than a whole-string parse. That shape does not occur in manifests, so the RFC notes it and does not optimize for it.

The grammar does not change in this RFC. Whatever `parseXml` accepts or rejects when the implementation lands, `XmlParser` accepts or rejects identically, because there is one scanner. [#430](https://github.com/streaming-video-technology-alliance/common-media-library/pull/430) merged after the prototype was measured. It makes malformed attributes throw, requires close tags to match exactly (`<a></ab>` no longer closes `<a>`), and rejects a close tag at document level. The prototype mirrors the parser before #430, and the equivalence corpus will be recaptured against `main` when the implementation starts.

### Errors and lifecycle

One instance parses one document. `write` after `end`, `end` twice, or any call after the parser has thrown, throws an `Error` whose message names the method and the state (`XmlParser.write() called after end()`).

A mismatched close tag throws from whichever of `write` or `end` meets it. When the text being scanned starts at document offset zero, the message keeps today's `Unexpected close tag` text and its `Line`, `Column`, and `Char` fields. That is always the case for `parseXml`, and for an error inside the first chunk. The message always ends with an `Offset` line that gives the absolute character offset. When the failing text does not start at offset zero, line and column are left out, because they would be relative to a chunk boundary. Counting newlines across all consumed chunks would put a measurable cost on the hot path for a debugging aid.

Some errors depend on seeing the end of the input: a quoted value that never closes, and an attribute cut off by the end of the input. Both can only be raised in final mode, since the missing text might be in the next chunk, so `end()` throws them.

After a throw the instance is unusable. The builder's partially built structures are whatever the callbacks produced up to that point. The parser does not roll them back.

### Interaction with the existing API

`parseXml` is reimplemented on the new scanner with four prebuilt tree builders (`keepComments` x `includeParentElement`). It produces identical output for every input and option set in the equivalence corpus. The `pos` option starts the scan at `pos` on the full input, through an internal entry point, so the message for a mismatched close tag keeps whole-document line and column. Slicing the input would lose them. The only observable change for `parseXml` callers is the added `Offset` line in that message.

`getElementsByName`, `serializeXml`, `XmlNode`, and `XmlParseOptions` are unchanged. `XmlParserOptions` carries only `keepWhitespace`. `keepComments` and `includeParentElement` are tree concerns and stay on `XmlParseOptions`.

Two things improve for free. Nesting depth is no longer limited by the call stack, because the element stack is explicit. The termination fixes for truncated input (#425 and #430) apply to both entry points, because there is one scanner.

### Measured results

The numbers below come from the prototype. `plans/xml-incremental-parser/benchmark.md` has the harness, the full tables, and the forced-GC run. Each variant ran in its own process: 4 warm-up calls, then 60 measured calls on the large inputs and 300 or 3,000 on the small ones. The tables show medians of natural-GC runs on Node 24.16, on an M1 Pro on battery in Low Power Mode. Treat the absolute numbers as indicative. The relative numbers are the result.

Three labels recur below. "dash.js today" is the shipped `parseXml` plus a faithful port of `processNode`. "One pass" is the builder from the guide without the `<S>` branch, with the same per-node logic as `processNode`. "One pass, specialized" adds the `<S>` branch and a `Set` for the array-node lookup.

The tree path: `parseXml` on the new scanner against the shipped parser, whole string and in 64 KB chunks.

| Input | Shipped `parseXml` | On `XmlParser` | On `XmlParser`, 64 KB chunks |
|---|---:|---:|---:|
| pretty `/>`, 100k `<S>`, 3.7 MB | 28.3 ms | 20.1 ms (-29%) | 17.9 ms (-37%) |
| minified `/>`, 100k `<S>`, 2.6 MB | 23.6 ms | 17.8 ms (-25%) | 15.7 ms (-34%) |
| pretty `</S>`, 100k `<S>`, 3.9 MB | 30.3 ms | 22.3 ms (-27%) | 19.7 ms (-35%) |
| livesim2 real, 5,402 `<S>`, 170 KB | 1.29 ms | 0.84 ms (-35%) | 0.83 ms (-36%) |
| livesim2-scale synthetic, 148 KB | 1.16 ms | 0.73 ms (-37%) | 0.73 ms (-37%) |
| `bbb_30fps.mpd`, 3 KB | 0.023 ms | 0.015 ms (-35%) | 0.015 ms (-33%) |

The dash.js pipeline: the manifest object as `processXml` produces it today, against the one-pass builders.

| Input | dash.js today | One pass | One pass, specialized | Specialized, 64 KB chunks |
|---|---:|---:|---:|---:|
| pretty `/>`, 100k `<S>` | 51.4 ms | 34.8 ms (-32%) | 29.0 ms (-44%) | 26.6 ms (-48%) |
| minified `/>`, 100k `<S>` | 47.5 ms | 29.7 ms (-38%) | 24.5 ms (-49%) | 23.4 ms (-51%) |
| pretty `</S>`, 100k `<S>` | 54.0 ms | 37.1 ms (-31%) | 30.7 ms (-43%) | 28.2 ms (-48%) |
| livesim2 real, 5,402 `<S>` | 1.93 ms | 1.31 ms (-32%) | 1.14 ms (-41%) | 1.15 ms (-40%) |
| livesim2-scale synthetic | 1.90 ms | 1.37 ms (-28%) | 1.25 ms (-34%) | 1.24 ms (-35%) |
| `bbb_30fps.mpd` | 0.039 ms | 0.032 ms (-18%) | 0.031 ms (-20%) | 0.031 ms (-20%) |

Three more rows from the same run bound the design. Tokenizing the pretty stress input with attribute records but no tree takes 17.4 ms, and with neither records nor tree 14.7 ms. So the records cost about 3 ms and the tree builder about 3 ms on top of them. The per-attribute callback variant of the dash.js build measured 29.6 ms against 29.0 ms for the specialized record-based builder, which is why the RFC does not propose it. Chunked input costs nothing measurable once the joined string is flat. On the large inputs it came out slightly faster than the single write, most likely because a scanner entered once per chunk gets optimized code sooner than one entered once per document.

A player sits between manifest refreshes with full GCs in between, so the forced-GC run matters. With a forced full GC before every parse, the new scanner keeps its lead over the shipped parser on every input. On the manifest-sized inputs it stays within about ten percent of its natural-GC time (0.92 ms against 0.84 ms on the livesim2 manifest). That holds only because the scanner keeps no per-parse state. The earlier prototype, which kept state on the instance, took 6 ms in that regime. See Implementation notes and the forced-GC tables in the design record.

### Bundle size

Measured with the repository's bundler (`tsdown --minify`, `@svta/cml-utils` external), on the prototype JavaScript, not the TypeScript build:

| Bundle | Minified | Gzipped |
|---|---:|---:|
| `parseXml` today | 2,372 B | 1,109 B |
| Whole `@svta/cml-xml` today | 2,873 B | 1,347 B |
| `XmlParser` alone | 3,856 B | 1,479 B |
| `XmlParser` plus the `parseXml` builder | 4,724 B | 1,810 B |

An adopter that only imports `parseXml` pays about 2.4 KB minified, 700 bytes gzipped, more than today. An adopter that imports only `XmlParser` pays about 370 bytes gzipped more than `parseXml` costs today, and drops the tree. Tree-shaking between the two is preserved: the tree builders live in `parseXml.ts` and are not reachable from `XmlParser`.

### Implementation notes

These findings from the prototype must survive the port. Each was worth double-digit percentages, and two of them only show up under conditions that a benchmark loop does not create by default.

- The scanner takes no per-parse object. One module-level `scan` function holds the tokenizer. It receives only primitives, the two stack arrays, and a literal-created slots object, returns the consumed count, and never reads or writes the `XmlParser` instance. The reason is how V8 treats objects that are created per parse. V8 tracks field constness per hidden class, and hidden-class transitions are weak, so an instance created per parse gets a fresh hidden class after every full GC. The first reassignment of a field that the constructor initialized then deoptimizes every function compiled against that class. With state on the instance, the prototype's whole-string parse of the 170 KB livesim2 manifest took about 6 ms after each forced full GC, against 0.9 ms with natural GC, because the scanner never kept optimized code and was re-tiered from the interpreter at every parse. With the scanner isolated it takes 0.8 ms in both regimes. The open-element stack holds the current element at its top, so there is nothing to write back. `write` and `end` do touch the instance, and they are cold.
- Never read past the end of the input. `charCodeAt` one past the end returns `NaN`. Once the scanner's character variable has held `NaN`, V8 compiles every comparison on it as a floating-point compare for the rest of the process. Whole-string parsing hits that once per document, chunked parsing once per chunk. Guarding every advance (`cc = ++pos < length ? input.charCodeAt(pos) : 0`) made whole-string tokenization about 19 percent faster and removed a 2x penalty on chunked input.
- Join flat. The carry and the next chunk are joined with `[carry, chunk].join('')`, not `+`. Concatenation yields a rope (a V8 `ConsString`) that the scanner read about 25 percent slower even after the one-time flatten. `join` yields a flat sequential string.
- Give the slots object a fixed shape. The constructor copies the builder's callbacks into an object literal, so the loads in `scan` see one hidden class whatever builder is in use. Before this and the state isolation above, a benchmark that drove one scanner with a dozen different builder objects in one process ran 30 to 65 percent slower than the shipped parser, while the same code with one builder per process was faster. With the final structure, the interleaved run keeps the relative ordering of the per-process run. Adopters normally have one or two builders in a bundle, but the normalization is free.
- Builders should be module-level constants so the call targets stay stable across parses. `parseXml` prebuilds its four variants.
- `unescapeHtml` runs only when the scan of the run or value saw an `&`.
- Module scope stays free of side effects: numeric constants and functions only.

### Testing

Four layers, all exercised on the prototype (`plans/xml-incremental-parser/equivalence.md`):

1. Parity. An equivalence corpus of about 60 inputs, parsed with six option sets and compared `deepStrictEqual` against recorded output of the shipped parser. The corpus has synthetic manifests in three forms, both fixtures, the real livesim2 manifest, and hand-written edge cases for entities, CDATA, comments, doctype, namespaces, whitespace, truncation, and malformed attributes.
2. Boundary sweep. A recording builder turns callbacks into an event log. Each corpus input is written whole and then split at every character position (small inputs) or at hundreds of sampled positions (large inputs), in three parts, and one character at a time. The logs and the trees must be identical. Errors compare by first line and absolute offset.
3. Termination. Inputs that hang the shipped parser terminate with the hang-fix structure. The tests run under a worker timeout, so a regression fails instead of hanging CI.
4. dash.js pipeline. The one-pass builder from the guide is a test and the TSDoc example. Its output, with and without the `<S>` branch and with chunked input, is compared to a faithful port of `parseXml` plus `processNode` on the synthetic manifests, the fixtures, and the livesim2 manifest.

The prototype passed 8,157 checks with one expected difference: the `pos` error-message column described above, which the implementation avoids by not slicing.

## Drawbacks

- Surface area: a stateful class and two types land in a package that has been three functions. The incremental contract justifies the shape, but it is a different style from the rest of `@svta/cml-xml`.
- Size for tree users: `parseXml`-only adopters pay about 700 bytes gzipped more. The alternative, the recursive tokenizer under `parseXml` and a second one for `XmlParser`, costs every adopter that uses both more than that and leaves two tokenizers to maintain.
- Debugging: callbacks are harder to debug than a tree. A consumer carries its own state through return values, and a mistake in `appendChild` shows up as a wrong structure, not as an exception.
- Per-write cost: each `write` joins the carry with the chunk and rescans any construct that straddled the boundary. On manifests this is within noise (see Measured results). Pathological documents with huge single constructs pay more.
- Error message change: the `Offset` line is additive and nobody should parse error messages, but it is an observable change to `parseXml`.
- The floor stays: attribute records are still allocated per element. They are inherent to `Record<string, string>` in the contract. The measured alternative is discussed below.
- Five parameters on `createElement`: most builders will declare three. The two extra ones exist because the tokenizer already knows where the colon is, and passing the parts measured 2 to 5 percent faster on the tree path than an `indexOf` in the builder. They are also simpler to consume.

## Rationale and alternatives

SAX-style events cost the same to run as builder callbacks, but they leave the consumer to keep a stack to know where it is. That bookkeeping is exactly why dash.js chose a tree plus a second pass over its earlier X2JS pipeline. Passing the parent's value into every callback removes the stack from the consumer, and it costs the parser one array it already needs.

A pull parser, a cursor that the consumer advances as in `XmlReader`, quick-xml, or StAX, is trivially resumable. But generators are slow in JavaScript, and a reusable cursor makes the API chatty for a manifest consumer. The incremental `write`/`end` design gives the same scheduling freedom without either.

A lazy tree that materializes attributes on access buys nothing when the consumer reads every `<S>` immediately, which dash.js does, and it puts proxies or getters on the hot path.

`DOMParser` is unavailable in workers, dash.js moved off it for speed, and it produces a heavier tree than the one this RFC removes.

A whole-string one-pass call plus an async variant was the cheaper design to build. An incremental parser is resumable by construction and gives time-slicing as a two-line pattern, and a whole-string API can never give chunked input. Boundary handling is one rule in a flat scanner, and once the joined string is flat it costs nothing measurable.

One tokenizer under both entry points means the tree path gets the flat-rewrite speedup, the hang fixes land once, and adopters that use both pay for one scanner. The price is the size for tree-only users, stated above.

Per-attribute callbacks (`attribute(element, name, value)`) were prototyped and measured (see Measured results). They save the record allocation and the keyed stores. But they are incompatible with the carry model as written. A tag split across chunks is rescanned from its start, which would call `createElement` twice, so supporting them needs a completeness pre-scan of every tag before any callback fires. They also force the consumer to create the element before it knows the attributes, which rules out immutable objects and constructors that take the attributes. The specialized `<S>` branch in the guide recovers most of the same gain within the record contract, so the RFC does not propose the callback mode.

Local name and prefix are arguments because the tokenizer finds the colon while it scans the name. Passing the parts costs two slices per namespaced element, which manifests barely have, and saves an `indexOf` on every element in the builder. It measured 2 to 5 percent faster on the tree path, and the consumer code is simpler. The parameters come last, so builders that do not care declare three.

A class was chosen over a closure factory because `WebVttParser` is the existing precedent for a stateful parser object in this repository, and a class makes the `write`/`end` lifecycle explicit. Performance does not decide this one. The hot path is a module-level function either way, and the GC interaction that matters (see Implementation notes) is about where the scanner keeps its state. The #424 investigation attributed a forced-GC penalty to per-call closures. That measurement came from an interleaved harness and does not reproduce with one variant per process.

DASH-specific parsing inside the parser is what #424 asked for as an option. The investigation measured 5.6 percent for `<S>` handling inside `parseXml`, and it would make attribute types depend on element names. The builder puts the same specialization in the player, where the schema is known, and there it is worth far more (see the specialized columns under Measured results).

Worker offload belongs to the player. Cloning a 100,000-node tree back to the main thread costs about as much as parsing it, so offload only pays when the consumer's transform also runs in the worker. The parser has no DOM dependency and works in a worker if a player chooses that.

The names `createElement` and `appendChild` are DOM vocabulary that every web developer knows, and they say what the consumer does: build. `startElement` and `endElement` (SAX) describe what the parser saw. The DOM names are proposed (see Unresolved questions).

## Prior art

- expat's `XML_Parse(parser, buffer, length, isFinal)` has the same contract as `write` and `end`: complete constructs are reported as they are seen, and the final call terminates whatever is left.
- sax-js and saxes use `parser.write(chunk).close()` with `onopentag`, `onclosetag`, and `ontext` handlers. xml2js builds its tree on top of sax-js, which is the pattern this RFC lets consumers skip.
- htmlparser2 uses `parser.write(chunk)` and `parser.end()` with a handler object.
- tXml 6 has `transformStream` and `transformWebStream`, which emit parsed nodes at a chosen depth as a stream, and its `parse` accepts a `filter` callback during parsing. `parseXml` derives from tXml.
- Node.js `StringDecoder` and `crypto.Hash` use `write`/`end` and `update`/`digest`, the incremental idiom this API follows.
- Pull parsers: .NET `XmlReader`, Java StAX, Rust `quick-xml`, Go `encoding/xml` `Decoder.Token`. Considered and not chosen (see Rationale and alternatives).
- Players: shaka-player's `TXml` builds a tree and walks it with `findChildren` and `parseAttr`. dash.js moved from X2JS over `DOMParser` to its own tXml port (dash.js PR 4180) and then to `@svta/cml-xml` (dash.js PR 4719), and kept the tree-then-walk pipeline throughout.
- This repository: `WebVttParser` is a class with `parse(chunk)` and `flush()` and `on*` callback properties, and `WebVttTransformer` wraps it as a Web Streams transformer. `readIsoBoxes` takes a reader map that decides what each box becomes.

## Unresolved questions

1. Names: `XmlBuilder` with `createElement` and `appendChild` (proposed), or `XmlHandlers` with `startElement` and `endElement`?
2. Class or factory: `new XmlParser(builder)` (proposed, matches `WebVttParser`), or `createXmlParser(builder)` (matches `createFetchTransport`)? Performance is equal as long as the scanner is module-level.
3. A Web Streams wrapper: ship an `XmlTransformer` next to the parser, mirroring `WebVttTransformer`, or leave `pipeTo(new WritableStream(...))` as the documented pattern? Proposed: leave it out until someone asks.
4. The whitespace option: does `keepWhitespace` belong on `XmlParserOptions`, or should `appendText` always receive the raw run and let the builder trim? Proposed: keep the option. Trimmed non-empty text is what almost every consumer wants, and `parseXml` needs the same rule.
5. Processing instructions: add `appendProcessingInstruction`? `parseXml` skips them today. Proposed: not in this RFC.
6. Error type: a plain `Error` with an `Offset` line (proposed, matches today), or an `XmlParseError` subclass with an `offset` field?

## Future possibilities

- An `XmlTransformer` for `TransformStream` pipelines.
- A generic "objectify" builder in `@svta/cml-dash` (named properties, configurable array elements, converted attributes), so players get an MPD object without writing a builder.
- An `offset` accessor on the parser, for progress reporting during streamed parses.
- Guidance and a sample for running the builder in a worker and transferring compact structures back.

## Revision history

- 2026-09-02: initial draft.
- 2026-09-02: review fixes (text accumulation in the Summary example, the completion rule for processing instructions, reproducible scripts in the design record). #430 merged, so the parity notes now describe `main`. Plain-language pass over the prose.

## Final Decision

Pending community review.
