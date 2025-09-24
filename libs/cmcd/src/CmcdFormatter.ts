import type { SfItem } from '@svta/cml-structuredfield/SfItem.js';
import type { ValueOrArray } from '@svta/cml-utils/ValueOrArray.js';
import type { CmcdFormatterOptions } from './CmcdFormatterOptions.js';
import type { CmcdValue } from './CmcdValue.js';

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
export type CmcdFormatter = (value: CmcdValue, options: CmcdFormatterOptions) => number | ValueOrArray<string> | ValueOrArray<SfItem>;
