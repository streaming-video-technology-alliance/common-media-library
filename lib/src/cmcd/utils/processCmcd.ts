import { isTokenField } from '../../cta/utils/isTokenField.js';
import { isValid } from '../../cta/utils/isValid.js';
import { SfToken } from '../../structuredfield/SfToken.js';
import { CMCD_EVENT_MODE } from '../CMCD_EVENT_MODE.js';
import { CMCD_REQUEST_MODE } from '../CMCD_REQUEST_MODE.js';
import { CMCD_RESPONSE_MODE } from '../CMCD_RESPONSE_MODE.js';
import type { CmcdData } from '../CmcdData.js';
import type { CmcdEncodeOptions } from '../CmcdEncodeOptions.js';
import { CmcdFormatters } from '../CmcdFormatters.js';
import type { CmcdKey } from '../CmcdKey.js';
import type { CmcdValue } from '../CmcdValue.js';
import { isCmcdEventKey } from '../isCmcdEventKey.js';
import { isCmcdRequestKey } from '../isCmcdRequestKey.js';
import { isCmcdResponseKey } from '../isCmcdResponseKey.js';
import { isCmcdV1Key } from '../isCmcdV1Key.js';

const filterMap = {
	[CMCD_RESPONSE_MODE]: isCmcdResponseKey,
	[CMCD_EVENT_MODE]: isCmcdEventKey,
	[CMCD_REQUEST_MODE]: isCmcdRequestKey,
};

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
export function processCmcd(obj: CmcdData | null | undefined, options: CmcdEncodeOptions = {}): CmcdData {
	const results: CmcdData = {};

	if (obj == null || typeof obj !== 'object') {
		return results;
	}

	const version = options.version || obj.v || 1;
	const reportingMode = options.reportingMode || CMCD_REQUEST_MODE;
	const filter = options.filter;
	const keyFilter = version === 1 ? isCmcdV1Key : filterMap[reportingMode];

	const keys = Object.keys(obj).sort() as CmcdKey[];
	const formatters = Object.assign({}, CmcdFormatters, options.formatters);

	keys.forEach(key => {
		if (keyFilter(key) === false) {
			return;
		}

		if (filter?.(key) === false) {
			return;
		}

		let value = obj[key] as CmcdValue;

		const formatter = formatters[key];
		if (typeof formatter === 'function') {
			value = formatter(value, options);
		}

		// Version should only be reported if not equal to 1.
		if (key === 'v' && version === 1) {
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

	// Ensure version is set for non-v1
	if (version > 1) {
		results.v = version;
	}

	return results;
}
