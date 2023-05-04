import { Cmcd } from './Cmcd.js';
import { CmcdEncodeOptions } from './CmcdEncodeOptions.js';
import { isTokenField } from './isTokenField.js';
import { processCmcd } from './processCmcd.js';

/**
 * Encode a CMCD object to a string.
 * 
 * @param obj - The CMCD object to encode.
 * @param options - Options for encoding.
 * 
 * @returns The encoded CMCD string.
 */
export function encodeCmcd(obj: Cmcd, options: CmcdEncodeOptions = {}) {
	return processCmcd<string | undefined>(obj, (key, value) => {
		switch (typeof value) {
			case 'boolean':
				return key;

			case 'number':
				return `${key}=${value}`;

			case 'symbol':
				return `${key}=${value.description || value.toString().replace(/^Symbol\((.*)\)$/, '$1')}`;

			case 'string':
				if (isTokenField(key)) {
					return `${key}=${value}`;
				}

				return `${key}=${JSON.stringify(value)}`;

			default:
				return undefined;
		}
	}, options).join(',');
}
