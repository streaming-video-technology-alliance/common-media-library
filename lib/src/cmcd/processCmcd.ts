import { Cmcd } from './Cmcd.js';
import { CmcdEncodeOptions } from './CmcdEncodeOptions.js';
import { CmcdFormatters } from './CmcdFormatters.js';
import { CmcdKey } from './CmcdKey.js';
import { CmcdValue } from './CmcdValue.js';

type Mapper<T> = (key: string, value: CmcdValue) => T;

const isValid = (value: CmcdValue) => value != null && value !== '' && value !== false;

export function processCmcd<T>(obj: Cmcd | null | undefined, map: Mapper<T>, options?: CmcdEncodeOptions): T[] {
	const results: T[] = [];

	if (obj == null || typeof obj !== 'object') {
		return results;
	}

	const keys = Object.keys(obj).sort() as CmcdKey[];
	const formatters = Object.assign({}, CmcdFormatters, options?.formatters);

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

		const formatter = formatters[key];
		if (formatter) {
			value = formatter(value);
		}

		const result = map(key, value);
		results.push(result);
	});

	return results;
}
