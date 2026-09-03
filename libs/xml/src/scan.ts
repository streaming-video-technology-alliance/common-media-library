import { unescapeHtml } from '@svta/cml-utils'
import type { XmlBuilder } from './XmlBuilder.ts'

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
const SPACE_CC = 32                   // ' '
const TAB_CC = 9                      // '\t'
const CR_CC = 13                      // '\r'
const LF_CC = 10                      // '\n'
const UPPER_A_CC = 65                 // 'A'
const UPPER_Z_CC = 90                 // 'Z'
const LOWER_A_CC = 97                 // 'a'
const LOWER_Z_CC = 122                // 'z'

/**
 * Creates an error that reports the line and column of `pos`
 */
function syntaxError(input: string, pos: number, message: string): Error {
	const parsedText = input.substring(0, pos).split('\n')
	return new Error(
		message + '\nLine: ' + (parsedText.length - 1) +
		'\nColumn: ' + (parsedText[parsedText.length - 1].length + 1) +
		'\nChar: ' + (pos < input.length ? input[pos] : 'end of input'),
	)
}

/**
 * Scans `input` from `start` to its end and reports every construct to `builder`. `stack` holds the open
 * elements with the document at index 0 and the innermost element on top, and `names` holds their tag
 * names. Elements still open when the input ends are appended to their parents.
 *
 * @param input - The whole XML document
 * @param start - The index to start scanning at
 * @param keepWhitespace - Whether whitespace-only text is reported and text is left untrimmed
 * @param builder - The builder callbacks
 * @param stack - The open-element stack, containing the document
 * @param names - The tag names of the open elements, containing `''` for the document
 */
export function scan<T>(input: string, start: number, keepWhitespace: boolean, builder: XmlBuilder<T>, stack: T[], names: string[]): void {
	const createElement = builder.createElement
	const appendChild = builder.appendChild
	const appendText = builder.appendText
	const appendCdata = builder.appendCdata
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

			if (appendText !== undefined && (keepWhitespace || !blank)) {
				let text = input.slice(textStart, pos)
				if (hasAmpersand) {
					text = unescapeHtml(text)
				}
				if (!keepWhitespace) {
					text = text.trim()
				}
				if (text.length > 0) {
					appendText(current, text)
				}
			}
			continue
		}

		const next = pos + 1 < length ? input.charCodeAt(pos + 1) : 0

		if (next === SLASH_CC) {
			// ETag ::= '</' Name S? '>' (XML 1.0 §3.1); nothing is open at the document level
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
			if (stack.length > 1) {
				const child = current
				stack.pop()
				names.pop()
				current = stack[stack.length - 1]
				currentName = names[names.length - 1]
				if (appendChild !== undefined) {
					appendChild(current, child)
				}
			}
			continue
		}

		if (next === QUESTION_CC) {
			// XML declaration or processing instruction, up to the next '>'
			const end = input.indexOf('>', pos + 2)
			pos = end === -1 ? length : end + 1
			continue
		}

		if (next === EXCLAMATION_CC) {
			const third = pos + 2 < length ? input.charCodeAt(pos + 2) : 0

			if (third === MINUS_CC) {
				// Comment, up to the first '-->'
				const end = input.indexOf('-->', pos + 2)
				const stop = end === -1 ? length : end + 3
				if (appendComment !== undefined) {
					appendComment(current, input.slice(pos, stop))
				}
				pos = stop
				continue
			}

			if (third === OPEN_CORNER_BRACKET_CC && pos + 8 < length && input.charCodeAt(pos + 8) === OPEN_CORNER_BRACKET_CC && input.startsWith('CDATA', pos + 3)) {
				// CDATA section, up to the first ']]>'
				const end = input.indexOf(']]>', pos + 9)
				if (appendCdata !== undefined) {
					appendCdata(current, end === -1 ? input.slice(pos + 9) : input.slice(pos + 9, end))
				}
				pos = end === -1 ? length : end + 3
				continue
			}

			// Doctype, up to the first '>' outside the internal subset brackets
			const doctypeStart = pos + 1
			let bracketed = false
			pos += 2
			while (pos < length) {
				cc = input.charCodeAt(pos)
				if (cc === CLOSE_BRACKET_CC && !bracketed) {
					break
				}
				if (cc === OPEN_CORNER_BRACKET_CC) {
					bracketed = true
				}
				else if (bracketed && cc === CLOSE_CORNER_BRACKET_CC) {
					bracketed = false
				}
				pos++
			}
			if (appendDoctype !== undefined) {
				appendDoctype(current, input.slice(doctypeStart, pos))
			}
			pos++
			continue
		}

		// STag ::= '<' Name (S Attribute)* S? '>', EmptyElemTag ::= '<' Name (S Attribute)* S? '/>' (XML 1.0 §3.1)
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

		// Attribute ::= Name Eq AttValue, Eq ::= S? '=' S? (XML 1.0 §3.1, §2.3)
		while (pos < length && cc !== CLOSE_BRACKET_CC) {
			// An attribute name starts with an ASCII letter; any other character is skipped
			if ((cc >= UPPER_A_CC && cc <= UPPER_Z_CC) || (cc >= LOWER_A_CC && cc <= LOWER_Z_CC)) {
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
					throw new Error('Missing closing quote')
				}
				const value = input.slice(valueStart, pos)
				attributes[attributeName] = hasAmpersand ? unescapeHtml(value) : value
				cc = ++pos < length ? input.charCodeAt(pos) : 0
				continue
			}
			cc = ++pos < length ? input.charCodeAt(pos) : 0
		}

		const selfClosing = input.charCodeAt(pos - 1) === SLASH_CC
		pos++

		const element = createElement(
			current,
			name,
			attributes,
			colon === -1 ? name : name.slice(colon - nameStart + 1),
			colon === -1 ? null : name.slice(0, colon - nameStart),
		)

		if (selfClosing) {
			if (appendChild !== undefined) {
				appendChild(current, element)
			}
		}
		else {
			stack.push(element)
			names.push(name)
			current = element
			currentName = name
		}
	}

	// Elements still open at the end of the input keep the children parsed so far
	while (stack.length > 1) {
		const child = current
		stack.pop()
		names.pop()
		current = stack[stack.length - 1]
		if (appendChild !== undefined) {
			appendChild(current, child)
		}
	}
}
