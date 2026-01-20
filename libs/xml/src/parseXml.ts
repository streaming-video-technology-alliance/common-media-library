import { unescapeHtml } from '@svta/cml-utils'
import type { XmlNode } from './XmlNode.ts'
import type { XmlParseOptions } from './XmlParseOptions.ts'

// Character code constants (computed once at module load)
const OPEN_BRACKET_CC = 60            // '<'
const CLOSE_BRACKET_CC = 62           // '>'
const MINUS_CC = 45                   // '-'
const SLASH_CC = 47                   // '/'
const QUESTION_CC = 63                // '?'
const EXCLAMATION_CC = 33             // '!'
const SINGLE_QUOTE_CC = 39            // "'"
const DOUBLE_QUOTE_CC = 34            // '"'
const OPEN_CORNER_BRACKET_CC = 91     // '['
const CLOSE_CORNER_BRACKET_CC = 93    // ']'

// Set for fast name delimiter lookup: \r \n \t > / = space
const NAME_SPACER_SET = new Set([13, 10, 9, 62, 47, 61, 32])

/**
 * Parse XML into a JS object with no validation and some failure tolerance
 *
 * @param input - The input XML string
 * @param options - Optional parsing options
 * @returns The parsed XML
 *
 * @public
 *
 * @example
 * {@includeCode ../test/parseXml.test.ts#example}
 */
