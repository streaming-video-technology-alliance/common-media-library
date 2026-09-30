/**
 * Verification for the phase-one prototype. Run from the repository root after `npm run build -w libs/xml`:
 *
 *   node plans/xml-incremental-parser/prototype/equivalence.ts
 *
 * 1. Parity: the prototype `parseXml` against the published one (`@svta/cml-xml` on main after #432) over
 *    the parity corpus from libs/xml/test/parseXml.equivalence.test.ts plus a few cases for the grammar
 *    fixes, with every option set. Differences must be listed in EXPECTED_DIFFERENCES with a check.
 * 2. `parseXmlWith`: strict end-of-input handling, and the same result as `parseXml` on complete input.
 * 3. The builder contract: root injection, names on the append callbacks, skipping, the text policy, the
 *    CDATA fallback, the delivered shapes, and the error fields.
 * 4. dash.js: the faithful one-pass builder produces exactly what parseXml plus processNode produces.
 */
import { parseXml as mainParseXml, type XmlNode, type XmlParseOptions } from '@svta/cml-xml'
import { deepStrictEqual, ok, strictEqual, throws } from 'node:assert'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { generateMpd } from '../../../libs/xml/bench/generate.ts'
import { parseXmlWith } from './parseXmlWith.ts'
import { dashOnePassFaithful, dashToday } from './dash.ts'
import { createTreeBuilder, parseXml } from './parseXml.ts'
import type { XmlBuilder } from './XmlBuilder.ts'
import { XmlParseError } from './XmlParseError.ts'

const FIXTURES = resolve(import.meta.dirname, '../../../libs/xml/test/fixtures')
const fixture = (name: string): string => readFileSync(resolve(FIXTURES, name), 'utf8')

