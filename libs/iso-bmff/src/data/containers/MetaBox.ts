import { ContainerBox } from '../ContainerBox.ts'
import { FullBox } from '../FullBox.ts'
import type { DataInformationBox } from './DataInformationBox.ts'
import type { HandlerReferenceBox } from '../HandlerReferenceBox.ts'
import type { ItemInfoBox } from './ItemInfoBox.ts'
import { Box } from '../Box.ts'
import type { ItemProtectionBox } from './ItemProtectionBox.ts'
import type { ItemReferenceBox } from './ItemReferenceBox.ts'

/**
 * ISO/IEC 14496-12:202x - 8.11.1 Meta box
 */
export class MetaBox extends ContainerBox<HandlerReferenceBox | Box | DataInformationBox | Box | ItemProtectionBox | ItemInfoBox | ItemReferenceBox> {
	version: number
	flags: number

	constructor(
		version: number,
		flags: number,
		boxes: (HandlerReferenceBox | Box | DataInformationBox | ItemProtectionBox | ItemInfoBox | ItemReferenceBox)[] = []
	) {
		super('meta', boxes)
		this.version = version
		this.flags = flags
	}

	get size(): number {
		// 8 (box header) + 4 (FullBox) + sum of child box sizes
		let size = 8 + 4
		for (const box of this.boxes) {
			size += box.size
		}
		return size
	}
}
