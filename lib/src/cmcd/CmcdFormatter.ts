import { CmcdEncodeOptions } from './CmcdEncodeOptions.js';
import { CmcdValue } from './CmcdValue.js';

/**
 * A formatter for CMCD values.
 *
 * @param value - The value to format.
 *
 * @returns The formatted value.
 *
 * @group CMCD
 *
 * @beta
 */
export type CmcdFormatter = (value: CmcdValue, options?: CmcdEncodeOptions) => string | number;
