import { ParsedValue } from './ParsedValue.js';
import { SfDictionary } from './SfDictionary.js';
import { SfInnerList } from './SfInnerList.js';
import { SfItem } from './SfItem.js';
import { err } from './err.js';
import { parseItemOrInnerList } from './parseItemOrInnerList.js';
import { parseKey } from './parseKey.js';
import { parseParameters } from './parseParameters.js';

// 4.2.2.  Parsing a Dictionary
//
// Given an ASCII string as input_string, return an ordered map whose
// values are (item_or_inner_list, parameters) tuples. input_string is
// modified to remove the parsed value.
//
// 1.  Let dictionary be an empty, ordered map.
//
// 2.  While input_string is not empty:
//
//     1.  Let this_key be the result of running Parsing a Key
//         (Section 4.2.3.3) with input_string.
//
//     2.  If the first character of input_string is "=":
//
//         1.  Consume the first character of input_string.
//
//         2.  Let member be the result of running Parsing an Item or
//             Inner List (Section 4.2.1.1) with input_string.
//
//     3.  Otherwise:
//
//         1.  Let value be Boolean true.
//
//         2.  Let parameters be the result of running Parsing
//             Parameters Section 4.2.3.2 with input_string.
//
//         3.  Let member be the tuple (value, parameters).
//
//     4.  Add name this_key with value member to dictionary.  If
//         dictionary already contains a name this_key (comparing
//         character-for-character), overwrite its value.
//
//     5.  Discard any leading OWS characters from input_string.
//
//     6.  If input_string is empty, return dictionary.
//
//     7.  Consume the first character of input_string; if it is not
//         ",", fail parsing.
//
//     8.  Discard any leading OWS characters from input_string.
//
//     9.  If input_string is empty, there is a trailing comma; fail
//         parsing.
//
// 3.  No structured data has been found; return dictionary (which is
//     empty).
//
// Note that when duplicate Dictionary keys are encountered, this has
// the effect of ignoring all but the last instance.
export function parseDictionary(input_string: string, option: { use_map?: boolean } = {}): ParsedValue<SfDictionary> {
	const value: [string, SfItem | SfInnerList][] = [];

	function toDict(entries: [string, SfItem | SfInnerList][]) {
		if (option?.use_map === true) {
			return new Map(entries);
		}
		return Object.fromEntries(entries);
	}

	while (input_string.length > 0) {
		let member: SfItem | SfInnerList;
		const parsedKey = parseKey(input_string);
		const this_key = parsedKey.value;
		input_string = parsedKey.input_string;
		if (input_string[0] === '=') {
			const parsedItemOrInnerList = parseItemOrInnerList(input_string.substring(1));
			member = parsedItemOrInnerList.value;
			input_string = parsedItemOrInnerList.input_string;
		}
		else {
			const parsedParameters = parseParameters(input_string);
			member = new SfItem(true, parsedParameters.value);
			input_string = parsedParameters.input_string;
		}
		value.push([this_key, member]);
		input_string = input_string.trim();
		if (input_string.length === 0) {
			return { input_string, value: toDict(value) };
		}
		if (input_string[0] !== ',') {
			throw new Error(err`failed to parse "${input_string}" as Dict`);
		}
		input_string = input_string.substring(1).trim();
		if (input_string.length === 0 || input_string[0] === ',') {
			throw new Error(err`failed to parse "${input_string}" as Dict`);
		}
	}
	return {
		value: toDict(value),
		input_string,
	};
}
