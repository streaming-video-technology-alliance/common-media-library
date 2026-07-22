import { SfItem } from '@svta/cml-structured-field-values'

// Control characters fail RFC 8941 string serialization (serializeString).
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x1f\x7f]/

/**
 * Checks if the given value can be serialized as a structured field value
 * without throwing. String values containing control characters — including
 * inside arrays and `SfItem` wrappers — fail RFC 8941 string serialization,
 * so they are treated as unserializable.
 *
 * @param value - The value to check.
 *
 * @returns `true` if the value is serializable.
 *
 * @internal
 */
export function isSerializableValue(value: unknown): boolean {
	if (typeof value === 'string') {
		return !CONTROL_CHARS.test(value)
	}

	if (Array.isArray(value)) {
		return value.every(isSerializableValue)
	}

	if (value instanceof SfItem) {
		return isSerializableValue(value.value)
	}

	return true
}
