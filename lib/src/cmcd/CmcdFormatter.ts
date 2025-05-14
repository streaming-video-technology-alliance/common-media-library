import type { CmcdEncodeOptions } from './CmcdEncodeOptions';
import type { CmcdValue } from './CmcdValue';

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
