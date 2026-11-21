import { boxBytes } from './wideBoxes.ts'

export const KID: Uint8Array = new Uint8Array([
	1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
])
export const IV: Uint8Array = new Uint8Array([
	161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176,
])

/**
 * Builds a tenc box.
 *
 * @param body - The bytes of the box body.
 * @returns The bytes of the box.
 */
export function tencBox(...body: number[]): Uint8Array<ArrayBuffer> {
	return boxBytes('tenc', new Uint8Array(body))
}
