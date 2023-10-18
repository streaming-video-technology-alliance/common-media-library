import { ParsedValue } from './ParsedValue.js';
import { SfMember } from './SfMember.js';
import { err } from './err.js';
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
export function parseList(input_string: string): ParsedValue<SfMember[]> {
	const value: SfMember[] = [];
	while (input_string.length > 0) {
		const parsedItemOrInnerList = parseItemOrInnerList(input_string);
		value.push(parsedItemOrInnerList.value);

		input_string = parsedItemOrInnerList.input_string.trim();
		if (input_string.length === 0) {
			return { input_string, value: value };
		}

		if (input_string[0] !== ',') {
			throw new Error(err`failed to parse "${input_string}" as List`);
		}

		input_string = input_string.substring(1).trim();
		if (input_string.length === 0 || input_string[0] === ',') {
			throw new Error(err`failed to parse "${input_string}" as List`);
		}
	}
	return {
		value,
		input_string,
	};
}

