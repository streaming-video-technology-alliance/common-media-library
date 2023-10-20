import { Cmcd } from '../Cmcd.js';
import { CmcdEncodeOptions } from '../CmcdEncodeOptions.js';
import { CmcdFormatters } from '../CmcdFormatters.js';
import { CmcdKey } from '../CmcdKey.js';
import { CmcdValue } from '../CmcdValue.js';
import { isTokenField } from './isTokenField.js';

const isValid = (value: CmcdValue) => value != null && value !== '' && value !== false;

/**
 * Internal CMCD processing function.
 * 
 * @param obj - The CMCD object to process.
 * @param map - The mapping function to use.
 * @param options - Options for encoding.
 * 
 * @internal
 * 
 * @group CMCD
 */
export function processCmcd(obj: Cmcd | null | undefined, options?: CmcdEncodeOptions): Cmcd {
	const results: Cmcd = {};

	if (obj == null || typeof obj !== 'object') {
		return results;
	}

	const keys = Object.keys(obj).sort() as CmcdKey[];
	const formatters = Object.assign({}, CmcdFormatters, options?.formatters);

	keys.forEach(key => {
		let value = obj[key] as CmcdValue;

		const formatter = formatters[key];
		if (formatter) {
			value = formatter(value);
		}

		// Version should only be reported if not equal to 1.
		if (key === 'v' && value === 1) {
			return;
		}

		// Playback rate should only be sent if not equal to 1.
		if (key == 'pr' && value === 1) {
			return;
		}

		// ignore invalid values
		if (!isValid(value)) {
			return;
		}

		if (isTokenField(key) && typeof value === 'string') {
			value = Symbol.for(value);
		}

		results[key as any] = value as any;
	});

	return results;
}
