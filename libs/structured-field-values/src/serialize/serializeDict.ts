import type { SfEncodeOptions } from '../SfEncodeOptions.ts'
import { DICT } from '../utils/DICT.ts'
import { serializeDictMember } from './serializeDictMember.ts'
import { serializeError } from './serializeError.ts'

// 4.1.2.  Serializing a Dictionary
//
// Given an ordered Dictionary as input_dictionary (each member having a
// member_name and a tuple value of (member_value, parameters)), return
// an ASCII string suitable for use in a HTTP field value.
//
// 1.  Let output be an empty string.
//
// 2.  For each member_name with a value of (member_value, parameters)
//     in input_dictionary:
//
//     1.  Append the result of running Serializing a Key
//         (Section 4.1.1.3) with member's member_name to output.
//
//     2.  If member_value is Boolean true:
//
//         1.  Append the result of running Serializing Parameters
//             (Section 4.1.1.2) with parameters to output.
//
//     3.  Otherwise:
//
//         1.  Append "=" to output.
//
//         2.  If member_value is an array, append the result of running
//             Serializing an Inner List (Section 4.1.1.1) with
//             (member_value, parameters) to output.
//
//         3.  Otherwise, append the result of running Serializing an
//             Item (Section 4.1.3) with (member_value, parameters) to
//             output.
//
//     4.  If more members remain in input_dictionary:
//
//         1.  Append "," to output.
//
//         2.  Append a single SP to output.
//
// 3.  Return output.
/**
 * @internal
 */
export function serializeDict(dict: Record<string, any> | Map<string, any>, options?: SfEncodeOptions): string {
	if (typeof dict !== 'object' || dict == null) {
		throw serializeError(dict, DICT)
	}

	const parts: string[] = []

	if (dict instanceof Map) {
		dict.forEach((member, key) => parts.push(serializeDictMember(key, member)))
	}
	else {
		for (const key of Object.keys(dict)) {
			parts.push(serializeDictMember(key, dict[key]))
		}
	}

	return parts.join(options?.whitespace === false ? ',' : ', ')
}
