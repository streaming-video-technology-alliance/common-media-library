import { err } from './err.js';
import { parseList } from './parseList.js';

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
