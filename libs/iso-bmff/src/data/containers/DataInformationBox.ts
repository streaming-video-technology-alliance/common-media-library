import { ContainerBox } from '../ContainerBox.ts'
import type { DataReferenceBox } from '../DataReferenceBox.ts'

/**
 * Data Information Box - 'dinf' - Container
 */
export class DataInformationBox extends ContainerBox<DataReferenceBox> {
	static readonly type = 'dinf'
	constructor(boxes: DataReferenceBox[] = []) {
		super('dinf', boxes)
	}
}
