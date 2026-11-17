import { boxBytes } from './wideBoxes.ts'

export const SYSTEM_ID: number[] = new Array<number>(16).fill(0xaa)
export const KID_A: number[] = new Array<number>(16).fill(0x11)
export const KID_B: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]

/**
 * Builds a pssh box.
 *
 * @param version - The version of the box.
 * @param fields - The bytes of the fields after SystemID.
 * @returns The bytes of the box.
 */
export function psshBox(version: number, fields: number[]): Uint8Array<ArrayBuffer> {
	return boxBytes('pssh', [version, 1], [0, 3], new Uint8Array(SYSTEM_ID), new Uint8Array(fields))
}
