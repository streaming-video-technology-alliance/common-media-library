# Equivalence and chunk-boundary verification

How the prototype in `prototype.md` was checked against the shipped `parseXml` (main at d74cac3ad) and
against itself across chunk boundaries. The implementation PR should turn these into tests under
`libs/xml/test/`; see `steps.md`.

## Result

8,157 checks, 1 failure, and the failure is the known `pos` deviation described in `prototype.md`
(error-message column relative to `pos` because the prototype slices the input).

Captured against `main` at d74cac3ad. PR #430 changes what `parseXml` accepts: malformed attributes,
mismatched close tags, and document-level close tags throw. Roughly ten corpus inputs (the valueless and
unquoted attribute cases, the two close-tag quirks, truncation inside an attribute) switch from tree
expectations to `throws` expectations once it lands, and the prototype's final-mode handling of those
inputs must follow.

## What is compared

1. **Parity.** Every corpus input x six option sets (`{}`, `keepWhitespace`, `keepComments`,
   `includeParentElement`, all three, `pos: 3`): `parseXml` on `XmlParser` must produce a
   `deepStrictEqual` tree to the shipped parser, or throw with the same message (the new `Offset:` line
   stripped before comparing). `deepStrictEqual` follows the `parentElement` cycles.
2. **Boundary sweep.** A recording builder turns every callback into a log entry. Each input (corpus plus
   the hang inputs) is written whole and then split at every character position for inputs up to 400
   characters and at 300 pseudo-random positions plus the first and last ten for longer ones, then in
   three parts, then one character at a time (inputs up to 2,000 characters) or in 4 KB chunks. The logs
   must be identical, and for one split in seven the resulting tree must be identical too. Errors compare
   by first line and absolute offset, since line and column are only reported when the failing text
   starts at offset zero.
3. **Termination.** Inputs that hang the shipped parser on main (`<a></a`, `<a>x</a`,
   `<MPD><Period></Period`, an unterminated declaration, `</`) terminate and produce the structure the
   pending hang-fix branch produces.
4. **Lifecycle.** `write` after `end`, `end` twice, and any call after a throw all throw with a message
   naming the method and the state; the error offset is absolute across chunks.
5. **dash.js pipelines.** The dash.js-shaped one-pass builder, its specialized variant (`<S>` branch and
   `Set`), its attribute-callback variant, and the chunked form all produce the same manifest object (canonical form: tag name, prefix, text, converted
   attribute values, named child properties and arrays, ordered element children) as the faithful port of
   today's `parseXml` plus `processNode`, on the synthetic manifests, `bbb_30fps.mpd`, the real livesim2
   manifest, and a namespaced sample.

## Corpus

Synthetic MPDs (2 Periods x 2 AdaptationSets x 40 `<S>`, pretty, minified, and `<S ...></S>` forms), the
two test fixtures, the real livesim2 `tsbd_21600` manifest (169,721 bytes, 5,402 `<S>`), and the following
hand-written cases: NBSP-only text, raw NBSP, entities in text and in attributes, mixed content,
attribute spacing and quote styles including `>` and `/>` inside quoted values, doctype with an internal
subset, simple doctype, comments including `<!---->` and `<!--->`, CDATA including empty CDATA,
namespaces, top-level text, vertical tab and form feed, empty input, whitespace-only input, unclosed
element, unclosed element with text, empty elements, mismatched close tag (throws), declaration,
processing instruction inside an element, trailing whitespace, trailing text, CRLF, whitespace then text,
5,000-character whitespace runs, valueless attribute, valueless after quoted, valueless in a self-closing
child, valueless followed by markup, unquoted value, truncated attribute name, truncated after `=`,
truncated inside a quoted value (throws), the close-tag prefix quirk (`<a></ab>`), the document-level
close-tag quirk (`<a/></b><c/>`), a lone `<` at the end, truncated tag name, truncated `<!`, truncated
`<![CDA`, truncated comment, truncated CDATA, truncated doctype, attribute names starting with a digit
or underscore (skipped by the grammar), and non-ASCII text.

## Script