// The corpus of libs/xml/test/parseXml.equivalence.test.ts (copied; that module runs tests on import)
const CORPUS: Record<string, string> = {
	// Manifests
	'synthetic pretty': generateMpd({ periods: 2, adaptationSets: 2, segments: 40 }),
	'synthetic minified': generateMpd({ periods: 2, adaptationSets: 2, segments: 40, pretty: false }),
	'synthetic closed': generateMpd({ periods: 2, adaptationSets: 2, segments: 40, closed: true }),
	'bbb_30fps.mpd': fixture('bbb_30fps.mpd'),
	'node_types.xml': fixture('node_types.xml'),
	'livesim2 real': fixture('livesim2_tsbd21600.mpd'),

	// Text and entities
	'nbsp only text': '<a>&nbsp;</a>',
	'raw nbsp': '<a>\u00a0</a><b>\u00a0x\u00a0</b>',
	'entities in text': '<a>a &lt; b &amp;&amp; c &gt; d &quot;q&quot; &apos;s&apos; &#65;&#x42; &lrm;&rlm;</a>',
	'entities in attributes': '<a x="&lt;&amp;&gt;" y=\'&quot;&#x41;\'/>',
	'numeric entities': '<a>&#x1F600;&#128512;&#65;</a>',
	'mixed content': '<a>one<b>two</b>three<c/>four</a>',
	'top-level text': 'hello <a/> world',
	'text with gt': '<a>x > y</a>',
	'multiple roots with text between': '<a/>x<b/>y',
	'vertical tab and form feed': '<a>\v\f</a><b>\v x \f</b>',
	'empty input': '',
	'whitespace only': ' \n\t\r ',
	'whitespace before root': '\n\n<a/>',
	'trailing whitespace': '<a/>\n\n  ',
	'trailing text': '<a/>tail',
	'CRLF': '<a>\r\n<b>x</b>\r\n</a>\r\n',
	'whitespace then text': '<a>   x</a>',
	'long whitespace run': '<a>' + ' '.repeat(5000) + '<b/>' + '\n'.repeat(5000) + '</a>',
	'unicode text': '<a>héllo wörld 日本語 😀</a>',

	// Attributes
	'attribute spacing and quotes': '<a b = "c"\n\td\t=\n\'e\' f="g"h="i" /><j k="x/>y" l=\'p>q\'>t</j>',
	'double and single quoted values': '<a b="c" d=\'e\'>text</a>',
	'whitespace around equals': '<a b = "c"\n\td\t=\n"e"/>',
	'markup inside quoted values': '<a b="x/>y" c=\'p>q\'>t</a>',
	'adjacent attributes without space': '<a b="c"d="e"/>',
	'duplicate attribute': '<a b="1" b="2"/>',
	'empty attribute value': '<a b="" c=\'\'/>',
	'mixed quotes in values': '<a b=\'c"d\' e="f\'g"/>',
	'entity and slash in value': '<a b="&amp;/">text</a>',
	'newline-separated attributes': '<a\nb="1"\nc="2"\n/>',
	'digits and underscore attrs': '<a 1b="x" _c="y" d="z"/>',
	'tag name ends at equals': '<a=b>',
	'non-letter attribute name then letter': '<a 😀="x" b="y"/>',

	// Malformed attributes (throw since #430)
	'valueless attribute': '<a b>',
	'valueless in self-closing tag': '<a b/>',
	'valueless after quoted': '<a b="c" d>',
	'valueless in self-closing child': '<a b="c"><d e/></a>',
	'valueless then markup': '<a b><c d="1"/></a>',
	'unquoted value': '<a b=c/>',
	'quoted value without equals': '<a b "c"/>',
	'malformed attribute on line 1': '<root>\n\t<a b>',
	'truncated attribute name': '<MPD><Period><SegmentTimeline><S d="180000" r',
	'truncated after equals': '<a b=',
	'truncated in quoted value': '<MPD><Period><S d="1',
	'unterminated attribute value at end': '<a b="c',

	// Elements, names, and namespaces
	'empty element': '<a></a><b/><c />',
	'slash space quirk': '<a/ >x</a>',
	'empty tag name': '<>x</>',
	'hash named element': '<#a><b/></#a>',
	'namespaces': '<tt:root xmlns:tt="urn:x"><tt:a xml:lang="en" tt:b="1"/><c:d/></tt:root>',
	'leading colon': '<:a/>',
	'trailing colon': '<a:/>',
	'multiple colons': '<a:b:c/>',
	'deep nesting 200': '<a>'.repeat(200) + 'x' + '</a>'.repeat(200),
	'parent element chain': '<a><b><c><d/></c></b></a>',
	'parent of text': '<root>text content</root>',
	'parent of cdata': '<root><![CDATA[some data]]></root>',
	'parent of comment': '<root><!-- comment --></root>',
	'parent of nested elements': '<root><child><grandchild/></child></root>',

	// Close tags
	'close tag name differs': '<a>text</b>',
	'close tag extends open tag name': '<ab>text</abc>',
	'longer close tag': '<a>text</ab>',
	'mismatched close tag': '<a><b></c></a>',
	'close tag with no open element': '<a/></b>',
	'empty close tag with no open element': '<a/></>',
	'empty close tag with space': '<a/></ ><b/>',
	'close tag at document level after text': 'x</a>',
	'close tag prefix quirk': '<a></ab><c/>',
	'top-level close tag quirk': '<a/></b><c/>',
	'close tag with space before bracket': '<a>text</a >',
	'close tag with tabs and line breaks': '<a>text</a\t\r\n>',
	'nested elements sharing a prefix': '<a><ab>text</ab></a>',

	// Comments, CDATA, doctype, declarations
	'comments': '<a><!-- c1 --><b/><!-- c2 -- still --><!---->x<!--->y</a>',
	'comment at document level': '<!-- c --><a/><!-- d -->',
	'cdata': '<a><![CDATA[<x>&amp;]]><![CDATA[]]></a>',
	'cdata at document level': '<![CDATA[x]]><a/>',
	'doctype with subset': '<!DOCTYPE note [<!ELEMENT note (to,from)><!ENTITY x "y">]><note><to>a</to></note>',
	'doctype simple': '<!DOCTYPE html><root/>',
	'declaration': '<?xml version="1.0" encoding="UTF-8"?><a/>',
	'declaration only': '<?xml version="1.0"?>',
	'declaration then markup': '<?xml version="1.0" encoding="UTF-8"?><a b="1"><c/>text</a>',
	'processing instruction inside': '<a><?pi x?><b/></a>',
	'pi with gt in value': '<a><?pi x>y?></a>',

	// Truncated input
	'unclosed element': '<a><b>',
	'unclosed element with text': '<a><b>text',
	'unterminated close tag': '<a></a',
	'unterminated close tag with text': '<a>x</a',
	'unterminated close tag nested': '<MPD><Period></Period',
	'truncated nested close tag with child': '<MPD><Period><S d="1"/></Period',
	'truncated close slash after element': '<a/></',
	'truncated mismatched close tag': '<a>text</b',
	'bare close slash': '</',
	'unterminated declaration': '<?xml version="1.0" encoding="UTF-8"',
	'unterminated pi inside': '<a><?pi',
	'lone lt at end': '<a>x<',
	'truncated tag name': '<a><bc',
	'truncated exclamation': '<a><!',
	'truncated cdata prefix': '<a><![CDA',
	'truncated comment': '<a><!-- x',
	'truncated cdata': '<a><![CDATA[x',
	'truncated doctype': '<!DOCTYPE html',

	// Added for the grammar fixes in this RFC
	'doctype with quoted gt': '<!DOCTYPE a SYSTEM "x>y"><a/>',
	'colon-start attribute': '<a :b="1"/>',
	'pi with gt then element': '<?pi a > b?><root/>',
}

