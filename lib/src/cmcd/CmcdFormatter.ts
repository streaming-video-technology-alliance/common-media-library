import { CmcdValue } from './CmcdValue.js';

/**
 * A formatter for CMCD values.
 * 
 * @param value - The value to format.
 * 
 * @returns The formatted value.
 * 
 * @group CMCD
 */
export type CmcdFormatter = (value: CmcdValue) => string;