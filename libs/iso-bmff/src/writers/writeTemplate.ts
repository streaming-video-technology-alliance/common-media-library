import { writeUint } from './writeUint.ts'

/**
 * Write a template (fixed-point) number to a DataView at the specified offset.
 * Template numbers are 16.16 fixed-point for 4 bytes or 8.8 fixed-point for 2 bytes.
 *
 * @param dataView - The DataView to write to
 * @param offset - The byte offset to write at
 * @param size - The size in bytes (2 or 4)
 * @param value - The template value to write
 *
 * @beta
 */
export function writeTemplate(dataView: DataView, offset: number, size: number, value: number): void {
	const shift = size === 4 ? 16 : 8
	const fixedPoint = Math.round(value * Math.pow(2, shift))
	writeUint(dataView, offset, size, fixedPoint)
}

