import type { VideoMediaHeaderBox } from '../boxes/VideoMediaHeaderBox.ts'
import { UINT } from '../fields/UINT.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBoxBase } from './FullBoxBase.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.4.5.2 Video Media Header Box
 */
export class vmhd extends FullBoxBase<VideoMediaHeaderBox> {
	static readonly type = 'vmhd'

	/**
	 * Reads a VideoMediaHeaderBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.4.5.2 Video Media Header Box
	 */
	static read(view: IsoView): VideoMediaHeaderBox {
		const { version, flags } = view.readFullBox()
		const graphicsmode = view.readUint(2)
		const opcolor = view.readArray(UINT, 2, 3)
		return new vmhd(version, flags, graphicsmode, opcolor)
	}

	/**
	 * Writes a VideoMediaHeaderBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.4.5.2 Video Media Header Box
	 */
	static write(box: VideoMediaHeaderBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUint(box.graphicsmode, 2)
		view.writeArray(box.opcolor, UINT, 2)
	}

	graphicsmode: number
	opcolor: number[]

	constructor(version: number, flags: number, graphicsmode: number, opcolor: number[]) {
		super('vmhd', version, flags)
		this.graphicsmode = graphicsmode
		this.opcolor = opcolor
	}

	override get size(): number {
		// 2 (graphicsmode) + (opcolor.length * 2)
		return 2 + (this.opcolor.length * 2)
	}
}
