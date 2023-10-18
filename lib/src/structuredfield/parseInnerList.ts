import { ParsedValue } from './ParsedValue.js';
import { SfInnerList } from './SfInnerList.js';
import { SfItem } from './SfItem.js';
import { err } from './err.js';
import { parseItem } from './parseItem.js';
import { parseParameters } from './parseParameters.js';

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
export function parseInnerList(input_string: string): ParsedValue<SfInnerList> {
	if (input_string[0] !== '(') {
		throw new Error(err`failed to parse "${input_string}" as Inner List`);
	}
	input_string = input_string.substring(1);
	const inner_list: SfItem[] = [];
	while (input_string.length > 0) {
		input_string = input_string.trim();
		if (input_string[0] === ')') {
			input_string = input_string.substring(1);
			const parsedParameters = parseParameters(input_string);
			return {
				value: new SfItem(inner_list, parsedParameters.value) as any,
				input_string: parsedParameters.input_string,
			};
		}
		const parsedItem = parseItem(input_string);
		inner_list.push(parsedItem.value);
		input_string = parsedItem.input_string;
		if (input_string[0] !== ' ' && input_string[0] !== ')') {
			throw new Error(err`failed to parse "${input_string}" as Inner List`);
		}
	}
	throw new Error(err`failed to parse "${input_string}" as Inner List`);
}
