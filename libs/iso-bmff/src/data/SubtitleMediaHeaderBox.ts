import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2015 - 8.4.5.6 Subtitle Media Header Box
 */
export class SubtitleMediaHeaderBox extends FullBox {
	static readonly type = 'sthd'

	/**
	 * Reads a SubtitleMediaHeaderBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2015 - 8.4.5.6 Subtitle Media Header Box
	 */
	static read(view: IsoView): SubtitleMediaHeaderBox {
		const { version, flags } = view.readFullBox()
		return new SubtitleMediaHeaderBox(version, flags)
	}

	/**
	 * Writes a SubtitleMediaHeaderBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2015 - 8.4.5.6 Subtitle Media Header Box
	 */
	static write(box: SubtitleMediaHeaderBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
	}

	constructor(version: number, flags: number) {
		super('sthd', version, flags)
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox)
		return 12
	}
}
