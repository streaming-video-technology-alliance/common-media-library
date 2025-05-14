import type { SfDecodeOptions } from '../SfDecodeOptions';
import type { SfDictionary } from '../SfDictionary';
import type { SfInnerList } from '../SfInnerList';
import { SfItem } from '../SfItem.ts';
import { DICT } from '../utils/DICT.ts';
import type { ParsedValue } from './ParsedValue';
import { parsedValue } from './ParsedValue.ts';
import { parseError } from './parseError.ts';
import { parseItemOrInnerList } from './parseItemOrInnerList.ts';
import { parseKey } from './parseKey.ts';
import { parseParameters } from './parseParameters.ts';

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
export function parseDict(src: string, options?: SfDecodeOptions): ParsedValue<SfDictionary> {
	const value: SfDictionary = {};

	while (src.length > 0) {
		let member: SfItem | SfInnerList;
		const parsedKey = parseKey(src);
		const key = parsedKey.value;
		src = parsedKey.src;

		if (src[0] === '=') {
			const parsedItemOrInnerList = parseItemOrInnerList(src.substring(1), options);
			member = parsedItemOrInnerList.value;
			src = parsedItemOrInnerList.src;
		}
		else {
			const parsedParameters = parseParameters(src, options);
			member = new SfItem(true, parsedParameters.value);
			src = parsedParameters.src;
		}

		value[key] = member;

		src = src.trim();
		if (src.length === 0) {
			return parsedValue(value, src);
		}

		if (src[0] !== ',') {
			throw parseError(src, DICT);
		}

		src = src.substring(1).trim();
		if (src.length === 0 || src[0] === ',') {
			throw parseError(src, DICT);
		}
	}

	return parsedValue(value, src);
}
