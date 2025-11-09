import { ContainerBox } from '../ContainerBox.ts'
import type { ProtectionSchemeInformationBox } from './ProtectionSchemeInformationBox.ts'

/**
 * Item Protection Box - 'ipro' - Container
 */
export class ItemProtectionBox extends ContainerBox<ProtectionSchemeInformationBox> {
	protectionCount: number

	constructor(protectionCount: number, boxes: ProtectionSchemeInformationBox[] = []) {
		super('ipro', boxes)
		this.protectionCount = protectionCount
	}

	get size(): number {
		// 8 (box header) + 4 (protectionCount) + sum of child box sizes
		let size = 8 + 4
		for (const box of this.boxes) {
			size += box.size
		}
		return size
	}
}
