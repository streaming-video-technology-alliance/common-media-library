import type { ItemProtectionBox } from '../../boxes/ItemProtectionBox.ts'
import type { ProtectionSchemeInformationBox } from '../../boxes/ProtectionSchemeInformationBox.ts'
import { ContainerBoxBase } from '../ContainerBoxBase.ts'

/**
 * Item Protection Box - 'ipro' - Container
 */
export class ipro extends ContainerBoxBase<ItemProtectionBox, ProtectionSchemeInformationBox> {
	static readonly type = 'ipro'
	protectionCount: number

	constructor(protectionCount: number, boxes: ProtectionSchemeInformationBox[] = []) {
		super('ipro', boxes)
		this.protectionCount = protectionCount
	}

	override get size(): number {
		// 4 (protectionCount) + sum of child box sizes
		let size = 4
		for (const box of this.boxes) {
			size += box.size
		}
		return size
	}
}
