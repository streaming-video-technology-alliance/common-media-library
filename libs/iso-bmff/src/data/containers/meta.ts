import type { Box } from '../../boxes/Box.ts'
import type { BoxType } from '../../boxes/BoxType.ts'
import type { DataInformationBox } from '../../boxes/DataInformationBox.ts'
import type { HandlerReferenceBox } from '../../boxes/HandlerReferenceBox.ts'
import type { ItemInfoBox } from '../../boxes/ItemInfoBox.ts'
import type { ItemProtectionBox } from '../../boxes/ItemProtectionBox.ts'
import type { ItemReferenceBox } from '../../boxes/ItemReferenceBox.ts'
import type { MetaBox } from '../../boxes/MetaBox.ts'
import { ContainerBoxBase } from '../ContainerBoxBase.ts'

/**
 * ISO/IEC 14496-12:202x - 8.11.1 Meta box
 */
export class meta extends ContainerBoxBase<MetaBox, HandlerReferenceBox | Box<BoxType> | DataInformationBox | ItemProtectionBox | ItemInfoBox | ItemReferenceBox> {
	static readonly type = 'meta'
	version: number
	flags: number

	constructor(
		version: number,
		flags: number,
		boxes: (HandlerReferenceBox | Box<BoxType> | DataInformationBox | ItemProtectionBox | ItemInfoBox | ItemReferenceBox)[] = []
	) {
		super('meta', boxes)
		this.version = version
		this.flags = flags
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + sum of child box sizes
		let size = 8 + 4
		for (const box of this.boxes) {
			size += box.size
		}
		return size
	}
}
