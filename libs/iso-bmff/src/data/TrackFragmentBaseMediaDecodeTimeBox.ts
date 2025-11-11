import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.12 Track Fragment Decode Time
 */
export class TrackFragmentBaseMediaDecodeTimeBox extends FullBox {
	static readonly type = 'tfdt'

	baseMediaDecodeTime: number

	constructor(version: number, flags: number, baseMediaDecodeTime: number) {
		super('tfdt', version, flags)
		this.baseMediaDecodeTime = baseMediaDecodeTime
	}

	override get size(): number {
		const timeSize = this.version === 1 ? 8 : 4
		// 8 (box header) + 4 (FullBox) + timeSize
		return 12 + timeSize
	}
}
