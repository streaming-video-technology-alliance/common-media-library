import { type SfBareItem, SfItem } from '@svta/cml-structured-field-values'

/**
 * Convert a value to a CMCD value.
 *
 * @param value - The value to convert to a CMCD value.
 * @param params - The parameters to convert to a CMCD value.
 * @returns The CMCD value.
 *
 * @public
 */
export function toCmcdValue<V extends SfBareItem, P>(value: V, params?: P): SfItem<V, P> {
	return new SfItem(value, params)
}
