import { parseXml } from '@svta/cml-xml'
import assert, { deepStrictEqual, equal, strictEqual, throws } from 'node:assert'
import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it } from 'node:test'

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
		it('parses a valueless attribute as an empty string', () => {
			const doc = parseXml('<a b>')
			const a = doc.childNodes[0]

			equal(a.nodeName, 'a')
			deepStrictEqual(a.attributes, { b: '' })
			equal(a.childNodes.length, 0)
		})

		it('parses a valueless attribute after a quoted attribute', () => {
			const doc = parseXml('<a b="c" d>')
			deepStrictEqual(doc.childNodes[0].attributes, { b: 'c', d: '' })
		})

		it('parses a valueless attribute in a self-closing child', () => {
			const doc = parseXml('<a b="c"><d e/></a>')
			const a = doc.childNodes[0]

			equal(a.childNodes.length, 1)
			equal(a.childNodes[0].nodeName, 'd')
			deepStrictEqual(a.childNodes[0].attributes, { e: '' })
			equal(a.childNodes[0].childNodes.length, 0)
		})

		it('does not swallow markup following a valueless attribute', () => {
			const doc = parseXml('<a b><c d="1"/></a>')
			const a = doc.childNodes[0]

			deepStrictEqual(a.attributes, { b: '' })
			equal(a.childNodes.length, 1)
			equal(a.childNodes[0].nodeName, 'c')
			deepStrictEqual(a.childNodes[0].attributes, { d: '1' })
		})

		it('parses an unquoted attribute value as an empty string', () => {
			const doc = parseXml('<a b=c/>')
			const a = doc.childNodes[0]

			equal(a.nodeName, 'a')
			deepStrictEqual(a.attributes, { b: '' })
			equal(a.childNodes.length, 0)
		})

		it('terminates when the input ends inside an attribute name', () => {
			const doc = parseXml('<MPD><Period><SegmentTimeline><S d="180000" r')
			const s = doc.childNodes[0].childNodes[0].childNodes[0].childNodes[0]

			equal(s.nodeName, 'S')
			deepStrictEqual(s.attributes, { d: '180000', r: '' })
		})

		it('terminates when the input ends after an attribute equals sign', () => {
			const doc = parseXml('<a b=')
			deepStrictEqual(doc.childNodes[0].attributes, { b: '' })
		})

		it('throws when the input ends inside a quoted attribute value', () => {
			throws(() => parseXml('<MPD><Period><S d="1'), /Missing closing quote/)
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
})
