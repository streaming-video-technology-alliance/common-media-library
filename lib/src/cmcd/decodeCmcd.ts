import { Cmcd } from './Cmcd.js';
import { isTokenField } from './isTokenField.js';

/**
 * Decode a CMCD string to an object.
 */
export function decodeCmcd(cmcd: string): Cmcd {
	return decodeURIComponent(cmcd.replace(/^CMCD=/, ''))
		.split(',')
		.reduce((acc: Record<string, boolean | number | string>, part) => {
			const [key, value] = part.split('=');

			if (!value) {
				acc[key] = true;
			}
			else if (isTokenField(key)) {
				acc[key] = value;
			}
			else {
				acc[key] = JSON.parse(value);
			}

			return acc;
		}, {}) as Cmcd;
}
