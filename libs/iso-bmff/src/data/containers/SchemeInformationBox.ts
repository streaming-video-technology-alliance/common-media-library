import { Box } from '../Box.ts'
import { ContainerBox } from '../ContainerBox.ts'

/**
 * Scheme Information Box - 'schi' - Container
 */
export class SchemeInformationBox extends ContainerBox<Box> {
	constructor(boxes: Box[] = []) {
		super('schi', boxes)
	}
}