export function parseXml(input: string, options: XmlParseOptions = {}): XmlNode {
	let pos = options.pos || 0

	const length = input.length
	const keepComments = !!options.keepComments
	const keepWhitespace = !!options.keepWhitespace
	const includeParentElement = !!options.includeParentElement

	/**
	 * Creates a text node
	 */
	function createTextNode(value: string, nodeName = '#text'): XmlNode {
		return {
			nodeName,
			nodeValue: value,
			attributes: {},
			childNodes: [],
		}
	}

	/**
	 * Parses a list of entries
	 */
	function parseChildren(tagName: string = ''): XmlNode[] {
		const children: XmlNode[] = []
		while (pos < length) {
			const c = input.charCodeAt(pos)
			if (c === OPEN_BRACKET_CC) {
				const next = input.charCodeAt(pos + 1)
				if (next === SLASH_CC) {
					const closeStart = pos + 2
					pos = input.indexOf('>', pos)
					if (!input.startsWith(tagName, closeStart)) {
						const parsedText = input.substring(0, pos).split('\n')
						throw new Error(
							'Unexpected close tag\nLine: ' + (parsedText.length - 1) +
							'\nColumn: ' + (parsedText[parsedText.length - 1].length + 1) +
							'\nChar: ' + input[pos],
						)
					}

					if (pos + 1) {
						pos += 1
					}

					return children
				}
				else if (next === QUESTION_CC) {
					// xml declaration
					pos = input.indexOf('>', pos)
					pos++
					continue
				}
				else if (next === EXCLAMATION_CC) {
					const third = input.charCodeAt(pos + 2)
					if (third === MINUS_CC) {
						// comment support
						const startCommentPos = pos
						while (pos !== -1 && !(input.charCodeAt(pos) === CLOSE_BRACKET_CC && input.charCodeAt(pos - 1) === MINUS_CC && input.charCodeAt(pos - 2) === MINUS_CC)) {
							pos = input.indexOf('>', pos + 1)
						}
						if (pos === -1) {
							pos = length
						}
						if (keepComments) {
							children.push(createTextNode(input.substring(startCommentPos, pos + 1), '#comment'))
						}
					}
					else if (
						third === OPEN_CORNER_BRACKET_CC &&
						input.charCodeAt(pos + 8) === OPEN_CORNER_BRACKET_CC &&
						input.startsWith('CDATA', pos + 3)
					) {
						// cdata
						const cdataEndIndex = input.indexOf(']]>', pos)
						if (cdataEndIndex === -1) {
							children.push(createTextNode(input.substr(pos + 9), '#cdata'))
							pos = length
						}
						else {
							children.push(createTextNode(input.substring(pos + 9, cdataEndIndex), '#cdata'))
							pos = cdataEndIndex + 3
						}
						continue
					}
					else {
						// doctypesupport
						const startDoctype = pos + 1
						pos += 2
						let encapsuled = false
						while ((input.charCodeAt(pos) !== CLOSE_BRACKET_CC || encapsuled) && pos < length) {
							const cc = input.charCodeAt(pos)
							if (cc === OPEN_CORNER_BRACKET_CC) {
								encapsuled = true
							}
							else if (encapsuled && cc === CLOSE_CORNER_BRACKET_CC) {
								encapsuled = false
							}
							pos++
						}
						children.push(createTextNode(input.substring(startDoctype, pos), '#doctype'))
					}

					pos++
					continue
				}

				const node = parseNode()
				children.push(node)
			}
			else {
				const text = parseText()
				if (keepWhitespace) {
					if (text.length > 0) {
						children.push(createTextNode(text))
					}
				}
				else {
					const trimmed = text.trim()
					if (trimmed.length > 0) {
						children.push(createTextNode(trimmed))
					}
				}
				pos++
			}
		}
		return children
	}

	/**
	 * Returns the text outside of texts until the first '&lt;'
	 */
	function parseText(): string {
		const start = pos
		pos = input.indexOf('<', pos) - 1
		if (pos === -2) {
			pos = length
		}

		return unescapeHtml(input.slice(start, pos + 1))
	}

	/**
	 * Returns text until the first nonAlphabetic letter
	 */
	function parseName(): string {
		const start = pos
		while (pos < length && !NAME_SPACER_SET.has(input.charCodeAt(pos))) {
			pos++
		}
		return input.slice(start, pos)
	}

	/**
	 * Parses the attributes of a node
	 */
	function parseAttributes(): Record<string, string> {
		const attributes: Record<string, string> = {}

		// parsing attributes
		while (pos < length && input.charCodeAt(pos) !== CLOSE_BRACKET_CC) {
			const c = input.charCodeAt(pos)
			if ((c > 64 && c < 91) || (c > 96 && c < 123)) {
				const name = parseName()
				let value: string = ''
				// search beginning of the string
				let code = input.charCodeAt(pos)
				while (code !== SINGLE_QUOTE_CC && code !== DOUBLE_QUOTE_CC) {
					pos++
					code = input.charCodeAt(pos)
				}

				if (code === SINGLE_QUOTE_CC || code === DOUBLE_QUOTE_CC) {
					value = parseString()
					if (pos === -1) {
						throw new Error('Missing closing quote')
					}
				}
				else {
					pos--
				}

				attributes[name] = unescapeHtml(value)
			}
			pos++
		}

		return attributes
	}

	/**
	 * Parses a node
	 */
	function parseNode(): XmlNode {
		pos++
		const nodeName = parseName()
		let localName = nodeName
		let prefix = null

		const nsIndex = nodeName.indexOf(':')
		if (nsIndex !== -1) {
			prefix = nodeName.slice(0, nsIndex)
			localName = nodeName.slice(nsIndex + 1)
		}

		const attributes = parseAttributes()

		let childNodes: any[] = []

		// optional parsing of children
		const prev = input.charCodeAt(pos - 1)
		pos++

		if (prev !== SLASH_CC) {
			childNodes = parseChildren(nodeName)
		}

		return {
			nodeName,
			nodeValue: null,
			attributes,
			childNodes,
			prefix,
			localName,
		}
	}

	/**
	 * Parses a string, that starts with a char and with the same usually ' or "
	 */
	function parseString(): string {
		const startChar = input[pos]
		const startpos = pos + 1
		pos = input.indexOf(startChar, startpos)
		return input.slice(startpos, pos)
	}

	/**
	 * Recursively sets parentElement on all nodes in the tree
	 */
	function setParentElements(node: XmlNode, parent: XmlNode | null): void {
		node.parentElement = parent?.nodeName.startsWith('#') ? null : parent
		for (const child of node.childNodes) {
			setParentElements(child, node)
		}
	}

	const document: XmlNode = {
		nodeName: '#document',
		nodeValue: null,
		childNodes: parseChildren(''),
		attributes: {},
	}

	if (includeParentElement) {
		setParentElements(document, null)
	}

	return document
}
