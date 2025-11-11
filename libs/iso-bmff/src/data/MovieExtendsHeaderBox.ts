import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.2 Movie Extends Header Box
 */
export class MovieExtendsHeaderBox extends FullBox {
	static readonly type = 'mehd'

	/**
	 * Reads a MovieExtendsHeaderBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.2 Movie Extends Header Box
	 */
	static read(view: IsoView): MovieExtendsHeaderBox {
		const { version, flags } = view.readFullBox()
		const fragmentDuration = view.readUint(version === 1 ? 8 : 4)
		return new MovieExtendsHeaderBox(version, flags, fragmentDuration)
	}

	/**
	 * Writes a MovieExtendsHeaderBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.2 Movie Extends Header Box
	 */
	static write(box: MovieExtendsHeaderBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		const durationSize = box.version === 1 ? 8 : 4
		view.writeUint(box.fragmentDuration, durationSize)
	}

	fragmentDuration: number

	constructor(version: number, flags: number, fragmentDuration: number) {
		super('mehd', version, flags)
		this.fragmentDuration = fragmentDuration
	}

	override get size(): number {
		const durationSize = this.version === 1 ? 8 : 4
		// 8 (box header) + 4 (FullBox) + durationSize
		return 12 + durationSize
	}
}
