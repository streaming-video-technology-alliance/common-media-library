import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts';
import type { CmcdValue } from './CmcdValue.ts';

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
