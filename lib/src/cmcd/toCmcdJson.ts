import { symbolToStr } from '../cta/utils/symbolToStr.js';
import { SfToken } from '../structuredfield/SfToken.js';
import type { Cmcd } from './Cmcd.js';
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.js';
import { prepareCmcdData } from './prepareCmcdData.js';

/**
 * Convert a CMCD data object to JSON.
 *
 * @param cmcd - The CMCD object to convert.
 * @param options - Options for encoding the CMCD object.
 *
 * @returns The CMCD JSON.
 *
 * @group CMCD
 *
 * @beta
 *
 * @deprecated Sending CMCD as JSON objects is deprecated. Use `toCmcdUrl` to create an array of url strings instead.
 */
export function toCmcdJson(cmcd: Cmcd, options?: CmcdEncodeOptions): string {
	const data = prepareCmcdData(cmcd, options);

	return JSON.stringify(data, (_, value) => typeof value === 'symbol' || value instanceof SfToken ? symbolToStr(value) : value);
}
