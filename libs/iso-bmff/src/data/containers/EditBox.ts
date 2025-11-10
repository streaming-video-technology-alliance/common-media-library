import { ContainerBox } from '../ContainerBox.ts'
import type { EditListBox } from '../EditListBox.ts'

/**
 * Edit Box - 'edts' - Container
 */
export class EditBox extends ContainerBox<EditListBox> {
	static readonly type = 'edts'
	constructor(boxes: EditListBox[] = []) {
		super('edts', boxes)
	}
}
