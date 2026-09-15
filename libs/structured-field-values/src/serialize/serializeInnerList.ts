import type { SfBareItem } from '../SfBareItem.ts'
import type { SfInnerList } from '../SfInnerList.ts'
import type { SfItem } from '../SfItem.ts'
import type { SfParameters } from '../SfParameters.ts'
import { serializeItem } from './serializeItem.ts'
import { serializeParams } from './serializeParams.ts'

// 4.1.1.1.  Serializing an Inner List
//
// Given an array of (member_value, parameters) tuples as inner_list,
// and parameters as list_parameters, return an ASCII string suitable
// for use in a HTTP field value.
//
// 1.  Let output be the string "(".
//
// 2.  For each (member_value, parameters) of inner_list:
//
//     1.  Append the result of running Serializing an Item
//         (Section 4.1.3) with (member_value, parameters) to output.
//
//     2.  If more values remain in inner_list, append a single SP to
//         output.
//
// 3.  Append ")" to output.
//
// 4.  Append the result of running Serializing Parameters
//     (Section 4.1.1.2) with list_parameters to output.
//
// 5.  Return output.
/**
 * @internal
 */
export function serializeInnerList(value: SfInnerList): string;

/**
 * @internal
 */
export function serializeInnerList(value: SfItem[] | SfBareItem[], params?: SfParameters): string;

export function serializeInnerList(value: SfInnerList | SfItem[] | SfBareItem[], params?: SfParameters): string {
	let list: SfItem[] | SfBareItem[]

	if (Array.isArray(value)) {
		list = value
	}
	else {
		list = value.value
		params = value.params
	}

	let output = '('

	for (let i = 0; i < list.length; i++) {
		if (i > 0) {
			output += ' '
		}
		output += serializeItem(list[i])
	}

	return `${output})${serializeParams(params)}`
}
