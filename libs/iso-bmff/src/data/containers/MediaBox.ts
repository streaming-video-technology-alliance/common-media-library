import { ContainerBox } from '../ContainerBox.ts'
import type { HandlerReferenceBox } from '../HandlerReferenceBox.ts'
import type { MediaHeaderBox } from '../MediaHeaderBox.ts'
import type { MediaInformationBox } from './MediaInformationBox.ts'

/**
 * Media Box - 'mdia' - Container
 */
export class MediaBox extends ContainerBox<MediaHeaderBox | HandlerReferenceBox | MediaInformationBox> {
	static readonly type = 'mdia'
	constructor(boxes: (MediaHeaderBox | HandlerReferenceBox | MediaInformationBox)[] = []) {
		super('mdia', boxes)
	}
}
