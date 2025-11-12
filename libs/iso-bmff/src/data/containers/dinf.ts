import type { DataInformationBox } from '../../boxes/DataInformationBox.ts'
import type { DataReferenceBox } from '../../boxes/DataReferenceBox.ts'
import { ContainerBoxBase } from '../ContainerBoxBase.ts'

/**
 * Data Information Box - 'dinf' - Container
 */
export class dinf extends ContainerBoxBase<DataInformationBox, DataReferenceBox> {
	static readonly type = 'dinf'
	constructor(boxes: DataReferenceBox[] = []) {
		super('dinf', boxes)
	}
}
