import type { SfDecodeOptions } from '../SfDecodeOptions';
import { SfItem } from '../SfItem.ts';
import type { ParsedValue } from './ParsedValue';
import { parsedValue } from './ParsedValue.ts';
import { parseBareItem } from './parseBareItem.ts';
import { parseParameters } from './parseParameters.ts';

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
export function parseItem(src: string, options?: SfDecodeOptions): ParsedValue<SfItem> {
	const parsedBareItem = parseBareItem(src, options);
	src = parsedBareItem.src;

	const parsedParameters = parseParameters(src, options);
	src = parsedParameters.src;

	return parsedValue(
		new SfItem(parsedBareItem.value, parsedParameters.value),
		src,
	);
}
