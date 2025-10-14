import type { SfDecodeOptions } from '../SfDecodeOptions.ts';
import type { SfInnerList } from '../SfInnerList.ts';
import { SfItem } from '../SfItem.ts';
import { INNER } from '../utils/INNER.ts';
import type { ParsedValue } from './ParsedValue.ts';
import { parsedValue } from './ParsedValue.ts';
import { parseError } from './parseError.ts';
import { parseItem } from './parseItem.ts';
import { parseParameters } from './parseParameters.ts';

// 4.2.1.2.  Parsing an Inner List
//
// Given an ASCII string as input_string, return the tuple (inner_list,
// parameters), where inner_list is an array of (bare_item, parameters)
// tuples. input_string is modified to remove the parsed value.
//
// 1.  Consume the first character of input_string; if it is not "(",
//     fail parsing.
//
// 2.  Let inner_list be an empty array.
//
// 3.  While input_string is not empty:
//
//     1.  Discard any leading SP characters from input_string.
//
//     2.  If the first character of input_string is ")":
//
//         1.  Consume the first character of input_string.
//
//         2.  Let parameters be the result of running Parsing
//             Parameters (Section 4.2.3.2) with input_string.
//
//         3.  Return the tuple (inner_list, parameters).
//
//     3.  Let item be the result of running Parsing an Item
//         (Section 4.2.3) with input_string.
//
//     4.  Append item to inner_list.
//
//     5.  If the first character of input_string is not SP or ")", fail
//         parsing.
//
// 4.  The end of the inner list was not found; fail parsing.
/**
 * @internal
 */
export function parseInnerList(src: string, options?: SfDecodeOptions): ParsedValue<SfInnerList> {
	if (src[0] !== '(') {
		throw parseError(src, INNER);
	}

	src = src.substring(1);
	const innerList: SfItem[] = [];
	while (src.length > 0) {
		src = src.trim();
		if (src[0] === ')') {
			src = src.substring(1);
			const parsedParameters = parseParameters(src, options);

			return parsedValue(
				new SfItem(innerList, parsedParameters.value) as any,
				parsedParameters.src,
			);
		}

		const parsedItem = parseItem(src, options);
		innerList.push(parsedItem.value);
		src = parsedItem.src;

		if (src[0] !== ' ' && src[0] !== ')') {
			throw parseError(src, INNER);
		}
	}

	throw parseError(src, INNER);
}
