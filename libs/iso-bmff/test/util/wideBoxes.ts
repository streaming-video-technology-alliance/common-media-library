/** An integer field of a box as `[value, size in bytes]`, or the bytes of a field. */
export type BoxField = [value: number | bigint, size: 1 | 2 | 3 | 4 | 8] | Uint8Array

/**
 * Builds the bytes of a box from its fields.
 *
 * @param type - The four-character type of the box.
 * @param fields - The fields of the box body, in the order of the bytes.
 * @returns The bytes of the box.
 */
export function boxBytes(type: string, ...fields: BoxField[]): Uint8Array<ArrayBuffer> {
	const length = fields.reduce(
		(sum, field) => sum + (field instanceof Uint8Array ? field.length : field[1]),
		8,
	)
	const bytes = new Uint8Array(length)
	const view = new DataView(bytes.buffer)
	let offset = 8

	view.setUint32(0, length)
	bytes.set(
		[...type].map(char => char.charCodeAt(0)),
		4,
	)

	for (const field of fields) {
		if (field instanceof Uint8Array) {
			bytes.set(field, offset)
			offset += field.length
			continue
		}

		const [value, size] = field

		if (size === 8) {
			view.setBigUint64(offset, BigInt.asUintN(64, BigInt(value)))
		} else if (size === 4) {
			view.setUint32(offset, Number(value) >>> 0)
		} else if (size === 3) {
			view.setUint16(offset, Number(value) >> 8)
			view.setUint8(offset + 2, Number(value) & 0xff)
		} else if (size === 2) {
			view.setUint16(offset, Number(value))
		} else {
			view.setUint8(offset, Number(value))
		}

		offset += size
	}

	return bytes
}

/** A built-in box type with 64-bit integer fields. */
export type WideBox = {
	/** The type of the box. */
	type: string
	/** The path of each 64-bit integer field in the parsed box, in the order of the bytes. */
	paths: string[]
	/** The index in `paths` of each signed field. */
	signed?: number[]
	/** `true` when the fields have 8 bytes in every box. The box then has no form with 4-byte fields. */
	fixed?: boolean
	/**
	 * Builds the bytes of the box.
	 *
	 * @param values - The value of each field in `paths`.
	 * @param size - The size of each field in bytes. The version of the box is 1 for 8 and 0 for 4.
	 */
	bytes: (values: (number | bigint)[], size: 4 | 8) => Uint8Array<ArrayBuffer>
}

const full = (size: 4 | 8, flags: number = 0): BoxField[] => [
	[size === 8 ? 1 : 0, 1],
	[flags, 3],
]

const MATRIX: BoxField[] = [0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000].map(value => [value, 4])

const zeros = (count: number): BoxField[] => Array.from({ length: count }, () => [0, 4])

const text = (value: string): Uint8Array =>
	new Uint8Array([...value].map(char => char.charCodeAt(0)))

