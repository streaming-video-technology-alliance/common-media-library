import { encodeText } from '@svta/cml-utils'
import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:202x - 8.10.4 Track kind box
 */
export class TrackKindBox extends FullBox {
	static readonly type = 'kind'

	/**
	 * Reads a TrackKindBox from an IsoView
	 *
	 * ISO/IEC 14496-12:202x - 8.10.4 Track kind box
	 */
	static read(view: IsoView): TrackKindBox {
		const { version, flags } = view.readFullBox()
		const schemeUri = view.readUtf8(-1)
		const value = view.readUtf8(-1)
		return new TrackKindBox(version, flags, schemeUri, value)
	}

	/**
	 * Writes a TrackKindBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:202x - 8.10.4 Track kind box
	 */
	static write(box: TrackKindBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUtf8TerminatedString(box.schemeUri)
		view.writeUtf8TerminatedString(box.value)
	}

	schemeUri: string
	value: string

	constructor(version: number, flags: number, schemeUri: string, value: string) {
		super('kind', version, flags)
		this.schemeUri = schemeUri
		this.value = value
	}

	override get size(): number {
		const schemeUriBytes = encodeText(this.schemeUri)
		const valueBytes = encodeText(this.value)
		// 8 (box header) + 4 (FullBox) + schemeUriBytes.length + 1 + valueBytes.length + 1
		return 14 + schemeUriBytes.length + valueBytes.length
	}
}
