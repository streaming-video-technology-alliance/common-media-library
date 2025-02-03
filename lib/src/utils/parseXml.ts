type Pos = { pos?: number };

export type XmlNode = Pos & {
	tagName: string;
	attributes: Record<string, string>;
	children: XmlChildren;
}

export type XmlChildren = Pos & (XmlNode | string)[];

export type ParseOptions = {
	pos?: number;
	keepWhitespace?: boolean;
	keepComments?: boolean;
}

/**
 * parseXML / html into a DOM Object. with no validation and some failure tolerance
 * @param input - your XML to parse
 * @param options - all other options:
 * @return The parsed XML
 */
export function parseXml(input: string, options: ParseOptions = {}): XmlChildren {
	let pos = options.pos || 0;
	const length = input.length;
	const keepComments = !!options.keepComments;
	const keepWhitespace = !!options.keepWhitespace;

	const openBracket = '<';
	const openBracketCC = '<'.charCodeAt(0);
	const closeBracket = '>';
	const closeBracketCC = '>'.charCodeAt(0);
	const minusCC = '-'.charCodeAt(0);
	const slashCC = '/'.charCodeAt(0);
	const questionCC = '?'.charCodeAt(0);
	const exclamationCC = '!'.charCodeAt(0);
	const singleQuoteCC = "'".charCodeAt(0);
	const doubleQuoteCC = '"'.charCodeAt(0);
	const openCornerBracketCC = '['.charCodeAt(0);
	const closeCornerBracketCC = ']'.charCodeAt(0);
	const nameSpacer = '\r\n\t>/= ';

	/**
	 * parsing a list of entries
	 */
	function parseChildren(tagName: string = ''): XmlChildren {
		const children: any[] = [];
		while (input[pos]) {
			if (input.charCodeAt(pos) == openBracketCC) {
				if (input.charCodeAt(pos + 1) === slashCC) {
					const closeStart = pos + 2;
					pos = input.indexOf(closeBracket, pos);
					if (!input.startsWith(tagName, closeStart)) {
						const parsedText = input.substring(0, pos).split('\n');
						throw new Error(
							'Unexpected close tag\nLine: ' + (parsedText.length - 1) +
							'\nColumn: ' + (parsedText[parsedText.length - 1].length + 1) +
							'\nChar: ' + input[pos],
						);
					}

					if (pos + 1) {
						pos += 1;
					}

					return children;
				}
				else if (input.charCodeAt(pos + 1) === questionCC) {
					// xml declaration
					pos = input.indexOf(closeBracket, pos);
					pos++;
					continue;
				}
				else if (input.charCodeAt(pos + 1) === exclamationCC) {
					if (input.charCodeAt(pos + 2) == minusCC) {
						// comment support
						const startCommentPos = pos;
						while (pos !== -1 && !(input.charCodeAt(pos) === closeBracketCC && input.charCodeAt(pos - 1) == minusCC && input.charCodeAt(pos - 2) == minusCC && pos != -1)) {
							pos = input.indexOf(closeBracket, pos + 1);
						}
						if (pos === -1) {
							pos = length;
						}
						if (keepComments) {
							children.push(input.substring(startCommentPos, pos + 1));
						}
					}
					else if (
						input.charCodeAt(pos + 2) === openCornerBracketCC &&
						input.charCodeAt(pos + 8) === openCornerBracketCC &&
						input.startsWith('CDATA', pos + 3)
					) {
						// cdata
						const cdataEndIndex = input.indexOf(']]>', pos);
						if (cdataEndIndex == -1) {
							children.push(input.substr(pos + 9));
							pos = length;
						}
						else {
							children.push(input.substring(pos + 9, cdataEndIndex));
							pos = cdataEndIndex + 3;
						}

						children.push(input.substring(pos + 9, cdataEndIndex));
						pos = cdataEndIndex + 3;
						continue;
					}
					else {
						// doctypesupport
						const startDoctype = pos + 1;
						pos += 2;
						let encapsuled = false;
						while ((input.charCodeAt(pos) !== closeBracketCC || encapsuled === true) && input[pos]) {
							if (input.charCodeAt(pos) === openCornerBracketCC) {
								encapsuled = true;
							}
							else if (encapsuled === true && input.charCodeAt(pos) === closeCornerBracketCC) {
								encapsuled = false;
							}
							pos++;
						}
						children.push(input.substring(startDoctype, pos));
					}

					pos++;
					continue;
				}

				const node = parseNode();
				children.push(node);
			}
			else {
				const text = parseText();
				if (keepWhitespace) {
					if (text.length > 0) {
						children.push(text);
					}
				}
				else {
					const trimmed = text.trim();
					if (trimmed.length > 0) {
						children.push(trimmed);
					}
				}
				pos++;
			}
		}
		return children;
	}

	/**
	 * returns the text outside of texts until the first '&lt;'
	 */
	function parseText(): string {
		const start = pos;
		pos = input.indexOf(openBracket, pos) - 1;
		if (pos === -2) {
			pos = length;
		}
		return input.slice(start, pos + 1);
	}

	/**
	 * returns text until the first nonAlphabetic letter
	 */
	function parseName(): string {
		const start = pos;
		while (nameSpacer.indexOf(input[pos]) === -1 && input[pos]) {
			pos++;
		}
		return input.slice(start, pos);
	}

	/**
	 * parses the attributes of a node
	 */
	function parseAttributes(): Record<string, string> {
		const attributes: Record<string, string> = {};

		// parsing attributes
		while (input.charCodeAt(pos) !== closeBracketCC && input[pos]) {
			const c = input.charCodeAt(pos);
			if ((c > 64 && c < 91) || (c > 96 && c < 123)) {
				const name = parseName();
				let value: string = '';
				// search beginning of the string
				let code = input.charCodeAt(pos);
				while (code !== singleQuoteCC && code !== doubleQuoteCC) {
					pos++;
					code = input.charCodeAt(pos);
				}

				if (code === singleQuoteCC || code === doubleQuoteCC) {
					value = parseString();
					if (pos === -1) {
						throw new Error('Missing closing quote');
					}
				}
				else {
					pos--;
				}

				attributes[name] = value;
			}
			pos++;
		}

		return attributes;
	}

	/**
	 * parses a node
	 */
	function parseNode(): XmlNode {
		pos++;
		const tagName = parseName();
		const attributes = parseAttributes();

		let children: any[] = [];

		// optional parsing of children
		const prev = input.charCodeAt(pos - 1);
		pos++;

		if (prev !== slashCC) {
			children = parseChildren(tagName);
		}

		return {
			tagName,
			attributes,
			children,
		};
	}

	/**
	 * is parsing a string, that starts with a char and with the same usually ' or "
	 */
	function parseString(): string {
		const startChar = input[pos];
		const startpos = pos + 1;
		pos = input.indexOf(startChar, startpos);
		return input.slice(startpos, pos);
	}

	return parseChildren('');
}
