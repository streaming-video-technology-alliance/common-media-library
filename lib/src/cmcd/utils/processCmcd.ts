import { isTokenField } from '../../cta/utils/isTokenField.js';
import { isValid } from '../../cta/utils/isValid.js';
import { SfToken } from '../../structuredfield/SfToken.js';
import type { CmcdData } from '../CmcdData.js';
import type { CmcdEncodeOptions } from '../CmcdEncodeOptions.js';
import { CmcdFormatters } from '../CmcdFormatters.js';
import type { CmcdKey } from '../CmcdKey.js';
import type { CmcdValue } from '../CmcdValue.js';

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
export function processCmcd(obj: CmcdData | null | undefined, options?: CmcdEncodeOptions): CmcdData {
	const results: CmcdData = {};

	if (obj == null || typeof obj !== 'object') {
		return results;
	}

	const keys = Object.keys(obj).sort() as CmcdKey[];
	const formatters = Object.assign({}, CmcdFormatters, options?.formatters);
	const filter = options?.filter;

	keys.forEach(key => {
		if (filter?.(key) === false) {
			return;
		}

		let value = obj[key] as CmcdValue;

		const formatter = formatters[key];
		if (formatter) {
			value = formatter(value, options);
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
			value = new SfToken(value);
		}

		results[key as any] = value as any;
	});

	return results;
}
