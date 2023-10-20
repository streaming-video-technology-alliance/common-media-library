import { SfMember } from '../SfMember.js';
import { LIST } from '../util/LIST.js';
import { ParsedValue } from './ParsedValue.js';
import { parseError } from './parseError.js';
import { parseItemOrInnerList } from './parseItemOrInnerList.js';

// 4.2.1.  Parsing a List
//
// Given an ASCII string as input_string, return an array of
// (item_or_inner_list, parameters) tuples. input_string is modified to
// remove the parsed value.
//
// 1.  Let members be an empty array.
//
// 2.  While input_string is not empty:
//
//     1.  Append the result of running Parsing an Item or Inner List
//         (Section 4.2.1.1) with input_string to members.
//
//     2.  Discard any leading OWS characters from input_string.
//
//     3.  If input_string is empty, return members.
//
//     4.  Consume the first character of input_string; if it is not
//         ",", fail parsing.
//
//     5.  Discard any leading OWS characters from input_string.
//
//     6.  If input_string is empty, there is a trailing comma; fail
//         parsing.
//
// 3.  No structured data has been found; return members (which is
//     empty).
export function parseList(src: string): ParsedValue<SfMember[]> {
	const value: SfMember[] = [];
	while (src.length > 0) {
		const parsedItemOrInnerList = parseItemOrInnerList(src);
		value.push(parsedItemOrInnerList.value);

		src = parsedItemOrInnerList.src.trim();
		if (src.length === 0) {
			return { src, value };
		}

		if (src[0] !== ',') {
			throw parseError(src, LIST);
		}

		src = src.substring(1).trim();
		if (src.length === 0 || src[0] === ',') {
			throw parseError(src, LIST);
		}
	}
	return {
		value,
		src,
	};
}

