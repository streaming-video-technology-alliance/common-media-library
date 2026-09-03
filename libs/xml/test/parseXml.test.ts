import { parseXml } from '@svta/cml-xml'
import assert, { deepStrictEqual, equal, rejects, strictEqual, throws } from 'node:assert'
import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it } from 'node:test'
import { parseXmlGuarded, runParseWorker } from './parseXmlWorker.ts'

describe('parseXml', () => {
	it('provides a valid example', async () => {
		//#region example
		const obj = parseXml(
			`<root>
				<child>text</child>
				<ns:tag>content</ns:tag>
			</root>`,
		)
		assert(obj.childNodes[0].nodeName === 'root')
		assert(obj.childNodes[0].childNodes[0].nodeName === 'child')
		assert(obj.childNodes[0].childNodes[0].childNodes[0].nodeValue === 'text')
		assert(obj.childNodes[0].childNodes[1].nodeName === 'ns:tag')
		assert(obj.childNodes[0].childNodes[1].prefix === 'ns')
		assert(obj.childNodes[0].childNodes[1].localName === 'tag')
		//#endregion example
	})

	it('parses DASH manifest', async () => {
		const xml = await fs.readFile(resolve('./test/fixtures/bbb_30fps.mpd'), 'utf8')
		const doc = parseXml(xml)
		const { childNodes } = doc

		equal(childNodes.length, 1)

		const root = childNodes[0]

		equal(root.nodeName, 'MPD')
		equal(root.attributes['profiles'], 'urn:hbbtv:dash:profile:isoff-live:2012,urn:mpeg:dash:profile:isoff-live:2011')

		const firstChild = root.childNodes[0]
		equal(firstChild.childNodes[0].nodeValue, './')
	})

	it('parses all node types', async () => {
		const xml = await fs.readFile(resolve('./test/fixtures/node_types.xml'), 'utf8')
		const doc = parseXml(xml)
		const { childNodes } = doc
		equal(childNodes.length, 2)

		const doctype = childNodes[0].nodeValue
		equal(doctype, '!DOCTYPE html PUBLIC "-//W3C//DTD XHTML Basic 1.1//EN" "http://www.w3.org/TR/xhtml-basic/xhtml-basic11.dtd"')

		const root = childNodes[1]
		const firstChild = root.childNodes[0]
		equal(firstChild.childNodes[0].nodeValue, 'https://www.sample.com?test=123&hello=world')

		const htmlEntities = root.childNodes[1]
		equal(htmlEntities.childNodes[0].nodeValue, `&,<,>,",',\u{a0},\u{200e},\u{200f}`)
		equal(htmlEntities.attributes['test'], `&,<,>,",',\u{a0},\u{200e},\u{200f}`)

		const namespace = root.childNodes[2]
		equal(namespace.nodeName, `tt:Text`)
		equal(namespace.prefix, `tt`)
		equal(namespace.localName, `Text`)
	})

	it('parses elements nested deeper than the call stack allows', () => {
		const depth = 100000
		const doc = parseXml('<a>'.repeat(depth) + 'x' + '</a>'.repeat(depth))
		let node = doc.childNodes[0]
		let count = 1

		while (node.childNodes[0].nodeName === 'a') {
			node = node.childNodes[0]
			count++
		}

		equal(count, depth)
		equal(node.childNodes[0].nodeValue, 'x')
	})

	describe('close tags', () => {
		it('throws on a close tag whose name differs from the open tag', () => {
			throws(() => parseXml('<a>text</b>'), /Unexpected close tag/)
		})

		it('throws on a close tag whose name extends the open tag name', () => {
			throws(() => parseXml('<ab>text</abc>'), /Unexpected close tag/)
		})

		it('does not let a longer close tag close a shorter open tag', () => {
			throws(() => parseXml('<a>text</ab>'), /Unexpected close tag/)
		})

		it('throws on a close tag with no open element', () => {
			throws(() => parseXml('<a/></b>'), /Unexpected close tag/)
		})

		it('throws on an empty close tag with no open element', () => {
			throws(() => parseXml('<a/></>'), /Unexpected close tag/)
			throws(() => parseXml('<a/></ ><b/>'), /Unexpected close tag/)
		})

		it('closes an element when a space precedes the closing bracket', () => {
			const doc = parseXml('<a>text</a >')
			const a = doc.childNodes[0]

			equal(doc.childNodes.length, 1)
			equal(a.nodeName, 'a')
			equal(a.childNodes[0].nodeValue, 'text')
		})

		it('closes an element when tabs and line breaks precede the closing bracket', () => {
			const doc = parseXml('<a>text</a\t\r\n>')
			equal(doc.childNodes[0].childNodes[0].nodeValue, 'text')
		})

		it('closes nested elements whose names share a prefix', () => {
			const doc = parseXml('<a><ab>text</ab></a>')
			const a = doc.childNodes[0]

			equal(a.nodeName, 'a')
			equal(a.childNodes[0].nodeName, 'ab')
			equal(a.childNodes[0].childNodes[0].nodeValue, 'text')
		})
	})

	describe('includeParentElement option', () => {
		it('does not include parentElement by default', () => {
			const doc = parseXml('<root><child/></root>')
			equal('parentElement' in doc, false)
			equal('parentElement' in doc.childNodes[0], false)
		})

		it('sets parentElement to null on document node', () => {
			const doc = parseXml('<root/>', { includeParentElement: true })
			strictEqual(doc.parentElement, null)
		})

		it('sets parentElement to null for direct children of document (since #document is not an element)', () => {
			const doc = parseXml('<root/>', { includeParentElement: true })
			const root = doc.childNodes[0]
			strictEqual(root.parentElement, null)
		})

		it('sets parentElement to parent element for nested elements', () => {
			const doc = parseXml('<root><child><grandchild/></child></root>', { includeParentElement: true })
			const root = doc.childNodes[0]
			const child = root.childNodes[0]
			const grandchild = child.childNodes[0]

			strictEqual(child.parentElement, root)
			strictEqual(grandchild.parentElement, child)
		})

		it('sets parentElement correctly for text nodes', () => {
			const doc = parseXml('<root>text content</root>', { includeParentElement: true })
			const root = doc.childNodes[0]
			const textNode = root.childNodes[0]

			equal(textNode.nodeName, '#text')
			strictEqual(textNode.parentElement, root)
		})

		it('sets parentElement correctly for CDATA nodes', () => {
			const doc = parseXml('<root><![CDATA[some data]]></root>', { includeParentElement: true })
			const root = doc.childNodes[0]
			const cdataNode = root.childNodes[0]

			equal(cdataNode.nodeName, '#cdata')
			strictEqual(cdataNode.parentElement, root)
		})

		it('sets parentElement correctly for comment nodes', () => {
			const doc = parseXml('<root><!-- comment --></root>', { includeParentElement: true, keepComments: true })
			const root = doc.childNodes[0]
			const commentNode = root.childNodes[0]

			equal(commentNode.nodeName, '#comment')
			strictEqual(commentNode.parentElement, root)
		})

		it('sets parentElement to null for doctype nodes (parent is #document)', () => {
			const doc = parseXml('<!DOCTYPE html><root/>', { includeParentElement: true })
			const doctype = doc.childNodes[0]

			equal(doctype.nodeName, '#doctype')
			strictEqual(doctype.parentElement, null)
		})

		it('maintains correct parent chain in deeply nested structure', () => {
			const doc = parseXml('<a><b><c><d/></c></b></a>', { includeParentElement: true })
			const a = doc.childNodes[0]
			const b = a.childNodes[0]
			const c = b.childNodes[0]
			const d = c.childNodes[0]

			strictEqual(a.parentElement, null)
			strictEqual(b.parentElement, a)
			strictEqual(c.parentElement, b)
			strictEqual(d.parentElement, c)
		})
	})

	describe('malformed attributes', () => {
		it('throws on a valueless attribute', async () => {
			await rejects(parseXmlGuarded('<a b>'), { message: /^Malformed attribute "b": expected "=" after name/ })
		})

		it('throws on a valueless attribute in a self-closing tag', async () => {
			await rejects(parseXmlGuarded('<a b/>'), { message: /^Malformed attribute "b": expected "=" after name/ })
		})

		it('throws on a valueless attribute after a quoted attribute', async () => {
			await rejects(parseXmlGuarded('<a b="c" d>'), { message: /^Malformed attribute "d": expected "=" after name/ })
		})

		it('throws on an unquoted attribute value', async () => {
			await rejects(parseXmlGuarded('<a b=c/>'), { message: /^Malformed attribute "b": expected quoted value after "="/ })
		})

		it('throws on a quoted value with no equals sign', async () => {
			await rejects(parseXmlGuarded('<a b "c"/>'), { message: /^Malformed attribute "b": expected "=" after name/ })
		})

		it('reports the valueless attribute, not the element that follows it', async () => {
			await rejects(parseXmlGuarded('<a b><c d="1"/></a>'), { message: /^Malformed attribute "b"/ })
		})

		it('throws when the input ends inside an attribute name', async () => {
			await rejects(
				parseXmlGuarded('<MPD><Period><SegmentTimeline><S d="180000" r'),
				{ message: /^Malformed attribute "r": expected "=" after name\n.*\n.*\nChar: end of input$/ },
			)
		})

		it('throws when the input ends after the equals sign', async () => {
			await rejects(
				parseXmlGuarded('<a b='),
				{ message: /^Malformed attribute "b": expected quoted value after "="\nLine: 0\nColumn: 6\nChar: end of input$/ },
			)
		})

		it('reports the line and column of the malformed attribute', async () => {
			await rejects(parseXmlGuarded('<root>\n\t<a b>'), { message: /\nLine: 1\nColumn: 6\nChar: >$/ })
		})

		it('throws when the input ends inside a quoted attribute value', async () => {
			await rejects(parseXmlGuarded('<MPD><Period><S d="1'), /Missing closing quote/)
		})
	})

	describe('well-formed attributes', () => {
		it('parses double- and single-quoted values', () => {
			const doc = parseXml(`<a b="c" d='e'>text</a>`)
			const a = doc.childNodes[0]

			deepStrictEqual(a.attributes, { b: 'c', d: 'e' })
			equal(a.childNodes[0].nodeValue, 'text')
		})

		it('allows whitespace around the equals sign', () => {
			const doc = parseXml('<a b = "c"\n\td\t=\n"e"/>')
			deepStrictEqual(doc.childNodes[0].attributes, { b: 'c', d: 'e' })
		})

		it('preserves markup characters inside quoted values', () => {
			const doc = parseXml(`<a b="x/>y" c='p>q'>t</a>`)
			const a = doc.childNodes[0]

			deepStrictEqual(a.attributes, { b: 'x/>y', c: 'p>q' })
			equal(a.childNodes[0].nodeValue, 't')
		})
	})

	describe('truncated input', () => {
		it('parses a complete XML declaration followed by markup', async () => {
			const doc = await parseXmlGuarded('<?xml version="1.0" encoding="UTF-8"?><a b="1"><c/>text</a>')
			deepStrictEqual(doc.childNodes, [{
				nodeName: 'a',
				nodeValue: null,
				attributes: { b: '1' },
				childNodes: [
					{ nodeName: 'c', nodeValue: null, attributes: {}, childNodes: [], prefix: null, localName: 'c' },
					{ nodeName: '#text', nodeValue: 'text', attributes: {}, childNodes: [] },
				],
				prefix: null,
				localName: 'a',
			}])
		})

		it('returns an empty document when the input ends inside the XML declaration', async () => {
			const doc = await parseXmlGuarded('<?xml version="1.0" encoding="UTF-8"')
			deepStrictEqual(doc.childNodes, [])
		})

		it('keeps the parsed children when the input ends inside the root close tag', async () => {
			const doc = await parseXmlGuarded('<a>text</a')
			deepStrictEqual(doc.childNodes, [{
				nodeName: 'a',
				nodeValue: null,
				attributes: {},
				childNodes: [{ nodeName: '#text', nodeValue: 'text', attributes: {}, childNodes: [] }],
				prefix: null,
				localName: 'a',
			}])
		})

		it('keeps the parsed children when the input ends inside a nested close tag', async () => {
			const doc = await parseXmlGuarded('<MPD><Period><S d="1"/></Period')
			deepStrictEqual(doc.childNodes, [{
				nodeName: 'MPD',
				nodeValue: null,
				attributes: {},
				childNodes: [{
					nodeName: 'Period',
					nodeValue: null,
					attributes: {},
					childNodes: [{ nodeName: 'S', nodeValue: null, attributes: { d: '1' }, childNodes: [], prefix: null, localName: 'S' }],
					prefix: null,
					localName: 'Period',
				}],
				prefix: null,
				localName: 'MPD',
			}])
		})

		it('keeps the parsed children when the input ends right after `</` at the document level', async () => {
			const doc = await parseXmlGuarded('<a/></')
			deepStrictEqual(doc.childNodes, [{ nodeName: 'a', nodeValue: null, attributes: {}, childNodes: [], prefix: null, localName: 'a' }])
		})

		it('reports end of input when a mismatched close tag is cut off', async () => {
			await rejects(
				parseXmlGuarded('<a>text</b'),
				{ message: /^Unexpected close tag\nLine: 0\nColumn: 11\nChar: end of input$/ },
			)
		})

		it('keeps a CDATA prefix cut off before its second bracket as a doctype node', async () => {
			const doc = await parseXmlGuarded('<a><![CDA')
			deepStrictEqual(doc.childNodes[0].childNodes, [{ nodeName: '#doctype', nodeValue: '![CDA', attributes: {}, childNodes: [] }])
		})

		it('keeps a lone `<!` at the end of the input as a doctype node', async () => {
			const doc = await parseXmlGuarded('<a><!')
			deepStrictEqual(doc.childNodes[0].childNodes, [{ nodeName: '#doctype', nodeValue: '!', attributes: {}, childNodes: [] }])
		})

		it('keeps the text before a lone `<` at the end of the input', async () => {
			const doc = await parseXmlGuarded('<a>x<')
			deepStrictEqual(doc.childNodes[0].childNodes, [
				{ nodeName: '#text', nodeValue: 'x', attributes: {}, childNodes: [] },
				{ nodeName: '', nodeValue: null, attributes: {}, childNodes: [], prefix: null, localName: '' },
			])
		})

		it('keeps an element whose start tag is cut off after its name', async () => {
			const doc = await parseXmlGuarded('<a><bc')
			deepStrictEqual(doc.childNodes[0].childNodes, [{ nodeName: 'bc', nodeValue: null, attributes: {}, childNodes: [], prefix: null, localName: 'bc' }])
		})

		it('keeps a doctype cut off before its closing bracket', async () => {
			const doc = await parseXmlGuarded('<!DOCTYPE html')
			deepStrictEqual(doc.childNodes, [{ nodeName: '#doctype', nodeValue: '!DOCTYPE html', attributes: {}, childNodes: [] }])
		})

		it('terminates on every truncation of the fixtures', async () => {
			for (const fixture of ['./test/fixtures/node_types.xml', './test/fixtures/bbb_30fps.mpd']) {
				const xml = await fs.readFile(resolve(fixture), 'utf8')
				const outcomes = await runParseWorker({ prefixesOf: xml })

				equal(outcomes.length, xml.length + 1)
				assert('result' in outcomes[xml.length], `${fixture} did not parse in full`)
			}
		})
	})
})
