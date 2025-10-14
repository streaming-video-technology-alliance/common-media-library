import type { SfItem } from '@svta/cml-structured-field-values';
import type { ValueOrArray } from '@svta/cml-utils';
import type { CmcdFormatterOptions } from './CmcdFormatterOptions.js';
import type { CmcdValue } from './CmcdValue.js';

/**
 * A formatter for CMCD values.
 *
 * @param value - The value to format.
 *
 * @returns The formatted value.
 *
 *
 * @beta
 */
export type CmcdFormatter = (value: CmcdValue, options: CmcdFormatterOptions) => number | ValueOrArray<string> | ValueOrArray<SfItem>;
