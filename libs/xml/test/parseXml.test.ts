import { parseXml, type XmlNode, type XmlParseOptions } from '@svta/cml-xml'
import assert, { deepStrictEqual, equal, rejects, strictEqual } from 'node:assert'
import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it } from 'node:test'
import { Worker } from 'node:worker_threads'

const PARSE_XML_URL = import.meta.resolve('@svta/cml-xml')
const PARSE_TIMEOUT_MS = 2000

const WORKER_SOURCE = `
const { parentPort, workerData } = require('node:worker_threads')
import(workerData.url).then(({ parseXml }) => {
	workerData.inputs.forEach((input, index) => {
		parentPort.postMessage({ index })
		try {
			parentPort.postMessage({ index, result: parseXml(input, workerData.options) })
		}
		catch (error) {
			parentPort.postMessage({ index, error: error.message })
		}
	})
})
`

type ParseOutcome = { result: XmlNode } | { error: string }

type ParseMessage = {
	index: number;
	result?: XmlNode;
	error?: string;
}

/**
 * Parses each input in a worker thread so that a parser that never returns fails the test
 * instead of hanging the test runner.
 */
function parseXmlInWorker(inputs: string[], options?: XmlParseOptions): Promise<ParseOutcome[]> {
	return new Promise((done, fail) => {
		const worker = new Worker(WORKER_SOURCE, { eval: true, execArgv: [], workerData: { url: PARSE_XML_URL, inputs, options } })
		const outcomes: ParseOutcome[] = []
		let current = 0
		let timer: ReturnType<typeof setTimeout>

		const settle = (callback: () => void) => {
			clearTimeout(timer)
			void worker.terminate()
			callback()
		}

		const watch = () => {
			clearTimeout(timer)
			timer = setTimeout(() => {
				settle(() => fail(new Error(`parseXml did not return within ${PARSE_TIMEOUT_MS}ms for ${JSON.stringify(inputs[current])}`)))
			}, PARSE_TIMEOUT_MS)
		}

		worker.on('message', (message: ParseMessage) => {
			current = message.index
			if (message.error !== undefined) {
				outcomes.push({ error: message.error })
			}
			else if (message.result !== undefined) {
				outcomes.push({ result: message.result })
			}

			if (outcomes.length === inputs.length) {
				settle(() => done(outcomes))
			}
			else {
				watch()
			}
		})
		worker.on('error', (error) => settle(() => fail(error)))
		watch()
	})
}

/**
 * Parses a single input in a worker thread, rethrowing any parse error.
 */
async function parseXmlGuarded(input: string, options?: XmlParseOptions): Promise<XmlNode> {
	const [outcome] = await parseXmlInWorker([input], options)
	if ('error' in outcome) {
		throw new Error(outcome.error)
	}
	return outcome.result
}

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
		it('parses a valueless attribute as an empty string', async () => {
			const doc = await parseXmlGuarded('<a b>')
			const a = doc.childNodes[0]

			equal(a.nodeName, 'a')
			deepStrictEqual(a.attributes, { b: '' })
			equal(a.childNodes.length, 0)
		})

		it('parses a valueless attribute after a quoted attribute', async () => {
			const doc = await parseXmlGuarded('<a b="c" d>')
			deepStrictEqual(doc.childNodes[0].attributes, { b: 'c', d: '' })
		})

		it('parses a valueless attribute in a self-closing child', async () => {
			const doc = await parseXmlGuarded('<a b="c"><d e/></a>')
			const a = doc.childNodes[0]

			equal(a.childNodes.length, 1)
			equal(a.childNodes[0].nodeName, 'd')
			deepStrictEqual(a.childNodes[0].attributes, { e: '' })
			equal(a.childNodes[0].childNodes.length, 0)
		})

		it('does not swallow markup following a valueless attribute', async () => {
			const doc = await parseXmlGuarded('<a b><c d="1"/></a>')
			const a = doc.childNodes[0]

			deepStrictEqual(a.attributes, { b: '' })
			equal(a.childNodes.length, 1)
			equal(a.childNodes[0].nodeName, 'c')
			deepStrictEqual(a.childNodes[0].attributes, { d: '1' })
		})

		it('parses an unquoted attribute value as an empty string', async () => {
			const doc = await parseXmlGuarded('<a b=c/>')
			const a = doc.childNodes[0]

			equal(a.nodeName, 'a')
			deepStrictEqual(a.attributes, { b: '' })
			equal(a.childNodes.length, 0)
		})

		it('terminates when the input ends inside an attribute name', async () => {
			const doc = await parseXmlGuarded('<MPD><Period><SegmentTimeline><S d="180000" r')
			const s = doc.childNodes[0].childNodes[0].childNodes[0].childNodes[0]

			equal(s.nodeName, 'S')
			deepStrictEqual(s.attributes, { d: '180000', r: '' })
		})

		it('terminates when the input ends after an attribute equals sign', async () => {
			const doc = await parseXmlGuarded('<a b=')
			deepStrictEqual(doc.childNodes[0].attributes, { b: '' })
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

		it('terminates on every truncation of the fixtures', async () => {
			for (const fixture of ['./test/fixtures/node_types.xml', './test/fixtures/bbb_30fps.mpd']) {
				const xml = await fs.readFile(resolve(fixture), 'utf8')
				const prefixes = Array.from({ length: xml.length + 1 }, (_, end) => xml.slice(0, end))
				const outcomes = await parseXmlInWorker(prefixes)

				equal(outcomes.length, prefixes.length)
				assert('result' in outcomes[prefixes.length - 1], `${fixture} did not parse in full`)
			}
		})
	})
})
