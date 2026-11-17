import type { FullBox } from '../boxes/FullBox.ts'

/**
 * Check if a value is a full box
 *
 * @param box - The value to check
 *
 * @returns `true` if the value is a full box, `false` otherwise
 *
 * @example
 * {@includeCode ../../test/isFullBox.test.ts#example}
 *
 * @public
 */
export function isFullBox(box: unknown): box is FullBox {
	return typeof box === 'object' && box !== null && 'version' in box && 'flags' in box
}
