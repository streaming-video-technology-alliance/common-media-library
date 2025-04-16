import { symbolToStr } from '../cta/utils/symbolToStr.ts';
import { SfToken } from '../structuredfield/SfToken.ts';
import type { Cmcd } from './Cmcd.ts';
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts';
import { processCmcd } from './utils/processCmcd.ts';

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
 */
export function toCmcdJson(cmcd: Cmcd, options?: CmcdEncodeOptions): string {
	const data = processCmcd(cmcd, options);

	return JSON.stringify(data, (_, value) => typeof value === 'symbol' || value instanceof SfToken ? symbolToStr(value) : value);
}
