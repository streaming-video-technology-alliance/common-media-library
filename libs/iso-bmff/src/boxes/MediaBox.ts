import type { ContainerBox } from './ContainerBox.ts'
import type { HandlerReferenceBox } from './HandlerReferenceBox.ts'
import type { MediaHeaderBox } from './MediaHeaderBox.ts'
import type { MediaInformationBox } from './MediaInformationBox.ts'

/**
 * Media Box - 'mdia' - Container
 *
 * @public
 */
export type MediaBox = ContainerBox<MediaHeaderBox | HandlerReferenceBox | MediaInformationBox> & {
	type: 'mdia';
};
