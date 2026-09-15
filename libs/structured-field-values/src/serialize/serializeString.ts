import { STRING } from '../utils/STRING.ts'
import { STRING_REGEX } from '../utils/STRING_REGEX.ts'
import { serializeError } from './serializeError.ts'

// Control characters that fail serialization, and the two characters that need an escape.
// eslint-disable-next-line no-control-regex
const ESCAPE_OR_CONTROL_REGEX = /[\x00-\x1f\x7f"\\]/
const BACKSLASH_REGEX = /\\/g
const DQUOTE_REGEX = /"/g

// 4.1.6.  Serializing a String
//
// Given a String as input_string, return an ASCII string suitable for
// use in a HTTP field value.
//
// 1.  Convert input_string into a sequence of ASCII characters; if
//     conversion fails, fail serialization.
//
// 2.  If input_string contains characters in the range %x00-1f or %x7f
//     (i.e., not in VCHAR or SP), fail serialization.
//
// 3.  Let output be the string DQUOTE.
//
// 4.  For each character char in input_string:
//
//     1.  If char is "\" or DQUOTE:
//
//         1.  Append "\" to output.
//
//     2.  Append char to output.
//
// 5.  Append DQUOTE to output.
//
// 6.  Return output.
/**
 * @internal
 */
export function serializeString(value: string): string {
	if (ESCAPE_OR_CONTROL_REGEX.test(value) === false) {
		return `"${value}"`
	}

	if (STRING_REGEX.test(value)) {
		throw serializeError(value, STRING)
	}

	return `"${value.replace(BACKSLASH_REGEX, '\\\\').replace(DQUOTE_REGEX, '\\"')}"`
}