// Inputs that end inside a construct or with an element open: parseXmlWith rejects them
const TRUNCATED = new Set([
	'truncated attribute name', 'truncated after equals', 'truncated in quoted value', 'unterminated attribute value at end',
	'unclosed element', 'unclosed element with text', 'unterminated close tag', 'unterminated close tag with text',
	'unterminated close tag nested', 'truncated nested close tag with child', 'truncated close slash after element',
	'truncated mismatched close tag', 'bare close slash', 'unterminated declaration', 'unterminated pi inside',
	'lone lt at end', 'truncated tag name', 'truncated exclamation', 'truncated cdata prefix', 'truncated comment',
	'truncated cdata', 'truncated doctype',
])

const OPTION_SETS: Record<string, XmlParseOptions> = {
	default: {},
	keepWhitespace: { keepWhitespace: true },
	keepComments: { keepComments: true },
	includeParentElement: { includeParentElement: true },
	all: { keepWhitespace: true, keepComments: true, includeParentElement: true },
	pos3: { pos: 3 },
}

type Outcome = { value: XmlNode } | { error: string }

function outcome(fn: () => XmlNode): Outcome {
	try {
		return { value: fn() }
	}
	catch (error) {
		return { error: error instanceof Error ? error.message : String(error) }
	}
}

const rootOf = (result: Outcome): XmlNode => {
	ok('value' in result, 'expected a tree, got an error: ' + ('error' in result ? result.error : ''))
	return result.value.childNodes[0]
}

/**
 * Where the prototype's output legitimately differs from main, with the reason and a check of the new output.
 * `options` lists the option sets where the difference shows; the others must still be identical.
 */
type Difference = { reason: string; options?: string[]; check: (proto: Outcome) => void }

const EXPECTED_DIFFERENCES: Record<string, Difference> = {
	'digits and underscore attrs': {
		reason: 'an attribute name may start with "_" (NameStartChar); main skipped the "_" and read "c"',
		options: ['default', 'keepWhitespace', 'keepComments', 'includeParentElement', 'all'],
		check: proto => deepStrictEqual(rootOf(proto).attributes, { b: 'x', _c: 'y', d: 'z' }),
	},
	'non-letter attribute name then letter': {
		reason: 'U+1F600 is a NameStartChar; main skipped it',
		options: ['default', 'keepWhitespace', 'keepComments', 'includeParentElement', 'all'],
		check: proto => deepStrictEqual(rootOf(proto).attributes, { '😀': 'x', b: 'y' }),
	},
	'colon-start attribute': {
		reason: 'an attribute name may start with ":" (NameStartChar); main skipped it',
		options: ['default', 'keepWhitespace', 'keepComments', 'includeParentElement', 'all'],
		check: proto => deepStrictEqual(rootOf(proto).attributes, { ':b': '1' }),
	},
	'pi with gt in value': {
		reason: 'a processing instruction ends at "?>"; main ended it at the first ">" and reported "y?>" as text',
		options: ['default', 'keepWhitespace', 'keepComments', 'includeParentElement', 'all'],
		check: proto => strictEqual(rootOf(proto).childNodes.length, 0),
	},
	'pi with gt then element': {
		reason: 'a processing instruction ends at "?>"; main reported " b?>" as document-level text',
		options: ['default', 'keepWhitespace', 'keepComments', 'includeParentElement', 'all'],
		check: proto => {
			ok('value' in proto)
			deepStrictEqual(proto.value.childNodes.map(node => node.nodeName), ['root'])
		},
	},
	'doctype with quoted gt': {
		reason: 'a ">" inside a quoted literal does not end the doctype; main split it there',
		options: ['default', 'keepWhitespace', 'keepComments', 'includeParentElement', 'all'],
		check: proto => {
			ok('value' in proto)
			deepStrictEqual(proto.value.childNodes.map(node => node.nodeValue ?? node.nodeName), ['!DOCTYPE a SYSTEM "x>y"', 'a'])
		},
	},
	'truncated comment': {
		reason: 'comments are delivered as inner text and the tree builder adds the delimiters, also to a comment cut off by the end of input',
		options: ['keepComments', 'all'],
		check: proto => strictEqual(rootOf(proto).childNodes[0].nodeValue, '<!-- x-->'),
	},
	'comments': {
		reason: '"<!--->" has no inner text and is reported as "<!---->"',
		options: ['keepComments', 'all'],
		check: proto => {
			strictEqual(rootOf(proto).childNodes[3].nodeValue, '<!---->')
			strictEqual(rootOf(proto).childNodes[5].nodeValue, '<!---->')
		},
	},
}

