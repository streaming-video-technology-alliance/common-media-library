import type { Box } from '../../boxes/Box.ts'
import type { BoxType } from '../../boxes/BoxType.ts'
import type { SchemeInformationBox } from '../../boxes/SchemeInformationBox.ts'
import { ContainerBoxBase } from '../ContainerBoxBase.ts'

/**
 * Scheme Information Box - 'schi' - Container
 */
export class schi extends ContainerBoxBase<SchemeInformationBox, Box<BoxType>> {
	static readonly type = 'schi'

	constructor(boxes: Box<BoxType>[] = []) {
		super('schi', boxes)
	}
}
