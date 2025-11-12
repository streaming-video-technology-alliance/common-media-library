import type { EditBox } from '../../boxes/EditBox.ts'
import type { EditListBox } from '../../boxes/EditListBox.ts'
import { ContainerBoxBase } from '../ContainerBoxBase.ts'

/**
 * Edit Box - 'edts' - Container
 */
export class edts extends ContainerBoxBase<EditBox, EditListBox> {
	static readonly type = 'edts'

	constructor(boxes: EditListBox[] = []) {
		super('edts', boxes)
	}
}
