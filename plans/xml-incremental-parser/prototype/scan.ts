import { unescapeHtml } from '@svta/cml-utils'
import type { XmlBuilder } from './XmlBuilder.ts'
import { XmlParseError } from './XmlParseError.ts'

// Phase-one scanner: libs/xml/src/scan.ts on main plus the contract changes proposed in the RFC.
// The differences are marked with "RFC:" comments.

// Character codes
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
const AMPERSAND_CC = 38               // '&'
const EQUALS_CC = 61                  // '='
const COLON_CC = 58                   // ':'
const UNDERSCORE_CC = 95              // '_'
const SPACE_CC = 32                   // ' '
const TAB_CC = 9                      // '\t'
const CR_CC = 13                      // '\r'
const LF_CC = 10                      // '\n'
const UPPER_A_CC = 65                 // 'A'
const UPPER_Z_CC = 90                 // 'Z'
const LOWER_A_CC = 97                 // 'a'
const LOWER_Z_CC = 122                // 'z'

/**
 * Creates an error that reports the line and column of `pos`, with the same message text as today
 */
function syntaxError(input: string, pos: number, message: string): XmlParseError {
	const parsedText = input.substring(0, pos).split('\n')
	const line = parsedText.length - 1
	const column = parsedText[parsedText.length - 1].length + 1
	return new XmlParseError(
		message + '\nLine: ' + line + '\nColumn: ' + column + '\nChar: ' + (pos < input.length ? input[pos] : 'end of input'),
		pos,
		line,
		column,
	)
}

/**
 * Creates the error for input that ends inside `construct` (strict mode only)
 */
function unexpectedEnd(input: string, construct: string): XmlParseError {
	return syntaxError(input, input.length, 'Unexpected end of input inside ' + construct)
}

/**
 * RFC: NameStartChar (XML 1.0 section 2.3) instead of an ASCII letter. Any high surrogate counts, which
 * also accepts U+F0000 and above; the ASCII cases come first because they are the common ones.
 */
function isNameStartChar(cc: number): boolean {
	return (cc >= LOWER_A_CC && cc <= LOWER_Z_CC) || (cc >= UPPER_A_CC && cc <= UPPER_Z_CC) || cc === UNDERSCORE_CC || cc === COLON_CC ||
		(cc >= 0xC0 && cc <= 0xD6) || (cc >= 0xD8 && cc <= 0xF6) || (cc >= 0xF8 && cc <= 0x2FF) || (cc >= 0x370 && cc <= 0x37D) ||
		(cc >= 0x37F && cc <= 0x1FFF) || (cc >= 0x200C && cc <= 0x200D) || (cc >= 0x2070 && cc <= 0x218F) || (cc >= 0x2C00 && cc <= 0x2FEF) ||
		(cc >= 0x3001 && cc <= 0xD7FF) || (cc >= 0xF900 && cc <= 0xFDCF) || (cc >= 0xFDF0 && cc <= 0xFFFD) || (cc >= 0xD800 && cc <= 0xDBFF)
}

/**
 * Scans `input` from `start` to its end and reports every construct to `builder`. `stack` holds the open
 * elements with the document at index 0 and the innermost element on top, and `names` holds their tag
 * names. In strict mode the input must end outside every construct with no element open; otherwise the
 * scanner tolerates truncated input exactly as `parseXml` always has.
 *
 * @param input - The whole XML document
 * @param start - The index to start scanning at
 * @param keepWhitespace - Whether whitespace-only text runs are reported
 * @param strict - Whether input that ends inside a construct or with an element open is an error
 * @param builder - The builder callbacks
 * @param stack - The open-element stack, containing the document
 * @param names - The tag names of the open elements, containing `''` for the document
 */
