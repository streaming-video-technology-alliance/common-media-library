import type { XmlNode, XmlParseOptions } from '@svta/cml-xml'
import { deepStrictEqual, ok, strictEqual } from 'node:assert'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { before, describe, it } from 'node:test'
import { generateMpd } from '../bench/generate.ts'
import { runParseWorker, type ParseOutcome } from './parseXmlWorker.ts'

/**
 * Parity corpus for `parseXml`. Every input is parsed with each option set and compared to the output
 * captured from the parser on `main` at dddbe4952 (#430), stored in `fixtures/parseXml.equivalence.json`.
 * Trees whose serialized form is longer than INLINE_LIMIT characters are stored as a SHA-256 digest.
 * `parentElement` is serialized as the child-index path of the parent from the document.
 *
 * Regenerate the fixture from the parser under test with `UPDATE_FIXTURES=1 npm test -w libs/xml`.
 */

const FIXTURE_PATH = resolve('./test/fixtures/parseXml.equivalence.json')
const INLINE_LIMIT = 2000

const fixture = (name: string): string => readFileSync(resolve('./test/fixtures/', name), 'utf8')

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
}

const OPTION_SETS: Record<string, XmlParseOptions> = {
	default: {},
	keepWhitespace: { keepWhitespace: true },
	keepComments: { keepComments: true },
	includeParentElement: { includeParentElement: true },
	all: { keepWhitespace: true, keepComments: true, includeParentElement: true },
	pos3: { pos: 3 },
}

type Expectation = { throws: string } | { sha256: string; length: number } | { tree: unknown }

type CaseFixture = {
	input: { length: number; sha256: string };
	results: Record<string, Expectation>;
}

const sha256 = (text: string): string => createHash('sha256').update(text).digest('hex')

/**
 * Copies a node field by field in its own key order, replacing `childNodes` with serialized children
 * and `parentElement` with the parent's path, so that `JSON.stringify` of the result is a complete
 * and cycle-free description of the tree.
 */
function serializeNode(node: XmlNode, path: number[], paths: Map<XmlNode, number[]>): Record<string, unknown> {
	paths.set(node, path)
	const out: Record<string, unknown> = {}

	for (const key of Object.keys(node)) {
		if (key === 'childNodes') {
			out[key] = node.childNodes.map((child, index) => serializeNode(child, [...path, index], paths))
		}
		else if (key === 'parentElement') {
			const parent = node.parentElement
			if (parent === null) {
				out[key] = null
			}
			else {
				const parentPath = parent === undefined ? undefined : paths.get(parent)
				ok(parentPath !== undefined, `parentElement of node at [${path.join(',')}] is not an ancestor node`)
				out[key] = parentPath
			}
		}
		else {
			out[key] = node[key as keyof XmlNode]
		}
	}

	return out
}

function serializeOutcome(outcome: ParseOutcome<XmlNode>): { throws: string } | { json: string } {
	if ('error' in outcome) {
		return { throws: outcome.error }
	}
	return { json: JSON.stringify(serializeNode(outcome.result, [], new Map())) }
}

function toExpectation(outcome: ParseOutcome<XmlNode>): Expectation {
	const serialized = serializeOutcome(outcome)
	if ('throws' in serialized) {
		return serialized
	}
	if (serialized.json.length > INLINE_LIMIT) {
		return { sha256: sha256(serialized.json), length: serialized.json.length }
	}
	return { tree: JSON.parse(serialized.json) }
}

function check(outcome: ParseOutcome<XmlNode>, expected: Expectation, label: string): void {
	const actual = serializeOutcome(outcome)

	if ('throws' in expected) {
		ok('throws' in actual, `${label}: expected an error but parseXml returned a tree`)
		strictEqual(actual.throws, expected.throws, `${label}: error message differs`)
		return
	}

	ok('json' in actual, `${label}: expected a tree but parseXml threw: ${'throws' in actual ? actual.throws : ''}`)

	if ('sha256' in expected) {
		strictEqual(actual.json.length, expected.length, `${label}: serialized tree length differs`)
		strictEqual(sha256(actual.json), expected.sha256, `${label}: serialized tree digest differs`)
		return
	}

	if (actual.json !== JSON.stringify(expected.tree)) {
		deepStrictEqual(JSON.parse(actual.json), expected.tree, `${label}: tree differs`)
		strictEqual(actual.json, JSON.stringify(expected.tree), `${label}: key order differs`)
	}
}

/**
 * Formats the fixture file with one line per expectation, so a change to one input and option set
 * shows as a one-line diff.
 */
function formatFixtures(fixtures: Record<string, CaseFixture>): string {
	const lines = ['{']
	const cases = Object.entries(fixtures)

	cases.forEach(([name, entry], caseIndex) => {
		lines.push(`\t${JSON.stringify(name)}: {`)
		lines.push(`\t\t"input": ${JSON.stringify(entry.input)},`)
		lines.push('\t\t"results": {')
		const results = Object.entries(entry.results)
		results.forEach(([label, expectation], index) => {
			lines.push(`\t\t\t${JSON.stringify(label)}: ${JSON.stringify(expectation)}${index < results.length - 1 ? ',' : ''}`)
		})
		lines.push('\t\t}')
		lines.push(`\t}${caseIndex < cases.length - 1 ? ',' : ''}`)
	})

	lines.push('}', '')
	return lines.join('\n')
}

describe('parseXml equivalence', () => {
	const names = Object.keys(CORPUS)
	const inputs = Object.values(CORPUS)
	const optionLabels = Object.keys(OPTION_SETS)
	const outcomes: ParseOutcome<XmlNode>[][] = []
	let fixtures: Record<string, CaseFixture> = {}

	before(async () => {
		outcomes.push(...await Promise.all(optionLabels.map(label => runParseWorker({ inputs }, OPTION_SETS[label]))))

		if (process.env['UPDATE_FIXTURES']) {
			fixtures = {}
			names.forEach((name, index) => {
				const results: Record<string, Expectation> = {}
				optionLabels.forEach((label, option) => {
					results[label] = toExpectation(outcomes[option][index])
				})
				fixtures[name] = { input: { length: inputs[index].length, sha256: sha256(inputs[index]) }, results }
			})
			writeFileSync(FIXTURE_PATH, formatFixtures(fixtures))
		}
		else {
			fixtures = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8'))
		}
	})

	it('has a fixture for every corpus input and no stale fixtures', () => {
		deepStrictEqual(Object.keys(fixtures), names)
	})

	names.forEach((name, index) => {
		it(name, () => {
			const expected = fixtures[name]
			ok(expected !== undefined, 'no fixture; run with UPDATE_FIXTURES=1 to capture it')
			strictEqual(sha256(inputs[index]), expected.input.sha256, 'the corpus input changed; recapture the fixture')

			optionLabels.forEach((label, option) => {
				check(outcomes[option][index], expected.results[label], `${name} with ${label}`)
			})
		})
	})
})
