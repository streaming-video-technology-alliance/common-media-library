import { ParsedValue } from './ParsedValue.js';
import { SfItem } from './SfItem.js';
import { parseBareItem } from './parseBareItem.js';
import { parseParameters } from './parseParameters.js';

// 4.2.3.  Parsing an Item
//
// Given an ASCII string as input_string, return a (bare_item,
// parameters) tuple. input_string is modified to remove the parsed
// value.
//
// 1.  Let bare_item be the result of running Parsing a Bare Item
//     (Section 4.2.3.1) with input_string.
//
// 2.  Let parameters be the result of running Parsing Parameters
//     (Section 4.2.3.2) with input_string.
//
// 3.  Return the tuple (bare_item, parameters).
export function parseItem(input_string: string): ParsedValue<SfItem> {
	const parsedBareItem = parseBareItem(input_string);
	const value = parsedBareItem.value;
	input_string = parsedBareItem.input_string;
	const parsedParameters = parseParameters(input_string);
	const params = parsedParameters.value;
	input_string = parsedParameters.input_string;
	const item = new SfItem(value, params);
	return {
		value: item,
		input_string,
	};
}
