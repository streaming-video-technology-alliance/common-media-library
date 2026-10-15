import { CborTag } from './readCborItem.ts'

const TAG_DATE_TIME_STRING = 0
const TAG_EPOCH_DATE_TIME = 1
const MILLISECONDS_PER_SECOND = 1000

function setKey(map: Record<string, unknown>, key: string, value: unknown): void {
	if (key === '__proto__') Object.defineProperty(map, key, { value, enumerable: true, writable: true, configurable: true })
	else map[key] = value
}

/**
 * Projects a tree from {@link readCborItem} to its public shape.
 *
 * Tag 0 with a text string and tag 1 with a number become a `Date` (RFC 8949 sections 3.4.1 and 3.4.2).
 * Every other {@link CborTag} becomes a plain `{ tag, value }` object. Arrays and maps are copied.
 * Byte strings and primitive values are returned as they are.
 *
 * @param value - A value from {@link readCborItem}
 * @returns The projected value
 *
 * @example
 * {@includeCode ../../test/cbor/cborEquivalence.test.ts#example}
 *
 * @internal
 */
export function projectCborTags(value: unknown): unknown {
	if (value instanceof CborTag) {
		const content = value.value
		if (value.tag === TAG_DATE_TIME_STRING && typeof content === 'string') return new Date(content)
		if (value.tag === TAG_EPOCH_DATE_TIME && typeof content === 'number') return new Date(Math.round(content * MILLISECONDS_PER_SECOND))
		return { tag: value.tag, value: projectCborTags(content) }
	}
	if (Array.isArray(value)) return value.map(projectCborTags)
	if (value !== null && typeof value === 'object' && !(value instanceof Uint8Array)) {
		const map: Record<string, unknown> = {}
		for (const key of Object.keys(value)) setKey(map, key, projectCborTags((value as Record<string, unknown>)[key]))
		return map
	}
	return value
}
