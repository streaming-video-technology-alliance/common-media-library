import { SfItem } from '@svta/cml-structured-field-values'

/**
 * Returns the value inside an `SfItem`, or the value itself.
 *
 * `decodeCmcd` returns a member with parameters as an `SfItem`. For an
 * inner list with parameters, the value of the `SfItem` is the list.
 *
 * @param value - The value to read.
 * @returns The value without its parameters.
 *
 * @internal
 */
export function toBareValue(value: unknown): unknown {
	return value instanceof SfItem ? value.value : value
}