let checks = 0
let failures = 0
function check(label: string, fn: () => void): void {
	checks++
	try {
		fn()
	}
	catch (error) {
		failures++
		const message = error instanceof Error ? error.message : String(error)
		console.log('FAIL ' + label + '\n  ' + message.split('\n').slice(0, 8).join('\n  '))
	}
}

// 1. Parity with main
let observedDifferences = 0
for (const [name, input] of Object.entries(CORPUS)) {
	for (const [optionName, options] of Object.entries(OPTION_SETS)) {
		check(`parity: ${name} [${optionName}]`, () => {
			const expected = outcome(() => mainParseXml(input, { ...options }))
			const actual = outcome(() => parseXml(input, { ...options }))
			const difference = EXPECTED_DIFFERENCES[name]
			if (difference !== undefined && (difference.options ?? Object.keys(OPTION_SETS)).includes(optionName)) {
				observedDifferences++
				difference.check(actual)
				return
			}
			deepStrictEqual(actual, expected)
		})
	}
}

// Errors are XmlParseError instances with the same message text
check('parity: errors are XmlParseError with the same text', () => {
	for (const [name, input] of Object.entries(CORPUS)) {
		if (EXPECTED_DIFFERENCES[name] !== undefined) {
			continue
		}
		const expected = outcome(() => mainParseXml(input))
		if ('error' in expected) {
			throws(() => parseXml(input), (error: unknown) => error instanceof XmlParseError && error.message === expected.error, name)
		}
	}
})

// 2. parseXmlWith: strict on truncated input, identical to parseXml otherwise
const treeBuilder = createTreeBuilder(false, false, false)
const treeBuilderWs = createTreeBuilder(true, false, false)
for (const [name, input] of Object.entries(CORPUS)) {
	if (TRUNCATED.has(name)) {
		check(`parseXmlWith rejects: ${name}`, () => {
			throws(() => parseXmlWith(input, treeBuilder), (error: unknown) => error instanceof XmlParseError)
		})
	}
	else {
		check(`parseXmlWith equals parseXml: ${name}`, () => {
			deepStrictEqual(outcome(() => parseXmlWith(input, treeBuilder)), outcome(() => parseXml(input)))
			deepStrictEqual(outcome(() => parseXmlWith(input, treeBuilderWs, { keepWhitespace: true })), outcome(() => parseXml(input, { keepWhitespace: true })))
		})
	}
}
check('parseXmlWith: unclosed element names the element', () => {
	throws(() => parseXmlWith('<MPD><Period>', treeBuilder), /Unexpected end of input inside <Period>/)
})
check('parseXmlWith: truncated start tag', () => {
	throws(() => parseXmlWith('<MPD><Peri', treeBuilder), /Unexpected end of input inside a start tag/)
})

// 3. The builder contract
type Rec = { name: string }
type Log = (string | Record<string, string>)[][]

function recording(skip?: string): { builder: XmlBuilder<Rec, Rec>; log: Log } {
	const log: Log = []
	const builder: XmlBuilder<Rec, Rec> = {
		createDocument: () => ({ name: '#document' }),
		createElement: (parent, name, attributes) => {
			if (name === skip) {
				log.push(['skip', parent.name, name])
				return undefined
			}
			log.push(['element', parent.name, name, attributes])
			return { name }
		},
		appendChild: (parent, child, name) => { log.push(['child', parent.name, child.name, name]) },
		appendText: (parent, text, name) => { log.push(['text', parent.name, text, name]) },
		appendComment: (parent, text, name) => { log.push(['comment', parent.name, text, name]) },
		appendDoctype: (parent, text, name) => { log.push(['doctype', parent.name, text, name]) },
	}
	return { builder, log }
}

check('contract: root injection skips createDocument and end returns the root', () => {
	const root = { name: 'injected' }
	let created = 0
	const builder: XmlBuilder<Rec> = {
		createDocument: () => { created++; return { name: 'made' } },
		createElement: (_parent, name) => ({ name }),
	}
	strictEqual(parseXmlWith('<a/>', builder, { root }), root)
	strictEqual(created, 0)
	strictEqual(parseXmlWith('<a/>', builder).name, 'made')
	throws(() => parseXmlWith('<a/>', { createElement: (_parent, name) => ({ name }) }), /provide options.root or builder.createDocument/)
})

