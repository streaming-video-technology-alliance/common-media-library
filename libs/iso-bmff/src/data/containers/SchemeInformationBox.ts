import { Box } from '../Box.ts'
import { ContainerBox } from '../ContainerBox.ts'

/**
 * Scheme Information Box - 'schi' - Container
 */
export class SchemeInformationBox extends ContainerBox<Box> {
	static readonly type = 'schi'
	constructor(boxes: Box[] = []) {
		super('schi', boxes)
	}
}
