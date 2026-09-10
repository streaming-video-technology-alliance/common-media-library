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

> **Revision note.** The first draft proposed an incremental parser, `XmlParser`, with `write(chunk)`
> and `end()`. Review ([#431](https://github.com/streaming-video-technology-alliance/common-media-library/pull/431))
> found three things. Every blocking problem was in the incremental part. #432 had already merged the
> flat scanner and an internal builder. dash.js parses complete strings. This revision proposes the
> builder contract with one entry point, `parseXmlWith`, that takes the complete document. Incremental
> input moves to a separate RFC. Its design notes are in `plans/xml-incremental-parser/findings.md`
> under "Deferred: incremental input". The file keeps its original name.

## Summary

Add `parseXmlWith(input, builder, options)`. It parses an XML string in one pass and gives each element,
text run, CDATA section, comment, and doctype to a *builder* that the consumer supplies. It builds no
`XmlNode` tree. The value that `createElement` returns is the `parent` for that element's children, and
it is the `child` that `appendChild` receives when the element ends. If `createElement` returns
`undefined`, the element and its content are skipped. A manifest parser can build its final objects
during the parse, with no intermediate tree.

`parseXml` keeps its signature and output. Both functions share one scanner. Three fixes to how that
scanner reads XML apply to both. New public members: `parseXmlWith`, `XmlBuilder<TElement, TDocument>`,
`XmlParseWithOptions`, and `XmlParseError`.

```ts
import { parseXmlWith, type XmlBuilder } from '@svta/cml-xml'

type Node = { tagName: string; attributes: Record<string, string>; children: Node[]; text: string }

const builder: XmlBuilder<Node> = {
	createDocument: () => ({ tagName: '#document', attributes: {}, children: [], text: '' }),
	createElement: (parent, name, attributes, localName) => ({ tagName: localName, attributes, children: [], text: '' }),
	appendChild: (parent, child) => { parent.children.push(child) },
	appendText: (parent, text) => { parent.text += text },
}

const document = parseXmlWith('<MPD><Period id="1"/></MPD>', builder)
```

### Terms

- **Scanner**: the internal loop in `libs/xml/src/scan.ts` that reads the XML text character by
  character. #432 added it.
- **Builder**: the object of callback functions that the consumer passes to `parseXmlWith`.
- **Consumer**: the code that calls this library, for example dash.js.
- **Tree**: the `XmlNode` structure that `parseXml` returns.
- **Incremental input**: parsing a document that arrives in chunks, through `write` and `end` calls.
  Not part of this RFC.
- **Parity corpus**: 109 test inputs (106 from #432 plus three new ones), each parsed with six option
  sets. The expected `parseXml` output is stored in fixtures.
- **MPD**: Media Presentation Description, the DASH manifest format.

## Motivation

dash.js parses each manifest with `parseXml` and then walks the tree a second time in
`DashParser.processNode`. That second pass converts attribute strings, groups children into named
properties and arrays, and adds `tagName`, `__text`, and `__children`.
[#424](https://github.com/streaming-video-technology-alliance/common-media-library/issues/424) asked
for a faster parser for manifests with large `SegmentTimeline` elements. The investigation in
`plans/xml-parse-perf/` found that the 2x speedup dash.js prototyped came from removing its own second
pass. #432 then rewrote `parseXml` as a flat scanner and made it 20 to 40 percent faster.

The remaining problem is structural. No known consumer wants an `XmlNode` tree as its final result:

- dash.js builds its manifest object.
- A HAM adapter (Hypothetical Application Model, see `@svta/cml-cmaf-ham`) flattens the manifest into
  presentations and segments.
- The PlayReady helpers in `@svta/cml-drm` read two values from a small document.
- shaka-player, which does not use this library, builds its own tree and walks it with `findChildren`.

Each one builds a tree it does not want and then converts it. `parseXml` has no extension point for
this. Its options change what the tree contains, not what the output is.

The scanner on `main` already reports every construct to an internal builder. This RFC makes that
builder public, defines its contract, and fixes three errors in how the scanner reads XML. The
performance gain for dash.js after #432 is small (see Measured results). The main benefits are for the
consumer:

- It produces its own objects directly.
- It skips what it does not need.
- It gets an error instead of a partial document when the input is cut off.
- It never allocates a tree.

## Guide-level explanation

### The builder contract

A builder is a plain object of functions. `parseXmlWith` calls `createDocument` once, then
`createElement` for each start tag, with the enclosing element's value as `parent`. The value that
`createElement` returns becomes the `parent` for that element's children, and `appendChild` receives it
as `child` when the element ends.

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

`name` is the tag name as written (`tt:span`). `localName` is the part after the prefix (`span`).
`prefix` is the part before the colon (`tt`), or `null` if there is no prefix. Without a prefix,
`localName` is the same string as `name`. A builder that ignores namespaces declares only the first three
parameters.

`appendChild` runs after all of the child's own children are appended. Its `name` parameter is the
child's tag name. The text callbacks receive the parent's tag name, or the empty string at document
level. With the name, a builder can return a plain value such as `{ t, d, r }` for `<S>` and handle it
by name in `appendChild`.

Text arrives once per text run. It is not trimmed, and entities such as `&amp;` are decoded. Runs that
contain only whitespace are dropped, unless `keepWhitespace` is set. If a builder has no `appendCdata`,
CDATA content goes to `appendText` instead, so character data is never lost. Comments and doctypes
arrive as their inner text: the text between `<!--` and `-->`, and the text after `<!`. If a builder has
no `appendComment`, the scanner skips comments without copying them.

### Building a manifest object

This example shows a small dash.js-style builder, with a short list of array elements and one conversion
rule. It is not a complete port. The complete port of `processNode` is in
`plans/xml-incremental-parser/prototype/dash.ts` and is tested for identical output.

```ts
import { parseXmlWith, type XmlBuilder } from '@svta/cml-xml'

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
	return parseXmlWith(manifestText, dashBuilder).root
}
```

The `<S>` branch is the DASH-specific fast path that #424 asked for. It belongs in the player, which
knows the schema. The builder is a module-level constant on purpose, so that the scanner calls the same
functions on every parse (see Implementation notes). The document has its own type, so
`'root' in parent` tells it apart from an element. A real port would use a marker that no attribute name
can collide with, because attribute names become properties of the node.

### Flattening builders

A builder that flattens the manifest, as a HAM converter does, cannot finish an `<S>` element inside
`createElement`. The Representation id and bandwidth that a segment URL needs arrive later. Such a
builder keeps a small record per `<S>` and expands the records in `appendChild`, when the Representation
or the Period ends. This is still one pass, but it depends on document order, which a tree consumer does
not. A complete example is in `plans/xml-incremental-parser/flattening-builder.md`.

### Skipping subtrees

Return `undefined` from `createElement` to skip an element. The scanner reports nothing inside the
element and does not call `appendChild` for it. It still checks that the close tags inside the skipped
region match:

```ts
import { parseXmlWith, type XmlBuilder } from '@svta/cml-xml'

type Named = { name: string; children: Named[] }

const withoutMetrics: XmlBuilder<Named> = {
	createDocument: () => ({ name: '#document', children: [] }),
	createElement: (parent, name) => (name === 'Metrics' ? undefined : { name, children: [] }),
	appendChild: (parent, child) => { parent.children.push(child) },
}

const document = parseXmlWith('<MPD><Metrics><Range/></Metrics><Period/></MPD>', withoutMetrics)
// document.children[0].children.map(child => child.name) is ['Period']
```

### Errors

`parseXmlWith` requires a complete document. It throws when an element is still open at the end of the
input, or when a construct is cut off. It also throws the errors that `parseXml` already reports: a
malformed attribute, an unclosed quote, a mismatched or stray close tag. Every error is an
`XmlParseError`: an `Error` subclass with the message text that `parseXml` produces today, plus `offset`,
`line`, and `column`:

```ts
import { parseXmlWith, XmlParseError } from '@svta/cml-xml'

try {
	parseXmlWith(manifestText, dashBuilder)
}
catch (error) {
	if (error instanceof XmlParseError) {
		console.warn(`manifest rejected at offset ${error.offset} (line ${error.line}, column ${error.column})`)
	}
	throw error
}
```

### `parseXml`

`parseXml` does not change for its consumers. It is one builder over the shared scanner, as #432 made
it. It keeps its tolerance for truncated input: a document cut off between tags returns the nodes parsed
so far. Its errors become `XmlParseError` instances with the same messages.

## Reference-level explanation

### Public API

```ts
export type XmlParseWithOptions<TDocument> = {
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

export function parseXmlWith<TElement, TDocument = TElement>(input: string, builder: XmlBuilder<TElement, TDocument>, options?: XmlParseWithOptions<TDocument>): TDocument;
```

`TElement` and `TDocument` are inferred from the builder. `parseXmlWith` returns `options.root` when it
is set, otherwise the result of `builder.createDocument()`. It throws a `TypeError` when neither exists.
The type uses property syntax, so that `strictFunctionTypes` checks the parameter types strictly, and
`this: void`, because the scanner calls the functions without the builder as `this`.
`getElementsByName`, `serializeXml`, `XmlNode`, `XmlParseOptions`, and the `parseXml` signature do not
change.

### Callback semantics

- `createDocument()` is called once, before scanning, unless `options.root` is set. Its result is the
  parent of every top-level element, text run, doctype, and comment. `parseXmlWith` returns it.
- `createElement(parent, name, attributes, localName, prefix)` is called when a start tag has been read
  completely, before any of the element's content. `attributes` is a new object for each element, and
  its values are entity-decoded. The consumer owns this object and may keep or change it. If the return
  value is `undefined`, the element is skipped. Nothing inside it is reported, `appendChild` is not
  called for it, and close tags inside it are still checked.
- `appendChild(parent, child, name)` is called when the element ends: at its close tag, or directly
  after `createElement` for a self-closing tag. Siblings end in document order, so children are appended
  in document order. `name` is the child's tag name as written.
- `appendText(parent, text, name)` is called once per text run, when the run ends at the next `<` or at
  the end of the input. The text is entity-decoded and never trimmed. Runs that contain only space, tab,
  CR, and LF are dropped, unless `keepWhitespace` is set. `name` is the parent's tag name, or `''` at
  document level. Text at document level goes to the document value.
- `appendCdata(parent, text, name)` receives the content between `<![CDATA[` and `]]>`, not decoded. If
  the builder has no `appendCdata`, `appendText` receives the same content.
- `appendComment(parent, text, name)` receives the text between `<!--` and `-->`. If the builder has no
  `appendComment`, the scanner skips comments without copying them.
- `appendDoctype(parent, text, name)` receives the text after `<!` up to the `>` that ends the
  declaration. A `>` inside a bracketed internal subset or inside a quoted literal does not end the
  declaration.
- The XML declaration and processing instructions are skipped.
- The scanner calls the builder functions without the builder as `this`. They must not use `this`.

### Grammar fixes

The scanner reads three XML constructs incorrectly today. This RFC fixes them for both entry points.
`parseXml` output changes only on inputs that it reads wrong today.

| Construct | Today | Fixed |
|---|---|---|
| Processing instruction or declaration | ends at the first `>`, so `<?pi a > b?>` yields a PI and the text ` b?>` | ends at `?>` (XML 1.0, sections 2.6 and 2.8) |
| Doctype | ends at the first `>` outside `[...]`, so `<!DOCTYPE a SYSTEM "x>y">` splits inside the literal | a `>` inside a quoted literal does not end it |
| Attribute name | must start with an ASCII letter; any other leading character is skipped, so `<a _x="1">` yields `x` | starts with any XML NameStartChar (`_`, `:`, letters including non-ASCII) |

Eight of the 109 inputs in the parity corpus change. `plans/xml-incremental-parser/equivalence.md` lists
each one with its reason. Six are grammar fixes. Two are a side effect of delivering comments as inner
text, because the `parseXml` tree builder adds the delimiters back. With `keepComments`, a comment cut
off by the end of the input now reads `<!-- x-->`, and the malformed comment `<!--->` now reads
`<!---->`. Every other output in the corpus is byte-identical.

### Strictness

`parseXmlWith` throws when the input ends inside a start tag, a close tag, a comment, a CDATA section, a
doctype, a processing instruction, or a quoted attribute value. It also throws when an element is still
open at the end of the input. The message is `Unexpected end of input inside <name>` for an open
element, and `Unexpected end of input inside a start tag` or the matching construct name otherwise. The
messages include `Line`, `Column`, and `Char: end of input` in today's format. As a result, a network
response that ends in the middle of a document is an error, not a partial manifest.

`parseXml` keeps its documented tolerance. Input cut off between tags returns the nodes parsed so far. An
element left open keeps the children parsed so far. The errors that #430 added for malformed attributes
and mismatched close tags stay as they are. The difference between the two modes is one flag on the
shared scanner, internal to `parseXml`.

### Interaction with the existing API

`parseXml` calls the scanner directly, as #432 shipped it, with eight prebuilt tree builders
(`keepWhitespace` x `keepComments` x `includeParentElement`) as module-level constants. Trimming moves
from the scanner into the tree builder, because the `keepWhitespace` behavior of `parseXml` now lives
there. A bundle that imports only `parseXml` never includes `parseXmlWith`.

`parseXml` throws `XmlParseError` where it threw `Error` before. `instanceof Error` is still true, and
the messages do not change, so no consumer breaks. A consumer that wants the error position reads
`offset` instead of parsing the message.

### Measured results

The prototype in `plans/xml-incremental-parser/prototype/` runs against `main` after #432, with the
livesim2 fixture that #432 added. `plans/xml-incremental-parser/benchmark.md` has the method, all
tables, and the forced-GC run. In short: one process per variant and input, 4 warm-up calls, medians of
runs with natural garbage collection (GC), Node 24.16 on an M1 Pro on battery. Treat the absolute
numbers as indicative. The relative numbers are the result.

Terms used in the tables:

- **Phase one** is the scope of this RFC. The *phase-one scanner* is the scanner with this RFC's changes.
- The **stress inputs** are synthetic manifests with 100,000 `<S>` elements. The **real-sized inputs**
  are the livesim2 manifest (170 KB), a synthetic manifest of the same size, and `bbb_30fps.mpd` (3 KB).
- The **faithful builder** produces objects identical to today's dash.js pipeline. The **lean builder**
  keeps only the fields that the rest of dash.js reads, and handles `<S>` without the matcher chain.

The contract changes cost `parseXml` nothing measurable. The phase-one scanner runs the skip checks, the
name arguments, the untrimmed text policy, the NameStartChar test, and the quoted-literal doctype scan
in its main loop:

| Input | `parseXml` on `main` | `parseXml` on the phase-one scanner |
|---|---:|---:|
| pretty `/>`, 100k `<S>`, 3.7 MB | 22.7 ms | 23.1 ms (+1.7%) |
| minified `/>`, 100k `<S>`, 2.6 MB | 16.4 ms | 16.7 ms (+1.9%) |
| pretty `</S>`, 100k `<S>`, 3.9 MB | 24.7 ms | 24.8 ms (+0.5%) |
| livesim2 real, 5,402 `<S>`, 170 KB | 0.821 ms | 0.804 ms (-2.0%) |
| livesim2-scale synthetic, 148 KB | 0.694 ms | 0.716 ms (+3.2%) |
| `bbb_30fps.mpd`, 3 KB | 0.015 ms | 0.015 ms (+2.5%) |

For dash.js, the baseline is `parseXml` on `main` plus a faithful port of `processNode`:

| Input | dash.js today on `main` | One pass, faithful | One pass, lean |
|---|---:|---:|---:|
| pretty `/>`, 100k `<S>` | 41.4 ms | 37.7 ms (-9%) | 32.9 ms (-21%) |
| minified `/>`, 100k `<S>` | 35.8 ms | 33.5 ms (-6%) | 30.6 ms (-15%) |
| pretty `</S>`, 100k `<S>` | 40.1 ms | 39.5 ms (-1%) | 34.7 ms (-13%) |
| livesim2 real, 5,402 `<S>` | 1.38 ms | 1.43 ms (+3%) | 1.30 ms (-6%) |
| livesim2-scale synthetic | 1.36 ms | 1.42 ms (+4%) | 1.34 ms (-2%) |
| `bbb_30fps.mpd` | 0.032 ms | 0.034 ms (+5%) | 0.032 ms (0%) |

Three conclusions:

1. With #432 on `main`, the tree is no longer the main cost for dash.js. Removing the tree while keeping
   every object and conversion that `processNode` performs gains almost nothing.
2. The gain that this API adds is 13 to 21 percent on the stress inputs and 0 to 6 percent on the
   real-sized inputs. It comes from dropping the second pass's object shapes and the matcher chain. A
   builder can drop them. A tree walk cannot.
3. This API alone does not reach the 2x that #424 asked for. Before #432, the whole dash.js pipeline
   took 51.4 ms on the stress input. `main` takes 41.4 ms, and the lean builder takes 32.9 ms. That is a
   36 percent reduction from where the issue started, and most of it came from #432.

An application that uses `parseXml` and one custom builder runs two builders in one process. That costs
each builder a few percent: within about 6 percent of the isolated medians on the large inputs.

One result is unexplained. With a full GC before every call and one variant per process, the faithful
builder runs 4 to 5 times slower on the 150 KB inputs. The lean builder runs 16 to 46 percent slower
than today's pipeline on the small inputs. `parseXml` is not affected. The effect disappears when the builder
alternates with `parseXml` in one process, and `processNode`, which creates the same object shapes, does
not show it. The likely cause is V8's object-shape tracking for objects whose properties are added one
by one, not the scanner, but this is not diagnosed. The implementation must measure it with
`--trace-deopt`. Until then, the guide should recommend creating each object with all of its fields
present.

### Bundle size

`tsdown --minify`, `@svta/cml-utils` external, each entry bundled alone:

| Entry | Minified | Gzipped |
|---|---:|---:|
| `parseXml` on `main` (#432) | 3,797 B | 1,494 B |
| whole `@svta/cml-xml` on `main` | 4,301 B | 1,734 B |
| `parseXml` on the phase-one scanner | 5,004 B | 1,947 B |
| `parseXmlWith` alone | 4,000 B | 1,640 B |
| whole package after phase one | 5,224 B | 2,012 B |

A bundle that imports only `parseXml` grows by about 450 bytes gzipped. The strict-mode branches, the
NameStartChar test, the quoted-literal doctype scan, the skip checks, and `XmlParseError` are in the
shared scanner. The tree builder grows from four to eight variants. A bundle that imports only
`parseXmlWith` is about 150 bytes gzipped larger than today's `parseXml` bundle, and it has no tree
builder.

### Implementation notes

The implementation must keep the constraints that #432 established and the prototype follows. The
scanner takes only primitives, the two stack arrays, and the builder object. Every character read is
guarded. Builders are module-level constants. `plans/xml-incremental-parser/prototype.md` lists
these constraints with their reasons under Performance notes for the port, and
`plans/xml-incremental-parser/steps.md` has the ESLint change that `this: void` needs.

### Testing

The prototype's `equivalence.ts` passes 778 checks against `main`, with 34 expected differences, all
from the eight corpus cases above. The implementation keeps the same checks:

1. The parity corpus and fixtures from #432, regenerated for exactly the eight cases, plus three new
   cases for the grammar fixes.
2. `parseXmlWith` tests. Every truncated corpus input throws `XmlParseError`. Every other input produces
   what `parseXml` produces. Root injection, the name arguments, skipping, the text policy, the CDATA
   fallback, the inner-text shapes, and the error fields each get a test.
3. The faithful dash.js builder compared with `deepStrictEqual` to `parseXml` plus `processNode`, on the
   fixtures and the synthetic manifests.
4. The benchmark from the prototype, moved into `libs/xml/bench/`.

## Drawbacks

- Small performance gain after #432: 13 to 21 percent for a lean dash.js builder on the stress inputs,
  and 0 to 6 percent on the real-sized inputs. This is not the 2x from #424.
- Larger bundles for tree users. A `parseXml`-only bundle grows by about 450 bytes gzipped. The grammar
  fixes, the strict branches, and the error class are in the shared scanner.
- `parseXml` output changes on eight corpus inputs. All are malformed or rare constructs. Two of them
  (`<!--->` and a comment cut off by the end of the input) change because comments are delivered as
  inner text.
- Flattening builders depend on document order. Tree consumers never had to think about that.
- Callbacks are harder to debug than a tree. A mistake in `appendChild` appears as a wrong structure,
  not as an exception.
- `createElement` has six parameters, and the append callbacks have three. Most builders declare fewer,
  and the unused trailing parameters cost the scanner nothing, but the type is long to read.
- The forced-GC result under Measured results is unexplained.

## Rationale and alternatives

**One entry point for complete documents now, incremental input later.** The first draft made `write`
and `end` the core. Review found three problems, all in the incremental part. Rescanning the carried-over
text was quadratic for a long construct, which is a denial-of-service risk on remote input. `end()` had
to become strict. The chunked benchmarks compared strings with different internal representations. #432
had already shipped the scanner, and dash.js parses complete strings, so `parseXmlWith` delivers the
contract today as a small wrapper. The incremental design, with the fixes that review asked for, is
recorded for a follow-up RFC.

**SAX-style events.** Events cost the same as builder callbacks, but the consumer must keep its own stack
to know where it is in the document. That bookkeeping is why dash.js chose a tree plus a second pass over
its earlier X2JS pipeline. Passing the parent's value into every callback removes that stack from the
consumer, and the scanner already keeps it.

**A pull parser.** A cursor that the consumer advances, as in `XmlReader`, quick-xml, or StAX, is
resumable by nature. But generators are slow in JavaScript, and a cursor means many small calls for a
manifest consumer.

**A lazy tree.** Attributes created on first read do not help a consumer that reads every `<S>`
immediately, as dash.js does, and they put proxies or getters in the main loop.

**`DOMParser`.** It is not available in workers, dash.js stopped using it for speed, and it produces a
heavier tree than the one this RFC removes.

**One scanner for both entry points, with the grammar fixes for both.** A compatibility mode that kept
`parseXml` reading processing instructions and doctypes wrongly would preserve known errors under an
option. Fixing a wrong check is a bug fix, so the fixes apply to both, and the eight corpus inputs that
change are listed, not hidden.

**Attributes as one object, not one callback per attribute.** Per-attribute callbacks gained a few
percent on the stress input in the first draft. But they force the consumer to create the element before
it knows the attributes, which prevents immutable objects and constructors that take attributes. The
`<S>` branch in the guide recovers most of that gain.

**Local name and prefix as arguments, and the name on the append callbacks.** The scanner already has all
three, so passing them costs nothing and saves every builder an `indexOf` or a type field. They are
trailing parameters, so short builders stay valid.

**Root injection instead of closures.** A builder that needs per-parse input, such as a base URL, a
logger, or counters, cannot close over it if the builder is a module-level constant. Mutable module-level
state breaks as soon as two parses interleave. `options.root` supplies the per-parse value, and
`createDocument` becomes optional.

**Inner text for comments, doctypes, and CDATA.** The builder layer exists to define the output, so it
delivers inner text, and the tree builder adds back the delimiters that `XmlNode` expects. The cost is
listed under Drawbacks.

**Strict `parseXmlWith`.** A parser that a player uses on a network response must not turn a truncated
body into a partial manifest that looks valid. `parseXml` keeps its tolerance because existing consumers
rely on it. The difference is one flag on the shared scanner.

**No DASH-specific parsing in the parser.** #424 asked for it as an option. It measured 5.6 percent for
`<S>` handling inside `parseXml`, and it would make attribute types depend on element names. That
specialization stays in the player, which knows the schema.

**Names.** `createElement` and `appendChild` are DOM vocabulary and describe what the consumer does:
build. `startElement` and `endElement` describe what the parser saw. The DOM names are proposed (see
Unresolved questions).

## Prior art

- expat's `XML_Parse(parser, buffer, length, isFinal)` reports complete constructs as it reads them and
  finishes the rest on the final call. The incremental follow-up will look like this.
- sax-js and saxes use `parser.write(chunk).close()` with `onopentag`, `onclosetag`, and `ontext`
  handlers. xml2js builds its tree on top of sax-js. This RFC lets consumers skip that tree.
- htmlparser2 uses `parser.write(chunk)` and `parser.end()` with a handler object.
- tXml 6 accepts a `filter` callback during parsing and has `transformStream` for streamed nodes.
  `parseXml` derives from tXml.
- Pull parsers: .NET `XmlReader`, Java StAX, Rust `quick-xml`, Go `encoding/xml` `Decoder.Token`.
  Considered and not chosen (see Rationale and alternatives).
- Players: shaka-player's `TXml` builds a tree and walks it with `findChildren` and `parseAttr`. dash.js
  moved from X2JS over `DOMParser` to its own tXml port (dash.js PR 4180), then to `@svta/cml-xml`
  (dash.js PR 4719), and kept the tree-then-walk pipeline throughout.
- This repository: `readIsoBoxes` takes a reader map that decides what each box becomes, and
  `WebVttParser` delivers cues through callbacks instead of a document.

## Unresolved questions

1. Names: `XmlBuilder` with `createElement` and `appendChild` (proposed), or `XmlHandlers` with
   `startElement` and `endElement`?
2. Skipping: return `undefined` (proposed), or export a dedicated sentinel value, which would let
   `TElement` include `undefined`?
3. Whitespace: keep `keepWhitespace` on `XmlParseWithOptions` (proposed), or always deliver every text
   run and let builders drop blank runs themselves? Dropping blank runs in the scanner saves a slice and
   a call per run on pretty-printed manifests.
4. The forced-GC result: is it a property of the benchmark, or of builders with dynamic object shapes?
   The implementation should decide this with `--trace-deopt` before the guide gives advice on object
   shapes.

## Future possibilities

- Incremental input: `XmlParser` with `write` and `end` on the same scanner. It keeps lexical progress
  across writes, limits the size of a buffered construct, has a strict `end()`, and has comparable chunk
  benchmarks. Design notes are under "Deferred: incremental input" in
  `plans/xml-incremental-parser/findings.md`.
- A HAM builder as the second reference consumer. It exercises inheritance, expansion to segments, and
  deferred completion, which the dash.js builder does not. It comes before any generic "objectify"
  builder.
- A Web Streams `XmlTransformer`, once the incremental parser exists.

## Revision history

- 2026-09-02: first draft, an incremental parser with `write` and `end`.
- 2026-09-02: review fixes (text accumulation in the Summary example, the completion rule for processing
  instructions, reproducible scripts in the design record) and a plain-language pass.
- 2026-09-03: reshaped after review. Incremental input moved to a follow-up RFC, and `parseXmlWith` is
  the entry point for complete documents. The contract gained root injection, name arguments, skipping,
  untrimmed text, the CDATA fallback, inner-text shapes, `TElement`/`TDocument`, property syntax with
  `this: void`, `XmlParseError`, and strict end-of-input handling. Three grammar fixes apply to both entry
  points. The measurements were redone against `main` after #432 with an executable prototype.
- 2026-09-03: the entry point is named `parseXmlWith`, not `buildXml`. The options type is
  `XmlParseWithOptions`.
- 2026-09-03: rewritten in plain English for readers whose first language is not English. Added the
  Terms list, shortened Implementation notes and the minor alternatives, and moved the flattening
  example to `plans/xml-incremental-parser/flattening-builder.md`. No technical change.

## Final Decision

Pending community review.
