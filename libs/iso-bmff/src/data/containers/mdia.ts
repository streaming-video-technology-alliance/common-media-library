import type { HandlerReferenceBox } from '../../boxes/HandlerReferenceBox.ts'
import type { MediaBox } from '../../boxes/MediaBox.ts'
import type { MediaHeaderBox } from '../../boxes/MediaHeaderBox.ts'
import type { MediaInformationBox } from '../../boxes/MediaInformationBox.ts'
import { ContainerBoxBase } from '../ContainerBoxBase.ts'

/**
 * Media Box - 'mdia' - Container
 */
export class mdia extends ContainerBoxBase<MediaBox, MediaHeaderBox | HandlerReferenceBox | MediaInformationBox> {
	static readonly type = 'mdia'

	constructor(boxes: (MediaHeaderBox | HandlerReferenceBox | MediaInformationBox)[] = []) {
		super('mdia', boxes)
	}
}
