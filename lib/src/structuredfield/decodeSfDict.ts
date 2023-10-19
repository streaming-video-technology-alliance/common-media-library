import { err } from './err.js';
import { parseDictionary } from './parseDictionary.js';

/**
 * Decode a structured field string into a structured field dictionary
 * 
 * @param input - The structured field string to decode
 * @returns The structured field dictionary
 * 
 * @group Structured Field
 */
export function decodeSfDict(input: string) {
	try {
		const { input_string, value } = parseDictionary(input.trim());
		if (input_string !== '') {
			throw new Error(err`failed to parse "${input_string}" as Dict`);
		}
		return value;
	}
	catch (cause) {
		throw new Error(err`failed to parse "${input}" as Dict`, { cause });
	}
}
