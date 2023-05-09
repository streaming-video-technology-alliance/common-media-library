import { Cmcd } from './Cmcd.js';
import { isTokenField } from './isTokenField.js';

/**
 * Decode a CMCD string to an object.
 * 
 * @param cmcd - The CMCD string to decode.
 * 
 * @returns The decoded CMCD object.
 * 
 * @group CMCD
 */
export function decodeCmcd(cmcd: string): Cmcd {
	if (!cmcd) {
		return {};
	}
	
	return decodeURIComponent(cmcd.replace(/^CMCD=/, ''))
		.split(',')
		.reduce((acc: Record<string, boolean | number | string>, part) => {
			const [key, value] = part.split('=');

			if (!key) {
				return acc;
			}

			if (!value) {
				acc[key] = true;
			}
			else if (isTokenField(key) || /^[a-zA-Z]$/.test(value)) {
				acc[key] = value;
			}
			else {
				acc[key] = JSON.parse(value);
			}

			return acc;
		}, {}) as Cmcd;
}
