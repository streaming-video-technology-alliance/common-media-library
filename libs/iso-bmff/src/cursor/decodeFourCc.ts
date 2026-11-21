/**
 * Decodes the four-character code at a byte offset of a view.
 *
 * @param view - The view to read from.
 * @param at - The byte offset of the code.
 * @returns The code.
 *
 * @internal
 */
export function decodeFourCc(view: DataView, at: number): string {
	return String.fromCharCode(
		view.getUint8(at),
		view.getUint8(at + 1),
		view.getUint8(at + 2),
		view.getUint8(at + 3),
	)
}
