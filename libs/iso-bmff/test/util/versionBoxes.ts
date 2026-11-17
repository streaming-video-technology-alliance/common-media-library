import { boxBytes } from './wideBoxes.ts'

const size = (version: number): 4 | 8 => (version === 0 ? 4 : 8)

/**
 * Builds a sidx box with one reference.
 *
 * @param version - The version of the box. Version 0 has 4-byte fields, every other version has 8-byte fields.
 * @returns The bytes of the box.
 */
export function sidxBox(version: number): Uint8Array<ArrayBuffer> {
	return boxBytes(
		'sidx',
		[version, 1],
		[0, 3],
		[1, 4],
		[2, 4],
		[3, size(version)],
		[4, size(version)],
		[0, 2],
		[1, 2],
		[100, 4],
		[5, 4],
		[0x90000000, 4],
	)
}

/**
 * Builds a prft box.
 *
 * @param version - The version of the box. Version 0 has a 4-byte `media_time`, every other version has 8 bytes.
 * @returns The bytes of the box.
 */
export function prftBox(version: number): Uint8Array<ArrayBuffer> {
	return boxBytes('prft', [version, 1], [0, 3], [1, 4], [2, 4], [3, 4], [4, size(version)])
}

/**
 * Builds a ctts box with an `entry_count` of 1, then a `sample_count` of 1 and a `sample_offset` of -2.
 *
 * @param version - The version of the box.
 * @returns The bytes of the box.
 */
export function cttsBox(version: number): Uint8Array<ArrayBuffer> {
	return boxBytes('ctts', [version, 1], [0, 3], [1, 4], [1, 4], [-2, 4])
}

/**
 * Builds a trun box with the flag 0x000800 and one sample, with a `sample_composition_time_offset` of the bytes `ff ff ff fe`.
 *
 * @param version - The version of the box. Version 0 has an unsigned offset, every other version has a signed offset.
 * @returns The bytes of the box.
 */
export function trunBox(version: number): Uint8Array<ArrayBuffer> {
	return boxBytes('trun', [version, 1], [0x800, 3], [1, 4], [-2, 4])
}
