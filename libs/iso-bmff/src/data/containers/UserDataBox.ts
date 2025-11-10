import { Box } from '../Box.ts'
import { ContainerBox } from '../ContainerBox.ts'

/**
 * User Data Box - 'udta' - Container
 */
export class UserDataBox extends ContainerBox<Box> {
	static readonly type = 'udta'
	constructor(boxes: Box[] = []) {
		super('udta', boxes)
	}
}