/** The eleven built-in box types with 64-bit integer fields. */
export const WIDE_BOXES: WideBox[] = [
	{
		type: 'tfdt',
		paths: ['baseMediaDecodeTime'],
		bytes: ([a], size) => boxBytes('tfdt', ...full(size), [a, size]),
	},
	{
		type: 'sidx',
		paths: ['earliestPresentationTime', 'firstOffset'],
		bytes: ([a, b], size) =>
			boxBytes('sidx', ...full(size), [1, 4], [90000, 4], [a, size], [b, size], [0, 2], [0, 2]),
	},
	{
		type: 'tfra',
		paths: ['entries.0.time', 'entries.0.moofOffset', 'entries.1.time', 'entries.1.moofOffset'],
		bytes: ([a, b, c, d], size) =>
			boxBytes(
				'tfra',
				...full(size),
				[1, 4],
				[0, 4],
				[2, 4],
				[a, size],
				[b, size],
				[1, 1],
				[1, 1],
				[1, 1],
				[c, size],
				[d, size],
				[1, 1],
				[1, 1],
				[2, 1],
			),
	},
	{
		type: 'prft',
		paths: ['mediaTime'],
		bytes: ([a], size) => boxBytes('prft', ...full(size), [1, 4], [2, 4], [3, 4], [a, size]),
	},
	{
		type: 'emsg',
		paths: ['presentationTime'],
		fixed: true,
		bytes: ([a]) =>
			boxBytes(
				'emsg',
				...full(8),
				[90000, 4],
				[a, 8],
				[10, 4],
				[1, 4],
				text('urn:test\0'),
				text('value\0'),
				new Uint8Array([1, 2, 3]),
			),
	},
	{
		type: 'mehd',
		paths: ['fragmentDuration'],
		bytes: ([a], size) => boxBytes('mehd', ...full(size), [a, size]),
	},
	{
		type: 'mvhd',
		paths: ['creationTime', 'modificationTime', 'duration'],
		bytes: ([a, b, c], size) =>
			boxBytes(
				'mvhd',
				...full(size),
				[a, size],
				[b, size],
				[1000, 4],
				[c, size],
				[0x10000, 4],
				[0x100, 2],
				[0, 2],
				...zeros(2),
				...MATRIX,
				...zeros(6),
				[2, 4],
			),
	},
	{
		type: 'mdhd',
		paths: ['creationTime', 'modificationTime', 'duration'],
		bytes: ([a, b, c], size) =>
			boxBytes(
				'mdhd',
				...full(size),
				[a, size],
				[b, size],
				[1000, 4],
				[c, size],
				[0x55c4, 2],
				[0, 2],
			),
	},
	{
		type: 'tkhd',
		paths: ['creationTime', 'modificationTime', 'duration'],
		bytes: ([a, b, c], size) =>
			boxBytes(
				'tkhd',
				...full(size, 3),
				[a, size],
				[b, size],
				[1, 4],
				[0, 4],
				[c, size],
				...zeros(2),
				[0, 2],
				[0, 2],
				[0x100, 2],
				[0, 2],
				...MATRIX,
				[0, 4],
				[0, 4],
			),
	},
	{
		type: 'elst',
		paths: [
			'entries.0.segmentDuration',
			'entries.0.mediaTime',
			'entries.1.segmentDuration',
			'entries.1.mediaTime',
		],
		signed: [1, 3],
		bytes: ([a, b, c, d], size) =>
			boxBytes(
				'elst',
				...full(size),
				[2, 4],
				[a, size],
				[b, size],
				[1, 2],
				[0, 2],
				[c, size],
				[d, size],
				[1, 2],
				[0, 2],
			),
	},
	{
		type: 'tfhd',
		paths: ['baseDataOffset'],
		fixed: true,
		bytes: ([a]) => boxBytes('tfhd', [0, 1], [1, 3], [1, 4], [a, 8]),
	},
]

/**
 * Returns a value for each 64-bit integer field of a box.
 * Each value is distinct, and a signed field gets a negative value.
 *
 * @param box - The box.
 * @param base - The magnitude of the first value.
 * @param step - The difference between the magnitudes of two fields.
 * @returns The value of each field in `box.paths`.
 */
export function wideValues(box: WideBox, base: bigint, step: bigint = BigInt(2)): bigint[] {
	return box.paths.map((_, i) => {
		const value = base + step * BigInt(i)
		return box.signed?.includes(i) ? -value : value
	})
}

/**
 * Reads the value at a path of a parsed box.
 *
 * @param box - The parsed box.
 * @param path - The path, with a dot between the keys.
 * @returns The value.
 */
export function valueAt(box: unknown, path: string): unknown {
	return path
		.split('.')
		.reduce<unknown>((value, key) => (value as Record<string, unknown>)[key], box)
}

/**
 * Lists every field of a parsed box that holds a `bigint`.
 *
 * @param box - The parsed box.
 * @returns The value of each field by its path.
 */
export function bigintFields(box: unknown, path: string = ''): Record<string, bigint> {
	if (typeof box === 'bigint') {
		return { [path]: box }
	}

	if (box === null || typeof box !== 'object' || ArrayBuffer.isView(box)) {
		return {}
	}

	return Object.assign(
		{},
		...Object.entries(box)
			.filter(([key]) => key !== 'view')
			.map(([key, value]) => bigintFields(value, path ? `${path}.${key}` : key)),
	) as Record<string, bigint>
}
