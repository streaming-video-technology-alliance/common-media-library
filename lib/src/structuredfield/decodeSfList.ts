import { err } from './err.js';
import { parseList } from './parseList.js';

/**
 * Decode a structured field string into a structured field list
 * 
 * @param input - The structured field string to decode
 * @returns The structured field list
 * 
 * @group Structured Field
 */
export function decodeSfList(input: string) {
	try {
		const { input_string, value } = parseList(input.trim());
		if (input_string !== '') {
			throw new Error(err`failed to parse "${input_string}" as List`);
		}
		return value;
	}
	catch (cause) {
		throw new Error(err`failed to parse "${input}" as List`, { cause });
	}
}
