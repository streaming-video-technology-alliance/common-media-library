import type { Box } from '../boxes/types/Box.ts'
import type { FullBox } from '../boxes/types/FullBox.ts'

/**
 * Check if a box is a full box
 *
 * @param box - The box to check
 *
 * @returns `true` if the box is a full box, `false` otherwise
 *
 * @public
 */
export function isFullBox(box: Box): box is FullBox {
	return 'version' in box && 'flags' in box
}
