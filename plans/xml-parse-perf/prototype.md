# Flat parseXml prototype

> **Status (2026-09-02):** kept as the record of the equivalence-verified flat rewrite at the time of the
> investigation. The implementation reference is now `plans/xml-incremental-parser/prototype.md`, whose
> scanner has the same shape plus three measured fixes (guarded end-of-input reads, no per-parse instance
> state, flat joins) and the builder indirection the RFC needs. Do not port this file; see `steps.md`.

Verified identical to `@svta/cml-xml` 1.1.6 output on the equivalence corpus (192 checks, 0 mismatches).
Plain JavaScript against the built utils bundle; port to TypeScript with repo style (tabs, single quotes,
no semicolons) and import `unescapeHtml` from `@svta/cml-utils`.

```js
import { unescapeHtml } from '@svta/cml-utils'

const LT = 60, GT = 62, SLASH = 47, QUESTION = 63, EXCL = 33, MINUS = 45, SQ = 39, DQ = 34, LSB = 91, RSB = 93, COLON = 58, AMP = 38, EQ = 61, SP = 32, NL = 10, CR = 13, TAB = 9

function textNode(value, nodeName) {
	return { nodeName, nodeValue: value, attributes: {}, childNodes: [] }
}

function setParentElements(node, parent) {
	node.parentElement = parent?.nodeName.startsWith('#') ? null : parent
	for (const child of node.childNodes) setParentElements(child, node)
}

function unexpectedCloseTag(input, pos) {
	const parsedText = input.substring(0, pos).split('\n')
	return new Error('Unexpected close tag\nLine: ' + (parsedText.length - 1) + '\nColumn: ' + (parsedText[parsedText.length - 1].length + 1) + '\nChar: ' + input[pos])
}

export function parseXml(input, options = {}) {
	let pos = options.pos || 0
	const length = input.length
	const keepComments = !!options.keepComments
	const keepWhitespace = !!options.keepWhitespace
	const includeParentElement = !!options.includeParentElement

	const document = { nodeName: '#document', nodeValue: null, childNodes: [], attributes: {} }
	const stack = []
	let current = document
	let children = document.childNodes
	let currentName = ''

	while (pos < length) {
		let cc = input.charCodeAt(pos)
		if (cc !== LT) {
			const start = pos
			let hasAmp = false
			let ws = true
			do {
				if (ws && cc !== SP && cc !== NL && cc !== CR && cc !== TAB) ws = false
				if (cc === AMP) hasAmp = true
				cc = input.charCodeAt(++pos)
			} while (pos < length && cc !== LT)
			if (keepWhitespace) {
				let text = input.slice(start, pos)
				if (hasAmp) text = unescapeHtml(text)
				if (text.length > 0) children.push(textNode(text, '#text'))
			}
			else if (!ws) {
				let text = input.slice(start, pos)
				if (hasAmp) text = unescapeHtml(text)
				text = text.trim()
				if (text.length > 0) children.push(textNode(text, '#text'))
			}
			continue
		}

		const next = input.charCodeAt(pos + 1)
		if (next === SLASH) {
			const end = input.indexOf('>', pos)
			if (!input.startsWith(currentName, pos + 2)) throw unexpectedCloseTag(input, end)
			pos = end === -1 ? length : end + 1
			if (stack.length === 0) break
			current = stack.pop()
			children = current.childNodes
			currentName = current === document ? '' : current.nodeName
			continue
		}
		if (next === QUESTION) {
			const end = input.indexOf('>', pos)
			pos = end === -1 ? length : end + 1
			continue
		}
		if (next === EXCL) {
			const third = input.charCodeAt(pos + 2)
			if (third === MINUS) {
				let p = pos
				while (p !== -1 && !(input.charCodeAt(p) === GT && input.charCodeAt(p - 1) === MINUS && input.charCodeAt(p - 2) === MINUS)) p = input.indexOf('>', p + 1)
				if (p === -1) p = length
				if (keepComments) children.push(textNode(input.substring(pos, p + 1), '#comment'))
				pos = p + 1
			}
			else if (third === LSB && input.charCodeAt(pos + 8) === LSB && input.startsWith('CDATA', pos + 3)) {
				const end = input.indexOf(']]>', pos)
				if (end === -1) {
					children.push(textNode(input.substring(pos + 9), '#cdata'))
					pos = length
				}
				else {
					children.push(textNode(input.substring(pos + 9, end), '#cdata'))
					pos = end + 3
				}
			}
			else {
				const start = pos + 1
				let p = pos + 2
				let bracket = false
				while (p < length && (input.charCodeAt(p) !== GT || bracket)) {
					const c2 = input.charCodeAt(p)
					if (c2 === LSB) bracket = true
					else if (bracket && c2 === RSB) bracket = false
					p++
				}
				children.push(textNode(input.substring(start, p), '#doctype'))
				pos = p + 1
			}
			continue
		}

		const nameStart = ++pos
		let nsIndex = -1
		cc = input.charCodeAt(pos)
		while (pos < length && !(cc === SP || cc === GT || cc === SLASH || cc === EQ || cc === NL || cc === CR || cc === TAB)) {
			if (cc === COLON && nsIndex === -1) nsIndex = pos - nameStart
			cc = input.charCodeAt(++pos)
		}
		const nodeName = input.slice(nameStart, pos)
		const attributes = {}
		while (pos < length && cc !== GT) {
			if ((cc > 64 && cc < 91) || (cc > 96 && cc < 123)) {
				const aStart = pos
				cc = input.charCodeAt(++pos)
				while (pos < length && !(cc === SP || cc === GT || cc === SLASH || cc === EQ || cc === NL || cc === CR || cc === TAB)) cc = input.charCodeAt(++pos)
				const name = input.slice(aStart, pos)
				while (pos < length && cc !== SQ && cc !== DQ && cc !== GT) cc = input.charCodeAt(++pos)
				let value = ''
				if (cc === SQ || cc === DQ) {
					const quote = cc
					const vStart = ++pos
					let hasAmp = false
					cc = input.charCodeAt(pos)
					while (pos < length && cc !== quote) {
						if (cc === AMP) hasAmp = true
						cc = input.charCodeAt(++pos)
					}
					if (pos >= length) throw new Error('Missing closing quote')
					value = input.slice(vStart, pos)
					if (hasAmp) value = unescapeHtml(value)
					cc = input.charCodeAt(++pos)
				}
				attributes[name] = value
				continue
			}
			cc = input.charCodeAt(++pos)
		}
		const selfClosing = input.charCodeAt(pos - 1) === SLASH
		pos++
		const node = {
			nodeName,
			nodeValue: null,
			attributes,
			childNodes: [],
			prefix: nsIndex === -1 ? null : nodeName.slice(0, nsIndex),
			localName: nsIndex === -1 ? nodeName : nodeName.slice(nsIndex + 1),
		}
		children.push(node)
		if (!selfClosing) {
			stack.push(current)
			current = node
			children = node.childNodes
			currentName = nodeName
		}
	}

	if (includeParentElement) setParentElements(document, null)
	return document
}
```