check('contract: names on the append callbacks', () => {
	const { builder, log } = recording()
	parseXmlWith('<r><a>t</a><b/></r>', builder)
	deepStrictEqual(log, [
		['element', '#document', 'r', {}],
		['element', 'r', 'a', {}],
		['text', 'a', 't', 'a'],
		['child', 'r', 'a', 'a'],
		['element', 'r', 'b', {}],
		['child', 'r', 'b', 'b'],
		['child', '#document', 'r', 'r'],
	])
})

check('contract: returning undefined skips the element and everything inside it', () => {
	const { builder, log } = recording('skip')
	parseXmlWith('<r><skip a="1"><x>t<!-- c --></x></skip><y/></r>', builder)
	deepStrictEqual(log, [
		['element', '#document', 'r', {}],
		['skip', 'r', 'skip'],
		['element', 'r', 'y', {}],
		['child', 'r', 'y', 'y'],
		['child', '#document', 'r', 'r'],
	])
	throws(() => parseXmlWith('<r><skip><x></y></skip></r>', recording('skip').builder), /Unexpected close tag/)
})

check('contract: text is delivered untrimmed, blank runs only with keepWhitespace', () => {
	const texts = (input: string, keepWhitespace = false): string[] => {
		const { builder, log } = recording()
		parseXmlWith(input, builder, { keepWhitespace })
		return log.filter(entry => entry[0] === 'text').map(entry => entry[2] as string)
	}
	deepStrictEqual(texts('<p>Hello <b>x</b> world</p>'), ['Hello ', 'x', ' world'])
	deepStrictEqual(texts('<a>\n  <b/>\n</a>'), [])
	deepStrictEqual(texts('<a>\n  <b/>\n</a>', true), ['\n  ', '\n'])
	deepStrictEqual(texts('<a>a &amp; b</a>'), ['a & b'])
})

check('contract: CDATA falls back to appendText', () => {
	const { builder, log } = recording()
	parseXmlWith('<a><![CDATA[ <x>&amp; ]]></a>', builder)
	deepStrictEqual(log.filter(entry => entry[0] === 'text'), [['text', 'a', ' <x>&amp; ', 'a']])
})

check('contract: comments and doctypes are delivered as inner text', () => {
	const { builder, log } = recording()
	parseXmlWith('<!DOCTYPE html PUBLIC "a>b"><a><!-- c --></a>', builder)
	deepStrictEqual(log.filter(entry => entry[0] === 'doctype' || entry[0] === 'comment'), [
		['doctype', '#document', 'DOCTYPE html PUBLIC "a>b"', ''],
		['comment', 'a', ' c ', 'a'],
	])
})

check('contract: XmlParseError carries offset, line, and column', () => {
	const input = '<a>\n<b></c></a>'
	try {
		parseXmlWith(input, treeBuilder)
		ok(false, 'expected a throw')
	}
	catch (error) {
		ok(error instanceof XmlParseError)
		strictEqual(error.offset, input.indexOf('</c>') + 3)
		strictEqual(error.line, 1)
		strictEqual(error.column, 7)
		ok(error.message.startsWith('Unexpected close tag\nLine: 1\nColumn: 7\nChar: >'))
	}
})

// 4. dash.js: the faithful one-pass builder equals parseXml + processNode
for (const name of ['synthetic pretty', 'synthetic closed', 'bbb_30fps.mpd', 'livesim2 real']) {
	check(`dash: ${name} faithful one pass equals today`, () => {
		deepStrictEqual(dashOnePassFaithful(CORPUS[name]), dashToday(mainParseXml, CORPUS[name]))
	})
}
check('dash: namespaced, cdata, and mixed content match today', () => {
	const input = '<ns:MPD xmlns:ns="x" minBufferTime="PT2S" availabilityStartTime="2020-01-01T00:00:00Z"><Period id="1" start="PT0S"><AdaptationSet lang="en" id="7"><Representation id="1" bandwidth="100"/><Representation id="2" bandwidth="200"/></AdaptationSet><ns:Foo>text<![CDATA[raw]]>more</ns:Foo><Location>http://a</Location><Location>http://b</Location></Period></ns:MPD>'
	deepStrictEqual(dashOnePassFaithful(input), dashToday(mainParseXml, input))
})

console.log(`${checks} checks, ${failures} failures, ${observedDifferences} expected differences observed`)
process.exit(failures === 0 ? 0 : 1)
