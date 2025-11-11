import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.6.6 Degradation Priority Box
 */
export class DegradationPriorityBox extends FullBox {
	static readonly type = 'stdp'

	priority: number[]

	constructor(version: number, flags: number, priority: number[] = []) {
		super('stdp', version, flags)
		this.priority = priority
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + (priority.length * 2)
		return 12 + (this.priority.length * 2)
	}
}