export function scan<TElement, TDocument>(
	input: string,
	start: number,
	keepWhitespace: boolean,
	strict: boolean,
	builder: XmlBuilder<TElement, TDocument>,
	stack: (TDocument | TElement | undefined)[],
	names: string[],
): void {
	const createElement = builder.createElement
	const appendChild = builder.appendChild
	const appendText = builder.appendText
	// RFC: CDATA falls back to the text callback so character data is never lost silently
	const appendCdata = builder.appendCdata ?? builder.appendText
	const appendComment = builder.appendComment
	const appendDoctype = builder.appendDoctype
	const length = input.length
	let current = stack[stack.length - 1]
	let currentName = names[names.length - 1]
	let pos = start

	while (pos < length) {
		let cc = input.charCodeAt(pos)

		if (cc !== OPEN_BRACKET_CC) {
			// Text up to the next '<'
			const textStart = pos
			let hasAmpersand = false
			let blank = true
			do {
				if (cc !== SPACE_CC && cc !== LF_CC && cc !== CR_CC && cc !== TAB_CC) {
					blank = false
					if (cc === AMPERSAND_CC) {
						hasAmpersand = true
					}
				}
				cc = ++pos < length ? input.charCodeAt(pos) : 0
			} while (pos < length && cc !== OPEN_BRACKET_CC)

			// RFC: runs are delivered untrimmed; blank runs only with keepWhitespace
			if (appendText !== undefined && current !== undefined && (keepWhitespace || !blank)) {
				const text = input.slice(textStart, pos)
				appendText(current, hasAmpersand ? unescapeHtml(text) : text, currentName)
			}
			continue
		}

		const next = pos + 1 < length ? input.charCodeAt(pos + 1) : 0

		if (next === SLASH_CC) {
			// ETag ::= '</' Name S? '>' (XML 1.0 section 3.1); nothing is open at the document level
			const closeStart = pos + 2
			const nameEnd = closeStart + currentName.length
			const afterName = nameEnd < length ? input.charCodeAt(nameEnd) : 0
			const closesTag = input.startsWith(currentName, closeStart) && (
				nameEnd >= length ||
				(currentName !== '' && (afterName === CLOSE_BRACKET_CC || afterName === SPACE_CC || afterName === TAB_CC || afterName === CR_CC || afterName === LF_CC))
			)
			const end = input.indexOf('>', closeStart)
			pos = end === -1 ? length : end
			if (!closesTag) {
				throw syntaxError(input, pos, 'Unexpected close tag')
			}
			if (pos < length) {
				pos++
			}
			else if (strict) {
				throw unexpectedEnd(input, 'a close tag')
			}
			if (stack.length > 1) {
				const child = current
				stack.pop()
				const childName = names.pop() as string
				current = stack[stack.length - 1]
				currentName = names[names.length - 1]
				if (appendChild !== undefined && child !== undefined && current !== undefined) {
					appendChild(current, child as TElement, childName)
				}
			}
			continue
		}

		if (next === QUESTION_CC) {
			// RFC: XML declaration or processing instruction ends at '?>' (XML 1.0 sections 2.6 and 2.8)
			const end = input.indexOf('?>', pos + 2)
			if (end === -1) {
				if (strict) {
					throw unexpectedEnd(input, 'a processing instruction')
				}
				pos = length
			}
			else {
				pos = end + 2
			}
			continue
		}

		if (next === EXCLAMATION_CC) {
			const third = pos + 2 < length ? input.charCodeAt(pos + 2) : 0

			if (third === MINUS_CC) {
				// Comment, up to the first '-->'. RFC: the callback receives the text between the delimiters
				const end = input.indexOf('-->', pos + 2)
				if (end === -1 && strict) {
					throw unexpectedEnd(input, 'a comment')
				}
				if (appendComment !== undefined && current !== undefined) {
					appendComment(current, end === -1 ? input.slice(pos + 4) : input.slice(pos + 4, end), currentName)
				}
				pos = end === -1 ? length : end + 3
				continue
			}

			if (third === OPEN_CORNER_BRACKET_CC && pos + 8 < length && input.charCodeAt(pos + 8) === OPEN_CORNER_BRACKET_CC && input.startsWith('CDATA', pos + 3)) {
				// CDATA section, up to the first ']]>'
				const end = input.indexOf(']]>', pos + 9)
				if (end === -1 && strict) {
					throw unexpectedEnd(input, 'a CDATA section')
				}
				if (appendCdata !== undefined && current !== undefined) {
					appendCdata(current, end === -1 ? input.slice(pos + 9) : input.slice(pos + 9, end), currentName)
				}
				pos = end === -1 ? length : end + 3
				continue
			}

			// Doctype, up to the first '>' outside the internal subset brackets. RFC: a '>' inside a quoted
			// literal does not end it, and the callback receives the text after '<!'
			const doctypeStart = pos + 2
			let bracketed = false
			let quote = 0
			pos += 2
			while (pos < length) {
				cc = input.charCodeAt(pos)
				if (quote !== 0) {
					if (cc === quote) {
						quote = 0
					}
				}
				else if (cc === DOUBLE_QUOTE_CC || cc === SINGLE_QUOTE_CC) {
					quote = cc
				}
				else if (cc === CLOSE_BRACKET_CC && !bracketed) {
					break
				}
				else if (cc === OPEN_CORNER_BRACKET_CC) {
					bracketed = true
				}
				else if (bracketed && cc === CLOSE_CORNER_BRACKET_CC) {
					bracketed = false
				}
				pos++
			}
			if (pos >= length && strict) {
				throw unexpectedEnd(input, 'a doctype declaration')
			}
			if (appendDoctype !== undefined && current !== undefined) {
				appendDoctype(current, input.slice(doctypeStart, pos), currentName)
			}
			pos++
			continue
		}

		// STag ::= '<' Name (S Attribute)* S? '>', EmptyElemTag ::= '<' Name (S Attribute)* S? '/>' (XML 1.0 section 3.1)
		const nameStart = ++pos
		let colon = -1
		cc = pos < length ? input.charCodeAt(pos) : 0
		while (pos < length && cc !== SPACE_CC && cc !== CLOSE_BRACKET_CC && cc !== SLASH_CC && cc !== EQUALS_CC && cc !== LF_CC && cc !== CR_CC && cc !== TAB_CC) {
			if (cc === COLON_CC && colon === -1) {
				colon = pos
			}
			cc = ++pos < length ? input.charCodeAt(pos) : 0
		}
		const name = input.slice(nameStart, pos)
		const attributes: Record<string, string> = {}

		// Attribute ::= Name Eq AttValue, Eq ::= S? '=' S? (XML 1.0 sections 3.1 and 2.3)
		while (pos < length && cc !== CLOSE_BRACKET_CC) {
			// RFC: an attribute name starts with a NameStartChar; any other character is skipped
			if (isNameStartChar(cc)) {
				const attributeStart = pos
				cc = ++pos < length ? input.charCodeAt(pos) : 0
				while (pos < length && cc !== SPACE_CC && cc !== CLOSE_BRACKET_CC && cc !== SLASH_CC && cc !== EQUALS_CC && cc !== LF_CC && cc !== CR_CC && cc !== TAB_CC) {
					cc = ++pos < length ? input.charCodeAt(pos) : 0
				}
				const attributeName = input.slice(attributeStart, pos)

				if (cc !== EQUALS_CC) {
					while (cc === SPACE_CC || cc === TAB_CC || cc === CR_CC || cc === LF_CC) {
						cc = ++pos < length ? input.charCodeAt(pos) : 0
					}
					if (cc !== EQUALS_CC) {
						throw syntaxError(input, pos, 'Malformed attribute "' + attributeName + '": expected "=" after name')
					}
				}

				cc = ++pos < length ? input.charCodeAt(pos) : 0
				if (cc !== SINGLE_QUOTE_CC && cc !== DOUBLE_QUOTE_CC) {
					while (cc === SPACE_CC || cc === TAB_CC || cc === CR_CC || cc === LF_CC) {
						cc = ++pos < length ? input.charCodeAt(pos) : 0
					}
					if (cc !== SINGLE_QUOTE_CC && cc !== DOUBLE_QUOTE_CC) {
						throw syntaxError(input, pos, 'Malformed attribute "' + attributeName + '": expected quoted value after "="')
					}
				}

				const quote = cc
				const valueStart = ++pos
				let hasAmpersand = false
				cc = pos < length ? input.charCodeAt(pos) : 0
				while (pos < length && cc !== quote) {
					if (cc === AMPERSAND_CC) {
						hasAmpersand = true
					}
					cc = ++pos < length ? input.charCodeAt(pos) : 0
				}
				if (pos >= length) {
					const parsedText = input.substring(0, valueStart).split('\n')
					throw new XmlParseError('Missing closing quote', valueStart, parsedText.length - 1, parsedText[parsedText.length - 1].length + 1)
				}
				const value = input.slice(valueStart, pos)
				attributes[attributeName] = hasAmpersand ? unescapeHtml(value) : value
				cc = ++pos < length ? input.charCodeAt(pos) : 0
				continue
			}
			cc = ++pos < length ? input.charCodeAt(pos) : 0
		}

		if (pos >= length && strict) {
			throw unexpectedEnd(input, 'a start tag')
		}

		const selfClosing = input.charCodeAt(pos - 1) === SLASH_CC
		pos++

		// RFC: inside a skipped element the builder is not called
		const element = current === undefined
			? undefined
			: createElement(
				current,
				name,
				attributes,
				colon === -1 ? name : name.slice(colon - nameStart + 1),
				colon === -1 ? null : name.slice(0, colon - nameStart),
			)

		if (selfClosing) {
			if (appendChild !== undefined && element !== undefined && current !== undefined) {
				appendChild(current, element, name)
			}
		}
		else {
			stack.push(element)
			names.push(name)
			current = element
			currentName = name
		}
	}

	if (stack.length > 1) {
		if (strict) {
			throw unexpectedEnd(input, '<' + currentName + '>')
		}
		// Elements still open at the end of the input keep the children parsed so far
		while (stack.length > 1) {
			const child = current
			stack.pop()
			const childName = names.pop() as string
			current = stack[stack.length - 1]
			if (appendChild !== undefined && child !== undefined && current !== undefined) {
				appendChild(current, child as TElement, childName)
			}
		}
	}
}
