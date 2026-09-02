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

Add an incremental parser, `XmlParser`, that tokenizes XML and hands each element, text run, CDATA section, comment, and doctype to a consumer-supplied *builder* instead of assembling an `XmlNode` tree. The builder decides what an element becomes: whatever `createElement` returns is what the element's children receive as their parent and what `appendChild` receives when the element completes. A manifest parser can therefore produce its final objects in the single tokenization pass, with no intermediate tree and no second walk.

The parser is fed with `write(chunk)` and finished with `end()`, so the same object parses a whole string, a `fetch` body as it arrives, or a large string in slices between event-loop turns. `parseXml` keeps its signature and output and becomes one builder on top of the new core, and gets faster in the process.

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

dash.js parses every DASH manifest with `parseXml` and then walks the resulting tree a second time in `DashParser.processNode`, converting attribute strings with its matchers, turning children into named properties and arrays, and attaching `tagName`, `__text`, and `__children`. On a live manifest with a dense `SegmentTimeline` both passes run on the main thread on every refresh. [#424](https://github.com/streaming-video-technology-alliance/common-media-library/issues/424) measured about 30 ms for `parseXml` inside a 40 ms manifest parse on a 100,000 `<S>` stress manifest and asked for the parser to get faster on dense self-closing elements.

The investigation for #424 (`plans/xml-parse-perf/`) bounded what any change inside `parseXml` can achieve. Tokenization is about two thirds of the cost and building `XmlNode` objects the remaining third. A flat, non-recursive rewrite with identical output gains 18 to 30 percent. A DASH-specific fast path for `<S>` measured 5.6 percent and would break the contract that attribute values are strings. The 2x that dash.js prototyped did not come from tokenizing faster; it came from deleting their own second pass and parsing `<S>` attributes as integers on the spot. Both of those are only reachable from this library through an API that lets the consumer build its final structures while the tokenizer runs.

No existing extension point does this. `parseXml` returns one fixed shape, and its options only toggle what the tree contains. Consumers that want a different shape must build the tree and transform it, which is the cost. The same pattern repeats outside dash.js: shaka-player forks tXml, builds a tree, then walks it with `findChildren` and `parseAttr`; the cmaf-ham sample uses xml2js, a tree builder on top of the sax-js event parser; the PlayReady helpers in `@svta/cml-drm` call `parseXml` and `getElementsByName`. None of them want XML nodes.

Two further problems come with a whole-string synchronous parser and are addressed by the same design. A 25 ms parse is one long task that delays input handling on every refresh, and on TV-class CPUs the same parse is several times longer. And a manifest that is still downloading cannot be parsed until the last byte arrives, even though tokenization could run behind the network.

## Guide-level explanation

### The builder contract

A builder is a plain object of functions. The parser calls `createDocument` once, then `createElement` for every start tag with the value the enclosing element's `createElement` returned as `parent`. Whatever `createElement` returns becomes the parent for that element's children and is passed to `appendChild` when the element completes.

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

`name` is the tag name as written (`tt:span`), `localName` the part after the prefix (`span`) and `prefix` the part before it (`tt`) or `null`. When there is no prefix, `localName` is the same string as `name` and nothing extra is allocated. A builder that does not care about namespaces declares three parameters and ignores the rest.

`appendChild` runs when the child is complete, after all of the child's own children have been appended, so it is post-order. A consumer that wants the child visible in the parent from the start attaches it inside `createElement` instead, since the parent is right there. Text arrives once per run, after the run ends at the next `<` or at `end()`, so a run split across chunks is still one call. Presence of a handler opts in: without `appendComment`, comments are skipped without being sliced out of the input.

### dash.js in one pass

This replaces `parseXml` plus `processNode`. No `XmlNode` is allocated; the objects created here are the ones the rest of the player consumes. `convert` stands in for the dash.js matcher chain and `ARRAY_NODES` for its `arrayNodes` list.

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

The `<S>` branch is the DASH-specific fast path that #424 asked for. It belongs here, in the player, where the schema is known, rather than in a generic XML parser. The builder object is a module-level constant on purpose: the parser's call sites then see the same functions on every refresh, which keeps them monomorphic and inlinable (see Implementation notes). `appendText` keeps only the last text run of an element because that is what `processNode` does today (`node.__text = child.nodeValue` for each text child); a builder that has to preserve mixed content accumulates instead, as the Summary example does.

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

Slicing a string that is already in memory so that no single task runs long:

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

`scheduler.yield()` is available in Chromium and Firefox and not in Safari as of this writing, hence the `setTimeout` fallback. The total CPU spent is the same as the whole-string call (see Measured results); what changes is that the work is split into tasks short enough not to block input.

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

`keepComments` selects a builder variant that defines `appendComment`, and `includeParentElement` a variant that sets `parentElement` inside `createElement` and the text handlers. Both stay internal to `parseXml`.

## Reference-level explanation

### Public API

Three additions to `@svta/cml-xml`. Nothing existing changes signature.

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

`T` is inferred from the builder. `write` returns the parser so the one-shot form reads `new XmlParser(b).write(s).end()`.

### Callback semantics

- `createDocument` is called once, in the constructor. Its result is the parent of every top-level element, text run, doctype, and comment, and is what `end()` returns.
- `createElement(parent, name, attributes, localName, prefix)` is called when a start tag has been read completely, before any of the element's content. `name` is the tag name as written. `localName` and `prefix` split it at the first colon; without a colon `localName === name` and `prefix === null`. `attributes` is a fresh object per element with values already entity-decoded; the consumer owns it and may keep or mutate it. Malformed attributes are handled exactly as `parseXml` handles them at the time: an empty string on `main` today, an error once #430 lands.
- `appendChild(parent, child)` is called when the element completes: at its close tag, immediately after `createElement` for a self-closing tag, or during `end()` for an element the input never closed. Siblings complete in document order, so post-order appends preserve child order.
- `appendText(parent, text)` is called once per text run when the run completes. With `keepWhitespace` unset (the default), the text is entity-decoded and trimmed, and runs that are empty after trimming are not delivered. With `keepWhitespace: true`, the text is entity-decoded and delivered as is when non-empty. Text at document level goes to the document value.
- `appendCdata(parent, text)` receives the raw content between `<![CDATA[` and `]]>`, not decoded.
- `appendComment(parent, text)` receives the whole comment including `<!--` and `-->`, matching the `#comment` node value `parseXml` produces with `keepComments`. Absent handler, comments are skipped.
- `appendDoctype(parent, text)` receives the text from `!` to before the closing `>`, honoring a bracketed internal subset, matching `#doctype` nodes.
- The XML declaration and processing instructions are skipped, as today.
- Builder functions must not call `write` or `end` on the parser that is invoking them.

### Incremental tokenization

`write(chunk)` prepends the carried tail from the previous call, if any, and scans the result in streaming mode: a construct is consumed only when it is complete. Complete means the closing `>` of a start tag as found by the attribute scanner (a `>` inside a quoted value does not count), the `>` of a close tag, the next `>` for a declaration or processing instruction (`parseXml` does not look for `?>`, so a `>` inside processing-instruction data ends the construct today, and that is preserved), `-->` for a comment, `]]>` for CDATA, the `>` outside `[...]` for a doctype, and the next `<` for a text run. The first incomplete construct stops the scan; everything from its start is carried into the next `write`.

`end()` scans the carry in final mode, where the end of input terminates every construct exactly as `parseXml` treats a truncated document today, then completes still-open elements from the innermost outwards through `appendChild`, and returns the document value.

Because one scanner runs both modes, `new XmlParser(b).write(s).end()` produces the same callbacks as feeding `s` in any split, and `parseXml(s)` on the new core produces the same tree as today. Both were verified on the prototype, see Testing.

The carry is bounded by the size of one construct: one tag, one text run, one comment. In a manifest that is a few dozen bytes; on the 3.7 MB stress manifest split in 64 KB chunks the largest carry was 30 characters. A construct that spans many chunks is rescanned from its start on each `write`, so a document with a multi-megabyte text node still parses correctly but costs more than a whole-string parse; that shape does not occur in manifests and is called out rather than optimized.

The grammar is not changing in this RFC: whatever `parseXml` accepts or rejects when the implementation lands, `XmlParser` accepts or rejects identically, because there is one scanner. On `main` today that includes two tolerance quirks, a close tag at document level ends the parse and ignores the rest of the input, and the close-tag check is a prefix comparison (`<a></ab>` closes `<a>`). [#430](https://github.com/streaming-video-technology-alliance/common-media-library/pull/430) turns both into errors and makes malformed attributes throw; the prototype mirrors `main`, and the equivalence corpus is recaptured against whichever behavior has landed when the implementation starts.

### Errors and lifecycle

One instance parses one document. `write` after `end`, `end` twice, or any call after the parser has thrown, throws an `Error` whose message names the method and the state (`XmlParser.write() called after end()`).

A mismatched close tag throws from whichever of `write` or `end` encounters it. The message keeps today's `Unexpected close tag` text and its `Line`, `Column`, and `Char` fields when the text being scanned starts at document offset zero, which is always the case for `parseXml` and for an error inside the first chunk, and always appends an `Offset` line with the absolute character offset. Line and column are omitted when the failing text does not start at offset zero, because they would be relative to a chunk boundary; counting newlines across all consumed chunks would put a measurable cost on the hot path for a debugging aid.

Errors that depend on seeing the end of the input, a quoted value that never closes today and any attribute cut off by the end of input once #430 lands, can only be raised in final mode, since the missing text might be in the next chunk, so they are thrown from `end()`.

After a throw the instance is unusable. The builder's partially built structures are whatever the callbacks produced up to that point; the parser does not roll them back.

### Interaction with the existing API

`parseXml` is reimplemented on the new core with four prebuilt tree builders (`keepComments` x `includeParentElement`) and produces identical output for every input and option set in the equivalence corpus. The `pos` option is honored by starting the scan at `pos` on the full input through an internal entry point rather than slicing, so the error message for a mismatched close tag keeps whole-document line and column. The only observable change for `parseXml` callers is the added `Offset` line in that message.

`getElementsByName`, `serializeXml`, `XmlNode`, and `XmlParseOptions` are unchanged. `XmlParserOptions` carries only `keepWhitespace`; `keepComments` and `includeParentElement` are tree concerns and stay on `XmlParseOptions`.

Two things improve for free. Nesting depth is no longer limited by the call stack, because the element stack is explicit. The termination fixes for truncated input (#425 and #430) apply to both entry points because there is one scanner.

### Measured results

Prototype numbers (`plans/xml-incremental-parser/benchmark.md` has the harness, the full tables, and the forced-GC run). Each variant ran in its own process, 4 warm-up calls, then 60 measured calls on the large inputs and 300 or 3000 on the small ones; medians of natural-GC runs. Node 24.16 on an M1 Pro on battery in Low Power Mode, so absolute numbers are indicative and the relative numbers are the point. "dash.js today" is the shipped `parseXml` plus a faithful port of `processNode`; "one pass" is the builder from the guide without the `<S>` branch (same per-node logic as `processNode`); "one pass, specialized" adds the `<S>` branch and a `Set` for the array-node lookup.

**Tree path.** `parseXml` on the new core against the shipped parser, whole string and in 64 KB chunks:

| Input | Shipped `parseXml` | On `XmlParser` | On `XmlParser`, 64 KB chunks |
|---|---:|---:|---:|
| pretty `/>`, 100k `<S>`, 3.7 MB | 28.3 ms | 20.1 ms (-29%) | 17.9 ms (-37%) |
| minified `/>`, 100k `<S>`, 2.6 MB | 23.6 ms | 17.8 ms (-25%) | 15.7 ms (-34%) |
| pretty `</S>`, 100k `<S>`, 3.9 MB | 30.3 ms | 22.3 ms (-27%) | 19.7 ms (-35%) |
| livesim2 real, 5,402 `<S>`, 170 KB | 1.29 ms | 0.84 ms (-35%) | 0.83 ms (-36%) |
| livesim2-scale synthetic, 148 KB | 1.16 ms | 0.73 ms (-37%) | 0.73 ms (-37%) |
| `bbb_30fps.mpd`, 3 KB | 0.023 ms | 0.015 ms (-35%) | 0.015 ms (-33%) |

**dash.js pipeline.** Manifest object as `processXml` produces it today, against the one-pass builders:

| Input | dash.js today | One pass | One pass, specialized | Specialized, 64 KB chunks |
|---|---:|---:|---:|---:|
| pretty `/>`, 100k `<S>` | 51.4 ms | 34.8 ms (-32%) | 29.0 ms (-44%) | 26.6 ms (-48%) |
| minified `/>`, 100k `<S>` | 47.5 ms | 29.7 ms (-38%) | 24.5 ms (-49%) | 23.4 ms (-51%) |
| pretty `</S>`, 100k `<S>` | 54.0 ms | 37.1 ms (-31%) | 30.7 ms (-43%) | 28.2 ms (-48%) |
| livesim2 real, 5,402 `<S>` | 1.93 ms | 1.31 ms (-32%) | 1.14 ms (-41%) | 1.15 ms (-40%) |
| livesim2-scale synthetic | 1.90 ms | 1.37 ms (-28%) | 1.25 ms (-34%) | 1.24 ms (-35%) |
| `bbb_30fps.mpd` | 0.039 ms | 0.032 ms (-18%) | 0.031 ms (-20%) | 0.031 ms (-20%) |

Three more rows from the same run bound the design. Tokenizing the pretty stress input with attribute records but no tree takes 17.4 ms, and with neither records nor tree 14.7 ms, so the records cost about 3 ms and the tree builder about 3 ms on top of them. The per-attribute callback variant of the dash.js build measured 29.6 ms against 29.0 ms for the specialized record-based builder, which is why the RFC does not propose it. Chunked input costs nothing measurable once the joined string is flat; on the large inputs it came out slightly faster than the single write, most likely because a scanner entered once per chunk gets regular optimized code sooner than one entered once per document.

Under a forced full GC before every parse, which is the regime a player is in between manifest refreshes, the new core keeps its lead over the shipped parser on every input and stays within about ten percent of its natural-GC time on the manifest-sized inputs (0.92 ms against 0.84 ms on the livesim2 manifest). That holds only because the scanner keeps no per-parse state; the earlier prototype that kept state on the instance took 6 ms in that regime. See Implementation notes and the forced-GC tables in the design record.

### Bundle size

Measured with the repository's bundler (`tsdown --minify`, `@svta/cml-utils` external, prototype JavaScript rather than the TypeScript build):

| Bundle | Minified | Gzipped |
|---|---:|---:|
| `parseXml` today | 2,372 B | 1,109 B |
| Whole `@svta/cml-xml` today | 2,873 B | 1,347 B |
| `XmlParser` alone | 3,856 B | 1,479 B |
| `XmlParser` plus the `parseXml` builder | 4,724 B | 1,810 B |

An adopter that only imports `parseXml` pays about 2.4 KB minified, 700 bytes gzipped, more than today. An adopter that imports only `XmlParser` pays about 370 bytes gzipped more than `parseXml` costs today and drops the tree. Tree-shaking between the two is preserved: the tree builders live in `parseXml.ts` and are not reachable from `XmlParser`.

### Implementation notes

These are the findings from the prototype that the implementation must keep. Each one was worth double-digit percentages, and two of them only show up under conditions a benchmark loop does not create by default.

- **The scanner takes no per-parse object.** One module-level `scan` function holds the tokenizer and receives only primitives, the two stack arrays, and a literal-created slots object; it returns the consumed count and never reads or writes the `XmlParser` instance. V8 tracks field constness per hidden class, and hidden-class transitions are weak, so an instance created per parse gets a fresh hidden class after every full GC and the first reassignment of a field the constructor initialized deoptimizes every function compiled against it. With state on the instance, the prototype's whole-string parse of the 170 KB livesim2 manifest took about 6 ms after each forced full GC against 0.9 ms with natural GC, because the scanner never kept optimized code and was re-tiered from the interpreter on every parse. With the scanner isolated it takes 0.8 ms in both regimes. The open-element stack holds the current element at its top, so there is nothing to write back; `write` and `end`, which do touch the instance, are cold. A player refreshes a manifest every few seconds with GCs in between, so this is the realistic regime, not the benchmark one.
- **Never read past the end of the input.** `charCodeAt` one past the end returns `NaN`, and once the scanner's character variable has held `NaN`, V8 compiles every comparison on it as a floating-point compare for the rest of the process. Whole-string parsing hits that once per document, chunked parsing once per chunk. Guarding every advance (`cc = ++pos < length ? input.charCodeAt(pos) : 0`) made whole-string tokenization about 19 percent faster and removed a 2x penalty on chunked input.
- **Flat joins.** The carry and the next chunk are joined with `[carry, chunk].join('')`, not `+`. Concatenation yields a rope (a V8 `ConsString`) that the scanner read about 25 percent slower even after the one-time flatten; `join` yields a flat sequential string.
- **A slots object with a fixed shape.** The constructor copies the builder's callbacks into an object literal so the loads in `scan` see one hidden class regardless of which builder is in use. Before this and the state isolation above, a benchmark that drove one scanner with a dozen different builder objects in one process ran 30 to 65 percent slower than the shipped parser while the same code with one builder per process was faster; with the final structure the same interleaved run keeps the relative ordering of the per-process run. Adopters normally have one or two builders in a bundle, but the normalization is free.
- Builders should be module-level constants so the call targets are stable across parses; `parseXml` prebuilds its four variants.
- `unescapeHtml` runs only when an `&` was seen while scanning the run or value.
- Module scope stays free of side effects: numeric constants and functions only.

### Testing

Four layers, all exercised on the prototype (`plans/xml-incremental-parser/equivalence.md`):

1. **Parity.** An equivalence corpus of about 60 inputs (synthetic manifests in three forms, both fixtures, the real livesim2 manifest, and hand-written edge cases for entities, CDATA, comments, doctype, namespaces, whitespace, truncation, and malformed attributes) parsed with six option sets, compared `deepStrictEqual` against recorded output of the shipped parser.
2. **Boundary sweep.** A recording builder turns callbacks into an event log; each corpus input is written whole and then split at every character position (small inputs) or hundreds of sampled positions (large inputs), in three parts, and one character at a time, asserting identical logs and identical trees. Errors compare by first line and absolute offset.
3. **Termination.** Inputs that hang the shipped parser terminate with the hang-fix structure, run under a worker timeout so a regression fails instead of hanging CI.
4. **dash.js pipeline.** The one-pass builder from the guide is a test and the TSDoc example, and its output, with and without the `<S>` branch and with chunked input, is compared to a faithful port of `parseXml` plus `processNode` on the synthetic manifests, the fixtures, and the livesim2 manifest.

The prototype passed 8,157 checks with one expected difference, the `pos` error-message column described above, which the implementation avoids by not slicing.

## Drawbacks

- **Surface.** A stateful class and two types in a package that has been three functions. The shape is justified by the incremental contract, but it is a different style from the rest of `@svta/cml-xml`.
- **Size for tree users.** `parseXml`-only adopters pay about 700 bytes gzipped more. The alternative, keeping the recursive tokenizer under `parseXml` and adding a second one for `XmlParser`, costs every adopter that uses both more than that and leaves two tokenizers to maintain.
- **Callbacks are harder to debug than a tree.** A consumer carries its own state through return values; a mistake in `appendChild` shows up as a wrong structure, not an exception.
- **Per-write cost.** Each `write` joins the carry with the chunk and rescans any construct that straddled the boundary. On manifests this is within noise (see Measured results), but pathological documents with huge single constructs pay more.
- **Error message change.** The `Offset` line is additive and nobody should parse error messages, but it is an observable change to `parseXml`.
- **The floor stays.** Attribute records are still allocated per element. They are inherent to `Record<string, string>` in the contract; the measured alternative is discussed below.
- **Five parameters on `createElement`.** Most builders will declare three. The two extra ones exist because the tokenizer already knows where the colon is and passing the parts measured 2 to 5 percent faster on the tree path than an `indexOf` in the builder, on top of being simpler to consume.

## Rationale and alternatives

**Builder over SAX-style events.** SAX handlers (`onopentag`, `onclosetag`, `ontext`) cost the same to run but leave the consumer to maintain a stack to know where it is. That bookkeeping is exactly why dash.js chose a tree plus a second pass over its earlier X2JS pipeline. Passing the parent's value into every callback removes the stack from the consumer and costs the parser one array it already needs.

**Builder over a pull parser.** A cursor the consumer advances (`XmlReader`, quick-xml, StAX) is trivially resumable, but generators are slow in JavaScript and a reusable cursor makes the API chatty for a manifest consumer. The incremental `write`/`end` core gives the same scheduling freedom without either.

**Builder over a lazy tree.** Materializing attributes on access buys nothing when the consumer reads every `<S>` immediately, which dash.js does, and it adds proxies or getters to the hot path.

**Not `DOMParser`.** It is unavailable in workers, dash.js moved off it for speed, and it produces a heavier tree than the one this RFC removes.

**Incremental core over a whole-string one-pass call plus an async variant.** An incremental parser is resumable by construction and gives time-slicing as a two-line pattern; a whole-string API can never give chunked input. Boundary handling is one rule in a flat scanner, and once the joined string is flat it costs nothing measurable.

**One tokenizer under both entry points.** The tree path gets the flat-rewrite speedup, the hang fixes land once, and adopters that use both pay for one scanner. The price is the size for tree-only users, stated above.

**Attributes as a record, not per-attribute callbacks.** A per-attribute callback (`attribute(element, name, value)`) was prototyped and measured (see Measured results). It saves the record allocation and the keyed stores, but it is incompatible with the carry model as written: a tag split across chunks is rescanned from its start, which would call `createElement` twice, so supporting it needs a completeness pre-scan of every tag before any callback fires. It also forces the consumer to create the element before knowing its attributes, which rules out immutable objects and constructors that take the attributes. The specialized `<S>` branch in the guide recovers most of the same gain within the record contract, so the RFC does not propose the callback mode.

**Local name and prefix as arguments.** The tokenizer finds the colon while scanning the name. Passing the parts costs two slices per namespaced element, which manifests barely have, and saves an `indexOf` on every element in the builder; measured 2 to 5 percent faster on the tree path and the consumer code is simpler. The parameters come last so builders that do not care declare three.

**A class, not a closure factory.** `WebVttParser` is the existing precedent for a stateful parser object in this repository, and a class makes the `write`/`end` lifecycle explicit. Performance does not decide this one: the hot path is a module-level function either way, and the GC interaction that does matter (see Implementation notes) is about where the scanner keeps its state, not about classes against closures. The #424 investigation attributed a forced-GC penalty to per-call closures; that measurement came from an interleaved harness and does not reproduce with one variant per process.

**No DASH-specific parsing in the parser.** #424 asked for it as an option; the investigation measured 5.6 percent for `<S>` handling inside `parseXml`, and it would make attribute types depend on element names. The builder puts the same specialization in the player, where the schema is known, and there it is worth far more (see the specialized columns under Measured results).

**Not worker offload.** Cloning a 100,000-node tree back to the main thread costs about as much as parsing it. Offload only pays when the consumer's transform also runs in the worker, which is a player architecture decision. The parser has no DOM dependency and works in a worker if a player chooses that.

**Naming.** `createElement` and `appendChild` are DOM vocabulary every web developer knows and they say what the consumer does: build. `startElement`/`endElement` (SAX) describe what the parser saw instead. The DOM names are proposed; see Unresolved questions.

## Prior art

- **expat.** `XML_Parse(parser, buffer, length, isFinal)` is the same contract as `write` and `end`: complete constructs are reported as they are seen and the final call terminates whatever is left.
- **sax-js and saxes.** `parser.write(chunk).close()` with `onopentag`, `onclosetag`, `ontext` handlers; xml2js builds its tree on top of sax-js, which is the pattern this RFC lets consumers skip.
- **htmlparser2.** `parser.write(chunk)` and `parser.end()` with a handler object.
- **tXml 6.** `transformStream` and `transformWebStream` emit parsed nodes at a chosen depth as a stream, and `parse` accepts a `filter` callback during parsing. `parseXml` derives from tXml.
- **Node.js `StringDecoder` and `crypto.Hash`.** `write`/`end` and `update`/`digest` are the incremental idiom this API follows.
- **Pull parsers.** .NET `XmlReader`, Java StAX, Rust `quick-xml`, Go `encoding/xml` `Decoder.Token`; considered and not chosen, see Rationale.
- **Players.** shaka-player's `TXml` builds a tree and walks it with `findChildren` and `parseAttr`. dash.js moved from X2JS over `DOMParser` to its own tXml port (dash.js PR 4180) and then to `@svta/cml-xml` (dash.js PR 4719), keeping the tree-then-walk pipeline throughout.
- **This repository.** `WebVttParser` is a class with `parse(chunk)` and `flush()` and `on*` callback properties; `WebVttTransformer` wraps it as a Web Streams transformer. `readIsoBoxes` takes a reader map that decides what each box becomes.

## Unresolved questions

1. **Names.** `XmlBuilder` and `createElement`/`appendChild` (proposed) against `XmlHandlers` and `startElement`/`endElement`.
2. **Class or factory.** `new XmlParser(builder)` (proposed, matches `WebVttParser`) against `createXmlParser(builder)` (matches `createFetchTransport`). Performance is equivalent as long as the scanner is module-level.
3. **A Web Streams wrapper.** Whether to ship an `XmlTransformer` alongside, mirroring `WebVttTransformer`, or leave `pipeTo(new WritableStream(...))` as the documented pattern. Proposed: leave it out until asked.
4. **Whitespace option.** Whether `keepWhitespace` belongs on `XmlParserOptions` or `appendText` should always receive the raw run and let the builder trim. Proposed: keep the option, since trimmed non-empty text is what almost every consumer wants and `parseXml` needs the same rule.
5. **Processing instructions.** Whether to add `appendProcessingInstruction`. `parseXml` skips them today. Proposed: not in this RFC.
6. **Error type.** Plain `Error` with an `Offset` line (proposed, matches today) or an `XmlParseError` subclass with an `offset` field.

## Future possibilities

- An `XmlTransformer` for `TransformStream` pipelines.
- A generic "objectify" builder (named properties, configurable array elements, converted attributes) in `@svta/cml-dash`, so players get an MPD object without writing a builder.
- An `offset` accessor on the parser for progress reporting during streamed parses.
- Guidance and a sample for running the builder in a worker and transferring compact structures back.

## Revision history

- 2026-09-02: initial draft.

## Final Decision

Pending community review.
