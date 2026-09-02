# XmlParser prototype

Reference implementation used to verify the design in `rfc/xml-incremental-parser.md` and to produce the
numbers in `benchmark.md`. Plain JavaScript run directly with Node 24 against the built `@svta/cml-utils`
bundle. Port to TypeScript with repo style when implementing. The structure is deliberate and each part
of it was worth double-digit percentages, see "Performance notes": one module-level `scan` function that
takes no per-parse object, an open-element stack whose top is the current element, builder callbacks
copied into a literal-created slots object, guarded end-of-input reads, and flat string joins.

Verified against the shipped `parseXml` (main at d74cac3ad, 1.1.6 plus the #425 attribute fix) with the
corpus described in `equivalence.md`: 8,157 checks, 1 expected difference (see "Known deviation").

## Core

```js
// Clean prototype of the proposed XmlParser (no measurement variants), used for size estimates and
// as the reference implementation embedded in plans/xml-incremental-parser/prototype.md.
import { unescapeHtml } from '@svta/cml-utils'

const LT = 60, GT = 62, SLASH = 47, QUESTION = 63, EXCL = 33, MINUS = 45, SQ = 39, DQ = 34
const LSB = 91, RSB = 93, AMP = 38, EQ = 61, SP = 32, NL = 10, CR = 13, TAB = 9, COLON = 58

const OPEN = 0, ENDED = 1, FAILED = 2
const DONE = -1

export class XmlParser {
	constructor(builder, options = {}) {
		// An object literal, so every parser shares one stable hidden class for the slots regardless of
		// the builder's shape; `scan` reads its callbacks from here and never touches the instance.
		this.slots = {
			createElement: builder.createElement,
			appendChild: builder.appendChild,
			appendText: builder.appendText,
			appendCdata: builder.appendCdata,
			appendComment: builder.appendComment,
			appendDoctype: builder.appendDoctype,
		}
		this.keepWhitespace = !!options.keepWhitespace
		this.document = builder.createDocument()
		// The open-element stack, document first; the current element is always the top.
		this.stack = [this.document]
		this.names = ['']
		this.carry = ''
		this.offset = 0
		this.state = OPEN
		this.done = false
	}

	write(chunk) {
		if (this.state !== OPEN) {
			throw new Error('XmlParser.write() called after ' + (this.state === ENDED ? 'end()' : 'a parse error'))
		}
		if (this.done) {
			return this
		}
		// join() yields a flat string; carry + chunk would yield a rope, which the scanner reads slower.
		const input = this.carry.length === 0 ? chunk : [this.carry, chunk].join('')
		let consumed
		try {
			consumed = scan(input, false, this.offset, this.keepWhitespace, this.slots, this.stack, this.names)
		}
		catch (error) {
			this.state = FAILED
			throw error
		}
		if (consumed === DONE) {
			this.done = true
			consumed = input.length
		}
		this.carry = consumed === input.length ? '' : input.slice(consumed)
		this.offset += consumed
		return this
	}

	end() {
		if (this.state !== OPEN) {
			throw new Error('XmlParser.end() called after ' + (this.state === ENDED ? 'end()' : 'a parse error'))
		}
		if (!this.done && this.carry.length > 0) {
			try {
				scan(this.carry, true, this.offset, this.keepWhitespace, this.slots, this.stack, this.names)
			}
			catch (error) {
				this.state = FAILED
				throw error
			}
		}
		this.carry = ''
		const appendChild = this.slots.appendChild
		const stack = this.stack
		const names = this.names
		while (stack.length > 1) {
			const child = stack.pop()
			names.pop()
			if (appendChild !== undefined) {
				appendChild(stack[stack.length - 1], child)
			}
		}
		this.state = ENDED
		return this.document
	}
}

function unexpectedCloseTag(offset, input, pos) {
	let message = 'Unexpected close tag'
	if (offset === 0) {
		const parsedText = input.substring(0, pos).split('\n')
		message += '\nLine: ' + (parsedText.length - 1) + '\nColumn: ' + (parsedText[parsedText.length - 1].length + 1)
	}
	return new Error(message + '\nChar: ' + input[pos] + '\nOffset: ' + (offset + pos))
}

// Scans `input`. In streaming mode (final = false) only complete constructs are consumed and the
// index of the first unconsumed character is returned. In final mode the end of the input
// terminates constructs exactly as parseXml treats a truncated document. Returns DONE when a
// close tag at document level ended the parse.
//
// Takes no per-parse object on purpose: V8 tracks field constness per hidden class and hidden-class
// transitions are weak, so an instance created per parse gets a fresh class after every full GC and
// the first field reassignment deoptimizes every function compiled against it.
function scan(input, final, offset, keepWhitespace, slots, stack, names) {
	const createElement = slots.createElement
	const appendChild = slots.appendChild
	const appendText = slots.appendText
	const appendCdata = slots.appendCdata
	const appendComment = slots.appendComment
	const appendDoctype = slots.appendDoctype
	let current = stack[stack.length - 1]
	let currentName = names[names.length - 1]
	const length = input.length
	let pos = 0

	while (pos < length) {
		let cc = input.charCodeAt(pos)

		if (cc !== LT) {
			const start = pos
			let hasAmp = false
			let ws = true
			do {
				if (ws && cc !== SP && cc !== NL && cc !== CR && cc !== TAB) ws = false
				if (cc === AMP) hasAmp = true
				cc = ++pos < length ? input.charCodeAt(pos) : 0
			} while (pos < length && cc !== LT)
			if (pos >= length && !final) {
				return start
			}
			if (appendText !== undefined && (keepWhitespace || !ws)) {
				let text = input.slice(start, pos)
				if (hasAmp) text = unescapeHtml(text)
				if (!keepWhitespace) text = text.trim()
				if (text.length > 0) appendText(current, text)
			}
			continue
		}

		if (pos + 1 >= length && !final) {
			return pos
		}
		const next = input.charCodeAt(pos + 1)

		if (next === SLASH) {
			const end = input.indexOf('>', pos + 2)
			if (end === -1 && !final) {
				return pos
			}
			if (!input.startsWith(currentName, pos + 2)) {
				throw unexpectedCloseTag(offset, input, end === -1 ? length : end)
			}
			pos = end === -1 ? length : end + 1
			if (stack.length === 1) {
				// A close tag at document level ends the parse; the rest of the input is ignored.
				return DONE
			}
			const child = stack.pop()
			names.pop()
			current = stack[stack.length - 1]
			currentName = names[names.length - 1]
			if (appendChild !== undefined) appendChild(current, child)
			continue
		}

		if (next === QUESTION) {
			const end = input.indexOf('>', pos + 2)
			if (end === -1 && !final) {
				return pos
			}
			pos = end === -1 ? length : end + 1
			continue
		}

		if (next === EXCL) {
			if (pos + 2 >= length && !final) {
				return pos
			}
			const third = input.charCodeAt(pos + 2)
			if (third === MINUS) {
				const end = input.indexOf('-->', pos + 2)
				if (end === -1 && !final) {
					return pos
				}
				const stop = end === -1 ? length : end + 3
				if (appendComment !== undefined) appendComment(current, input.slice(pos, stop))
				pos = stop
				continue
			}
			if (third === LSB) {
				if (length - pos < 9 && !final) {
					return pos
				}
				if (input.charCodeAt(pos + 8) === LSB && input.startsWith('CDATA', pos + 3)) {
					const end = input.indexOf(']]>', pos + 9)
					if (end === -1 && !final) {
						return pos
					}
					if (appendCdata !== undefined) {
						appendCdata(current, end === -1 ? input.slice(pos + 9) : input.slice(pos + 9, end))
					}
					pos = end === -1 ? length : end + 3
					continue
				}
			}
			const start = pos + 1
			let p = pos + 2
			let bracket = false
			while (p < length) {
				const c2 = input.charCodeAt(p)
				if (c2 === GT && !bracket) break
				if (c2 === LSB) bracket = true
				else if (bracket && c2 === RSB) bracket = false
				p++
			}
			if (p >= length && !final) {
				return pos
			}
			if (appendDoctype !== undefined) appendDoctype(current, input.slice(start, p))
			pos = p + 1
			continue
		}

		// Start tag
		const tagStart = pos
		const nameStart = ++pos
		let colon = -1
		cc = pos < length ? input.charCodeAt(pos) : 0
		while (pos < length && !(cc === SP || cc === GT || cc === SLASH || cc === EQ || cc === NL || cc === CR || cc === TAB)) {
			if (cc === COLON && colon === -1) colon = pos
			cc = ++pos < length ? input.charCodeAt(pos) : 0
		}
		if (pos >= length && !final) {
			return tagStart
		}
		const name = input.slice(nameStart, pos)
		const localName = colon === -1 ? name : name.slice(colon - nameStart + 1)
		const prefix = colon === -1 ? null : name.slice(0, colon - nameStart)
		const attributes = {}
		while (pos < length && cc !== GT) {
			if ((cc > 64 && cc < 91) || (cc > 96 && cc < 123)) {
				const aStart = pos
				cc = ++pos < length ? input.charCodeAt(pos) : 0
				while (pos < length && !(cc === SP || cc === GT || cc === SLASH || cc === EQ || cc === NL || cc === CR || cc === TAB)) {
					cc = ++pos < length ? input.charCodeAt(pos) : 0
				}
				if (pos >= length && !final) {
					return tagStart
				}
				const aName = input.slice(aStart, pos)
				while (pos < length && cc !== SQ && cc !== DQ && cc !== GT) cc = ++pos < length ? input.charCodeAt(pos) : 0
				if (pos >= length && !final) {
					return tagStart
				}
				let value = ''
				if (cc === SQ || cc === DQ) {
					const quote = cc
					const vStart = ++pos
					let hasAmp = false
					cc = pos < length ? input.charCodeAt(pos) : 0
					while (pos < length && cc !== quote) {
						if (cc === AMP) hasAmp = true
						cc = ++pos < length ? input.charCodeAt(pos) : 0
					}
					if (pos >= length) {
						if (!final) {
							return tagStart
						}
						throw new Error('Missing closing quote')
					}
					value = input.slice(vStart, pos)
					if (hasAmp) value = unescapeHtml(value)
					cc = ++pos < length ? input.charCodeAt(pos) : 0
				}
				attributes[aName] = value
				continue
			}
			cc = ++pos < length ? input.charCodeAt(pos) : 0
		}
		if (pos >= length && !final) {
			return tagStart
		}
		const selfClosing = input.charCodeAt(pos - 1) === SLASH
		pos++
		const element = createElement(current, name, attributes, localName, prefix)
		if (selfClosing) {
			if (appendChild !== undefined) appendChild(current, element)
		}
		else {
			stack.push(element)
			names.push(name)
			current = element
			currentName = name
		}
	}

	return length
}
```

## `parseXml` as a builder

```js
// parseXml expressed as an XmlBuilder over XmlParser (clean version for size estimates).
import { XmlParser } from './xmlParserClean.mjs'

function leaf(nodeName, nodeValue) {
	return { nodeName, nodeValue, attributes: {}, childNodes: [] }
}

function createXmlNodeBuilder(keepComments, includeParentElement) {
	const parentOf = (parent) => (parent.nodeName.startsWith('#') ? null : parent)
	const push = (parent, node) => {
		if (includeParentElement) node.parentElement = parentOf(parent)
		parent.childNodes.push(node)
	}
	const builder = {
		createDocument() {
			const document = { nodeName: '#document', nodeValue: null, childNodes: [], attributes: {} }
			if (includeParentElement) document.parentElement = null
			return document
		},
		createElement(parent, name, attributes, localName, prefix) {
			const node = { nodeName: name, nodeValue: null, attributes, childNodes: [], prefix, localName }
			if (includeParentElement) node.parentElement = parentOf(parent)
			return node
		},
		appendChild(parent, child) {
			parent.childNodes.push(child)
		},
		appendText(parent, text) {
			push(parent, leaf('#text', text))
		},
		appendCdata(parent, text) {
			push(parent, leaf('#cdata', text))
		},
		appendDoctype(parent, text) {
			push(parent, leaf('#doctype', text))
		},
	}
	if (keepComments) {
		builder.appendComment = (parent, text) => {
			push(parent, leaf('#comment', text))
		}
	}
	return builder
}

const builders = [
	createXmlNodeBuilder(false, false),
	createXmlNodeBuilder(true, false),
	createXmlNodeBuilder(false, true),
	createXmlNodeBuilder(true, true),
]

export function parseXml(input, options = {}) {
	const builder = builders[(options.keepComments ? 1 : 0) | (options.includeParentElement ? 2 : 0)]
	return new XmlParser(builder, options).write(options.pos ? input.slice(options.pos) : input).end()
}

export { XmlParser }
```

## dash.js-shaped one-pass builders

`dashBuilder` replaces `DashParser.processXml` (cml `parseXml` plus the `processNode` second pass) with the
same per-node logic. `dashBuilderTuned` produces the same objects using the freedom the API gives the
consumer: a dedicated branch for `<S>` (the DASH-specific fast path #424 asked for, now living in the
player) and a `Set` for the array-node lookup. `convertAttribute` is the dash.js matcher chain and
`arrayNodes` the dash.js list, both ported verbatim in `builders.mjs`.

```js
export const dashBuilder = {
	createDocument: () => ({ tagName: '#document', __children: [] }),
	createElement(parent, name, attributes, localName, prefix) {
		const node = { tagName: localName, __children: [] }
		if (prefix !== null) node.__prefix = prefix
		for (const key in attributes) {
			node[key] = convertAttribute(localName, key, attributes[key])
		}
		return node
	},
	appendChild(parent, child) {
		parent.__children.push(child)
		const tagName = child.tagName
		const existing = parent[tagName]
		if (Array.isArray(existing)) {
			existing.push(child)
		}
		else if (arrayNodes.indexOf(tagName) !== -1) {
			parent[tagName] = [child]
		}
		else {
			parent[tagName] = child
		}
	},
	appendText(parent, text) {
		parent.__text = text
	},
}

const ARRAY_NODE_SET = new Set(arrayNodes)

export const dashBuilderTuned = {
	createDocument: dashBuilder.createDocument,
	createElement(parent, name, attributes, localName, prefix) {
		if (localName === 'S') {
			const node = { tagName: 'S', __children: [] }
			const { t, d, r, k, n } = attributes
			if (t !== undefined) node.t = parseInt(t, 10)
			if (d !== undefined) node.d = parseInt(d, 10)
			if (r !== undefined) node.r = parseInt(r, 10)
			if (k !== undefined) node.k = parseInt(k, 10)
			if (n !== undefined) node.n = parseInt(n, 10)
			return node
		}
		const node = { tagName: localName, __children: [] }
		if (prefix !== null) node.__prefix = prefix
		for (const key in attributes) {
			node[key] = convertAttribute(localName, key, attributes[key])
		}
		return node
	},
	appendChild(parent, child) {
		parent.__children.push(child)
		const tagName = child.tagName
		const existing = parent[tagName]
		if (Array.isArray(existing)) {
			existing.push(child)
		}
		else if (ARRAY_NODE_SET.has(tagName)) {
			parent[tagName] = [child]
		}
		else {
			parent[tagName] = child
		}
	},
	appendText: dashBuilder.appendText,
}

export function dashOnePass(data) {
	const document = new XmlParser(dashBuilder).write(data).end()
	const root = document.__children.find(c => c.tagName === 'MPD' || c.tagName === 'Patch') || document.__children[0]
	return { [root.tagName]: root }
}
```

## Performance notes

Each of these was found by measurement during the design session (details in `findings.md`) and the
implementation must keep them.

- **`scan` takes no per-parse object.** V8 tracks field constness per hidden class, and hidden-class
  transitions are weak. An `XmlParser` instance created per parse therefore gets a fresh hidden class
  after every full GC, and the first reassignment of a field the constructor initialized ("dependent
  field type constness changed") deoptimizes every function compiled against it. With the scanner reading
  and writing instance fields, a whole-string parse of the 170 KB livesim2 manifest took about 6 ms after
  each forced full GC against 0.9 ms with natural GC, because `scan` never kept optimized code and was
  re-tiered from the interpreter on every parse. With `scan(input, final, offset, keepWhitespace, slots,
  stack, names)` it takes 0.8 ms in both regimes. The open-element stack holds the current element at its
  top so there is nothing to write back; `write` and `end`, which do touch the instance, are cold.
- **Never read past the end.** `charCodeAt` one past the end returns `NaN`; once the character variable
  has been `NaN`, V8 compiles every comparison on it as a floating-point compare for the rest of the
  process. Whole-string parsing hits that once per document, chunked parsing once per chunk. Guarding
  every advance (`cc = ++pos < length ? input.charCodeAt(pos) : 0`) made whole-string tokenization about
  19 percent faster and removed a 2x penalty on chunked input.
- **Flat joins.** `write` joins the carry and the chunk with `[carry, chunk].join('')`. `carry + chunk`
  yields a rope (`ConsString`) that the scanner read about 25 percent slower even after the one-time
  flatten; `join` yields a flat sequential string.
- **Slots object.** The builder's callbacks are copied into an object literal with a fixed shape, so the
  loads in `scan` see one hidden class regardless of the builder. Before this and the state isolation,
  driving one `scan` with a dozen different builder objects in one process made every variant 30 to 65
  percent slower than the shipped parser while one builder per process was faster; with the final
  structure the interleaved run keeps the per-process ordering (`benchmark.md`, last section).
- **Type-feedback contamination in benchmarks.** Builders and string kinds (whole vs chunked) contaminate
  feedback the same way. Benchmark one variant per process. The earlier finding in
  `plans/xml-parse-perf/` that per-call closures lose optimized code after a full GC came from an
  interleaved harness and does not reproduce with one variant per process; the shipped parser goes from
  1.3 ms to 1.7 ms under forced GC on the livesim2 manifest, not 4x.
- Builders should be module-level objects so the call targets stay stable across parses. `parseXml`
  keeps four prebuilt tree builders (comments x parentElement).
- `unescapeHtml` is only called when an `&` was seen during the scan of the text run or attribute value.

## Known deviation

`parseXml(input, { pos })` in this prototype slices the input before writing, so the Line and Column in the
mismatched-close-tag message are relative to `pos`. The shipped parser computes them over the whole input.
The implementation must start the scan at `pos` on the full string (an internal entry point, not part of
the public `write` API) so the message stays identical.

## Measurement-only variant

The scratch copy of the core used for the benchmark (`xmlParser.mjs`) has one switch that is not
proposed, `attributeCallbacks`: `createElement(parent, name, localName, prefix)` is called first, then
`builder.attribute(element, name, value)` per attribute, and no attributes record is built. It is
incompatible with the carry model as written: a tag split across chunks is rescanned from its start, which
would call `createElement` twice, so supporting it would need a completeness pre-scan of every tag before
any callback fires. Measured whole-string only; results in `benchmark.md`.

The switch as a diff against the core above, so the harness in `benchmark.md` and the script in `equivalence.md` can be run:

```diff
--- xmlParserClean.mjs
+++ xmlParser.mjs
@@ -19,6 +19,8 @@
 			appendCdata: builder.appendCdata,
 			appendComment: builder.appendComment,
 			appendDoctype: builder.appendDoctype,
+			attribute: builder.attribute,
+			attributeCallbacks: !!options.attributeCallbacks,
 		}
 		this.keepWhitespace = !!options.keepWhitespace
 		this.document = builder.createDocument()
@@ -110,6 +112,8 @@
 	const appendCdata = slots.appendCdata
 	const appendComment = slots.appendComment
 	const appendDoctype = slots.appendDoctype
+	const attribute = slots.attribute
+	const attributeCallbacks = slots.attributeCallbacks
 	let current = stack[stack.length - 1]
 	let currentName = names[names.length - 1]
 	const length = input.length
@@ -238,7 +242,14 @@
 		const name = input.slice(nameStart, pos)
 		const localName = colon === -1 ? name : name.slice(colon - nameStart + 1)
 		const prefix = colon === -1 ? null : name.slice(0, colon - nameStart)
-		const attributes = {}
+		let attributes = null
+		let element = null
+		if (attributeCallbacks) {
+			element = createElement(current, name, localName, prefix)
+		}
+		else {
+			attributes = {}
+		}
 		while (pos < length && cc !== GT) {
 			if ((cc > 64 && cc < 91) || (cc > 96 && cc < 123)) {
 				const aStart = pos
@@ -274,7 +285,8 @@
 					if (hasAmp) value = unescapeHtml(value)
 					cc = ++pos < length ? input.charCodeAt(pos) : 0
 				}
-				attributes[aName] = value
+				if (attributeCallbacks) attribute(element, aName, value)
+				else attributes[aName] = value
 				continue
 			}
 			cc = ++pos < length ? input.charCodeAt(pos) : 0
@@ -284,7 +296,7 @@
 		}
 		const selfClosing = input.charCodeAt(pos - 1) === SLASH
 		pos++
-		const element = createElement(current, name, attributes, localName, prefix)
+		if (!attributeCallbacks) element = createElement(current, name, attributes, localName, prefix)
 		if (selfClosing) {
 			if (appendChild !== undefined) appendChild(current, element)
 		}
```