Runs from `plans/xml-incremental-parser/` with the same files and fixture as the harness in `benchmark.md`
(see its Harness section for the layout); the shipped parser comes from the built `libs/xml/dist`.

```js
// Equivalence and chunk-boundary checks for the xml-incremental-parser prototype.
import assert from 'node:assert'
import { readFileSync } from 'node:fs'
import { parseXml as shippedParseXml } from '../../libs/xml/dist/index.js'
import { XmlParser } from './xmlParser.mjs'
import { parseXml, parseXmlChunked, createRecordingBuilder, dashCurrent, dashOnePass, dashOnePassTuned, dashOnePassChunked, dashOnePassAttributeCallbacks, canonicalDash } from './builders.mjs'
import { generateMpd, chunk } from './generate.mjs'

const FIXTURES = '../../libs/xml/test/fixtures/'
const bbb = readFileSync(FIXTURES + 'bbb_30fps.mpd', 'utf8')
const nodeTypes = readFileSync(FIXTURES + 'node_types.xml', 'utf8')
const livesim2 = readFileSync('./livesim2_tsbd21600.mpd', 'utf8')

const corpus = {
	'synthetic pretty': generateMpd({ periods: 2, adaptationSets: 2, segments: 40 }),
	'synthetic minified': generateMpd({ periods: 2, adaptationSets: 2, segments: 40, pretty: false }),
	'synthetic closed': generateMpd({ periods: 2, adaptationSets: 2, segments: 40, closed: true }),
	'bbb_30fps.mpd': bbb,
	'node_types.xml': nodeTypes,
	'livesim2 real': livesim2,
	'nbsp only text': '<a>&nbsp;</a>',
	'raw nbsp': '<a> </a><b> x </b>',
	'entities in text': '<a>a &lt; b &amp;&amp; c &gt; d &quot;q&quot; &apos;s&apos; &#65;&#x42; &lrm;&rlm;</a>',
	'entities in attributes': '<a x="&lt;&amp;&gt;" y=\'&quot;&#x41;\'/>',
	'mixed content': '<a>one<b>two</b>three<c/>four</a>',
	'attribute spacing and quotes': '<a b = "c"\n\td\t=\n\'e\' f="g"h="i" /><j k="x/>y" l=\'p>q\'>t</j>',
	'doctype with subset': '<!DOCTYPE note [<!ELEMENT note (to,from)><!ENTITY x "y">]><note><to>a</to></note>',
	'doctype simple': '<!DOCTYPE html><root/>',
	'comments': '<a><!-- c1 --><b/><!-- c2 -- still --><!---->x<!--->y</a>',
	'cdata': '<a><![CDATA[<x>&amp;]]><![CDATA[]]></a>',
	'namespaces': '<tt:root xmlns:tt="urn:x"><tt:a xml:lang="en" tt:b="1"/><c:d/></tt:root>',
	'top-level text': 'hello <a/> world',
	'vertical tab and form feed': '<a>\v\f</a><b>\v x \f</b>',
	'empty input': '',
	'whitespace only': ' \n\t\r ',
	'unclosed element': '<a><b>',
	'unclosed element with text': '<a><b>text',
	'empty element': '<a></a><b/><c />',
	'mismatched close tag': '<a><b></c></a>',
	'declaration': '<?xml version="1.0" encoding="UTF-8"?><a/>',
	'processing instruction inside': '<a><?pi x?><b/></a>',
	'trailing whitespace': '<a/>\n\n  ',
	'trailing text': '<a/>tail',
	'CRLF': '<a>\r\n<b>x</b>\r\n</a>\r\n',
	'whitespace then text': '<a>   x</a>',
	'long whitespace run': '<a>' + ' '.repeat(5000) + '<b/>' + '\n'.repeat(5000) + '</a>',
	'valueless attribute': '<a b>',
	'valueless after quoted': '<a b="c" d>',
	'valueless in self-closing child': '<a b="c"><d e/></a>',
	'valueless then markup': '<a b><c d="1"/></a>',
	'unquoted value': '<a b=c/>',
	'truncated attribute name': '<MPD><Period><SegmentTimeline><S d="180000" r',
	'truncated after equals': '<a b=',
	'truncated in quoted value (throws)': '<MPD><Period><S d="1',
	'close tag prefix quirk': '<a></ab><c/>',
	'top-level close tag quirk': '<a/></b><c/>',
	'lone lt at end': '<a>x<',
	'truncated tag name': '<a><bc',
	'truncated exclamation': '<a><!',
	'truncated cdata prefix': '<a><![CDA',
	'truncated comment': '<a><!-- x',
	'truncated cdata': '<a><![CDATA[x',
	'truncated doctype': '<!DOCTYPE html',
	'digits and underscore attrs skipped': '<a 1b="x" _c="y" d="z"/>',
	'unicode text': '<a>héllo wörld 日本語 😀</a>',
}

// Inputs that make the shipped parser (main, #425 only) loop forever; compared against the hang-fix semantics instead
const hangInputs = {
	'unterminated close tag': '<a></a',
	'unterminated close tag with text': '<a>x</a',
	'unterminated close tag nested': '<MPD><Period></Period',
	'unterminated declaration': '<?xml version="1.0" encoding="UTF-8"',
	'unterminated pi inside': '<a><?pi',
	'bare close slash': '</',
}

const optionSets = [
	{},
	{ keepWhitespace: true },
	{ keepComments: true },
	{ includeParentElement: true },
	{ keepWhitespace: true, keepComments: true, includeParentElement: true },
	{ pos: 3 },
]

function outcomeChunked(fn) {
	try {
		return { value: fn() }
	}
	catch (error) {
		return { error: error.message.split("\n")[0], offset: error.message.match(/Offset: (\d+)/)?.[1] }
	}
}

function outcome(fn) {
	try {
		return { value: fn() }
	}
	catch (error) {
		return { error: error.message.split('\nOffset:')[0] }
	}
}

let checks = 0
let failures = 0
function check(label, fn) {
	checks++
	try {
		fn()
	}
	catch (error) {
		failures++
		console.log('FAIL ' + label + '\n  ' + String(error.message).split('\n').slice(0, 6).join('\n  '))
	}
}

// 1. parseXml parity with the shipped parser
for (const [name, input] of Object.entries(corpus)) {
	for (const options of optionSets) {
		const label = `parity: ${name} ${JSON.stringify(options)}`
		check(label, () => {
			const expected = outcome(() => shippedParseXml(input, { ...options }))
			const actual = outcome(() => parseXml(input, { ...options }))
			assert.deepStrictEqual(actual, expected)
		})
	}
}

// 2. Chunk boundary sweep: identical event logs and identical trees whether written whole or split
function recordAll(chunks, options) {
	const builder = createRecordingBuilder()
	const parser = new XmlParser(builder, options)
	return outcomeChunked(() => {
		for (const c of chunks) parser.write(c)
		parser.end()
		return builder.log
	})
}

function splitPositions(length) {
	if (length <= 400) return Array.from({ length: length + 1 }, (_, i) => i)
	const positions = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, length - 1, length])
	let seed = 12345
	for (let i = 0; i < 300; i++) {
		seed = (seed * 1103515245 + 12345) & 0x7fffffff
		positions.add(seed % (length + 1))
	}
	return [...positions]
}

for (const [name, input] of Object.entries({ ...corpus, ...hangInputs })) {
	for (const options of [{}, { keepWhitespace: true }]) {
		const whole = recordAll([input], options)
		const wholeTree = outcomeChunked(() => parseXmlChunked([input], options))
		for (const i of splitPositions(input.length)) {
			check(`boundary: ${name} ${JSON.stringify(options)} split at ${i}`, () => {
				assert.deepStrictEqual(recordAll([input.slice(0, i), input.slice(i)], options), whole)
			})
			if (i % 7 === 0) {
				check(`boundary tree: ${name} split at ${i}`, () => {
					assert.deepStrictEqual(outcomeChunked(() => parseXmlChunked([input.slice(0, i), input.slice(i)], options)), wholeTree)
				})
			}
		}
		// three-way and one-char-at-a-time splits
		const third = Math.floor(input.length / 3)
		check(`boundary: ${name} three-way`, () => {
			assert.deepStrictEqual(recordAll([input.slice(0, third), input.slice(third, 2 * third), input.slice(2 * third)], options), whole)
		})
		if (input.length <= 2000) {
			check(`boundary: ${name} one char at a time`, () => {
				assert.deepStrictEqual(recordAll(input.split(''), options), whole)
			})
		}
		else {
			check(`boundary: ${name} 4 KB chunks`, () => {
				assert.deepStrictEqual(recordAll(chunk(input, 4096), options), whole)
			})
		}
	}
}

// 3. Termination and structure on inputs that hang the shipped parser (hang-fix branch semantics)
check('hang: <a></a keeps element', () => {
	const doc = parseXml('<a></a')
	assert.equal(doc.childNodes.length, 1)
	assert.equal(doc.childNodes[0].nodeName, 'a')
	assert.equal(doc.childNodes[0].childNodes.length, 0)
})
check('hang: <a>x</a keeps text', () => {
	const doc = parseXml('<a>x</a')
	assert.equal(doc.childNodes[0].childNodes[0].nodeValue, 'x')
})
check('hang: <MPD><Period></Period keeps children so far', () => {
	const doc = parseXml('<MPD><Period></Period')
	assert.equal(doc.childNodes[0].nodeName, 'MPD')
	assert.equal(doc.childNodes[0].childNodes[0].nodeName, 'Period')
})
check('hang: unterminated declaration yields empty document', () => {
	const doc = parseXml('<?xml version="1.0" encoding="UTF-8"')
	assert.equal(doc.childNodes.length, 0)
})
check('hang: bare </ yields empty document', () => {
	assert.equal(parseXml('</').childNodes.length, 0)
})

// 4. Lifecycle errors
check('lifecycle: write after end throws', () => {
	const p = new XmlParser(createRecordingBuilder())
	p.write('<a/>').end()
	assert.throws(() => p.write('x'), /write\(\) called after end\(\)/)
	assert.throws(() => p.end(), /end\(\) called after end\(\)/)
})
check('lifecycle: failed parser stays failed', () => {
	const p = new XmlParser(createRecordingBuilder())
	assert.throws(() => p.write('<a></b>'), /Unexpected close tag/)
	assert.throws(() => p.write('<c/>'), /after a parse error/)
	assert.throws(() => p.end(), /after a parse error/)
})
check('error offset is absolute across chunks', () => {
	const p = new XmlParser(createRecordingBuilder())
	p.write('<a>').write('<b>')
	assert.throws(() => p.write('</c>'), /Offset: 9/)
})

// 5. dash.js pipelines agree
for (const [name, input] of Object.entries({ 'synthetic pretty': corpus['synthetic pretty'], 'synthetic closed': corpus['synthetic closed'], 'bbb_30fps.mpd': bbb, 'livesim2 real': livesim2, 'namespaced': '<ns:MPD xmlns:ns="x" minBufferTime="PT2S" availabilityStartTime="2020-01-01T00:00:00Z"><Period id="1" start="PT0S"><AdaptationSet lang="en" id="7"><Representation id="1" bandwidth="100"/><Representation id="2" bandwidth="200"/></AdaptationSet><ns:Foo>text</ns:Foo></Period></ns:MPD>' })) {
	check(`dash: ${name} one pass equals current`, () => {
		const expected = canonicalDash(dashCurrent(shippedParseXml, input).MPD)
		assert.deepStrictEqual(canonicalDash(dashOnePass(input).MPD), expected)
		assert.deepStrictEqual(canonicalDash(dashOnePassAttributeCallbacks(input).MPD), expected)
		assert.deepStrictEqual(canonicalDash(dashOnePassTuned(input).MPD), expected)
		assert.deepStrictEqual(canonicalDash(dashOnePassChunked(chunk(input, 1000)).MPD), expected)
	})
}

console.log(`${checks} checks, ${failures} failures`)
process.exit(failures === 0 ? 0 : 1)
```
