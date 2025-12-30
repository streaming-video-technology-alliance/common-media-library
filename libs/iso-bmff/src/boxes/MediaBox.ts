import type { HandlerReferenceBox } from './HandlerReferenceBox.ts'
import type { MediaHeaderBox } from './MediaHeaderBox.ts'
import type { MediaInformationBox } from './MediaInformationBox.ts'

/**
 * Child boxes of Media Box
 *
 * @public
 */
export type MediaBoxChild = MediaHeaderBox | HandlerReferenceBox | MediaInformationBox;

/**
 * Media Box - 'mdia' - Container
 *
 * @public
 */
export type MediaBox = {
	type: 'mdia';
	boxes: MediaBoxChild[];
};

/**
 * @public
 */
export type mdia = MediaBox;
