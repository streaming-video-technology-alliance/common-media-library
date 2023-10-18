import { err } from './err.js';
import { parseDictionary } from './parseDictionary.js';

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
