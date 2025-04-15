import { serializeInteger } from './serializeInteger.ts';

// 4.1.10.  Serializing a Date
//
// Given a Date as input_integer, return an ASCII string suitable for
// use in an HTTP field value.
// 1.  Let output be "@".
// 2.  Append to output the result of running Serializing an Integer
//     with input_date (Section 4.1.4).
// 3.  Return output.
export function serializeDate(value: Date) {
	return `@${serializeInteger(value.getTime() / 1000)}`;
}
