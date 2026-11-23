/**
 * Returns the four-character code of a box: the `type` of a box object, or the `boxType` of a raw box.
 *
 * @param box - The box.
 * @returns The four-character code.
 */
export function typeOf(box: { type?: string; boxType?: string }): string | undefined {
	return box.type ?? box.boxType
}
