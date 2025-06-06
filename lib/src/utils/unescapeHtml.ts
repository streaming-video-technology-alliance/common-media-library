const escapedHtml = /&(?:amp|lt|gt|quot|apos|nbsp|lrm|rlm|#[xX]?[0-9a-fA-F]+);/g;

/**
 * Unescapes HTML entities
 *
 * @param text - The text to unescape
 * @returns The unescaped text
 *
 * @group Utils
 *
 * @beta
 *
 * @example
 * {@includeCode ../../test/utils/unescapeHtml.test.ts#example}
 */
export function unescapeHtml(text: string): string {
	if (text.indexOf('&') === -1) {
		return text;
	}

	return text.replace(escapedHtml, (match) => {
		switch (match) {
			case '&amp;': return '&';
			case '&lt;': return '<';
			case '&gt;': return '>';
			case '&quot;': return '"';
			case '&apos;': return '\'';
			case '&nbsp;': return '\u{a0}';
			case '&lrm;': return '\u{200e}';
			case '&rlm;': return '\u{200f}';
			default: {
				if (match[1] === '#') {
					const code = match[2] === 'x' || match[2] === 'X' ? parseInt(match.slice(3), 16) : parseInt(match.slice(2), 10);
					return String.fromCodePoint(code);
				}
				return match;
			}
		}
	});
}
