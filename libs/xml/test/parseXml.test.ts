import { parseXml } from '@svta/cml-xml'
import assert, { equal, strictEqual } from 'node:assert'
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
})
