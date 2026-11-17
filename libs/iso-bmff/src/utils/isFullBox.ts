import type { FullBox } from '../boxes/FullBox.ts'

/**
 * Check if a box is a full box
 *
 * @param box - The box to check
 *
 * @returns `true` if the box is a full box, `false` otherwise
 *
 * @example
 * {@includeCode ../../test/isFullBox.test.ts#example}
 *
 * @public
 */
export function isFullBox(box: any): box is FullBox {
	return 'version' in box && 'flags' in box
}
