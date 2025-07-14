import { isTokenField } from '../cta/utils/isTokenField.js';
import { isValid } from '../cta/utils/isValid.js';
import { SfToken } from '../structuredfield/SfToken.js';
import { CMCD_EVENT_MODE } from './CMCD_EVENT_MODE.js';
import { CMCD_FORMATTER_MAP } from './CMCD_FORMATTER_MAP.js';
import { CMCD_REQUEST_MODE } from './CMCD_REQUEST_MODE.js';
import { CMCD_RESPONSE_MODE } from './CMCD_RESPONSE_MODE.js';
import type { CmcdData } from './CmcdData.js';
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.js';
import type { CmcdFormatterOptions } from './CmcdFormatterOptions.js';
import type { CmcdValue } from './CmcdValue.js';
import { isCmcdEventKey } from './isCmcdEventKey.js';
import { isCmcdRequestKey } from './isCmcdRequestKey.js';
import { isCmcdResponseKey } from './isCmcdResponseKey.js';
import { isCmcdV1Key } from './isCmcdV1Key.js';

const filterMap = {
	[CMCD_RESPONSE_MODE]: isCmcdResponseKey,
	[CMCD_EVENT_MODE]: isCmcdEventKey,
	[CMCD_REQUEST_MODE]: isCmcdRequestKey,
};

/**
 * Convert a generic object to CMCD data.
 *
 * @param obj - The CMCD object to process.
 * @param options - Options for encoding.
 *
 * @group CMCD
 *
 * @beta
 */
export function prepareCmcdData(obj: Record<string, any>, options: CmcdEncodeOptions = {}): CmcdData {
	const results: CmcdData = {};

	if (obj == null || typeof obj !== 'object') {
		return results;
	}

	const version = options.version || (obj['v'] as number) || 1;
	const reportingMode = options.reportingMode || CMCD_REQUEST_MODE;
	const keyFilter = version === 1 ? isCmcdV1Key : filterMap[reportingMode];

	// Filter keys based on the version, reporting mode and options
	let keys = Object.keys(obj).filter(keyFilter);

	const filter = options.filter;
	if (typeof filter === 'function') {
		keys = keys.filter(filter);
	}

	// Ensure all required keys are present before sorting
	const needsTimestamp = reportingMode === CMCD_RESPONSE_MODE || reportingMode === CMCD_EVENT_MODE;
	if (needsTimestamp && !keys.includes('ts')) {
		keys.push('ts');
	}

	if (version > 1 && !keys.includes('v')) {
		keys.push('v');
	}

	const formatters = Object.assign({}, CMCD_FORMATTER_MAP, options.formatters);
	const formatterOptions: CmcdFormatterOptions = {
		version,
		reportingMode,
		baseUrl: options.baseUrl,
	};

	keys.sort().forEach(key => {
		let value = obj[key] as CmcdValue;

		const formatter = formatters[key];
		if (typeof formatter === 'function') {
			value = formatter(value, formatterOptions);
		}

		// Version should only be reported if not equal to 1.
		if (key === 'v') {
			if (version === 1) {
				return;
			}
			else {
				value = version;
			}
		}

		// Playback rate should only be sent if not equal to 1.
		if (key == 'pr' && value === 1) {
			return;
		}

		// Ensure a timestamp is set for response and event modes
		if (needsTimestamp && key === 'ts' && !Number.isFinite(value)) {
			value = Date.now();
		}

		// ignore invalid values
		if (!isValid(value)) {
			return;
		}

		if (isTokenField(key) && typeof value === 'string') {
			value = new SfToken(value);
		}

		(results as any)[key] = value;
	});

	return results;
}
