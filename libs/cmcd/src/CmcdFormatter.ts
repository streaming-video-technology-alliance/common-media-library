import type { SfItem } from '@svta/cml-structured-field-values'
import type { ValueOrArray } from '@svta/cml-utils'
import type { CmcdFormatterOptions } from './CmcdFormatterOptions.ts'
import type { CmcdValue } from './CmcdValue.ts'

/**
 * A formatter for CMCD values.
 *
 * @param value - The value to format.
 *
 * @returns The formatted value.
 *
 * @public
 */
export type CmcdFormatter = (value: CmcdValue, options: CmcdFormatterOptions) => ValueOrArray<number | SfItem<number>> | ValueOrArray<string | SfItem<string>>;
