import type { ContainerBox } from './ContainerBox.js';
import type { HandlerReferenceBox } from './HandlerReferenceBox.js';
import type { MediaHeaderBox } from './MediaHeaderBox.js';
import type { MediaInformationBox } from './MediaInformationBox.js';

/**
 * Media Box - 'mdia' - Container
 *
 *
 * @beta
 */
export type MediaBox = ContainerBox<MediaHeaderBox | HandlerReferenceBox | MediaInformationBox> & {
	type: 'mdia';
};
