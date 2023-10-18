import { ParsedValue } from './ParsedValue.js';
import { SfInnerList } from './SfInnerList.js';
import { SfItem } from './SfItem.js';
import { parseInnerList } from './parseInnerList.js';
import { parseItem } from './parseItem.js';

// 4.2.1.1.  Parsing an Item or Inner List
//
// Given an ASCII string as input_string, return the tuple
// (item_or_inner_list, parameters), where item_or_inner_list can be
// either a single bare item, or an array of (bare_item, parameters)
// tuples. input_string is modified to remove the parsed value.
//
// 1.  If the first character of input_string is "(", return the result
//     of running Parsing an Inner List (Section 4.2.1.2) with
//     input_string.
//
// 2.  Return the result of running Parsing an Item (Section 4.2.3) with
//     input_string.
export function parseItemOrInnerList(input_string: string): ParsedValue<SfItem | SfInnerList> {
	if (input_string[0] === '(') {
		return parseInnerList(input_string);
	}
	return parseItem(input_string);
}
