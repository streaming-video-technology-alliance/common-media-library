import type { Box } from '../../boxes/Box.ts'
import type { BoxType } from '../../boxes/BoxType.ts'
import type { UserDataBox } from '../../boxes/UserDataBox.ts'
import { ContainerBoxBase } from '../ContainerBoxBase.ts'

/**
 * User Data Box - 'udta' - Container
 */
export class udta extends ContainerBoxBase<UserDataBox, Box<BoxType>> {
	static readonly type = 'udta'

	constructor(boxes: Box<BoxType>[] = []) {
		super('udta', boxes)
	}
}
