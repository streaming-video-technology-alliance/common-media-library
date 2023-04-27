import { Cmcd } from './Cmcd.js';
import { CmcdEncodeOptions } from './CmcdEncodeOptions.js';
import { CmcdError } from './CmcdError.js';
import { CmcdKey } from './CmcdKey.js';
import { CmcdValue } from './CmcdValue.js';

const isTokenField = (key: string) => key === 'ot' || key === 'sf' || key === 'st';
const isValid = (value: CmcdValue) => value != null && value !== '' && value !== false;

type Mapper<T> = (key: string, value: CmcdValue) => T;

function processData<T>(obj: Cmcd, map: Mapper<T>, options?: CmcdEncodeOptions): T[] {
	if (obj == null || typeof obj !== 'object') {
		throw new CmcdError(CmcdError.INVALID_CMCD_OBJECT);
	}

	const results: T[] = [];

	const keys = Object.keys(obj).sort() as CmcdKey[];
	keys.forEach(key => {
		let value = obj[key];

		// ignore invalid values
		if (!isValid(value)) {
			return;
		}

		// Version should only be reported if not equal to 1.
		if (key === 'v' && value === 1) {
			return;
		}

		// Playback rate should only be sent if not equal to 1.
		if (key == 'pr' && value === 1) {
			return;
		}

		const formatter = options?.formatters?.[key];
		if (formatter) {
			value = formatter(value);
		}

		const result = map(key, value);
		results.push(result);
	});

	return results;
}

/**
 * Encode a CMCD object to a string.
 */
export function encodeCmcd(obj: Cmcd, options?: CmcdEncodeOptions) {
	return processData<string | undefined>(obj, (key, value) => {
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
