import { encodeText } from '@svta/cml-utils'
import type { TrackKindBox } from '../boxes/TrackKindBox.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBoxBase } from './FullBoxBase.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:202x - 8.10.4 Track kind box
 */
export class kind extends FullBoxBase<TrackKindBox> {
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
		return new kind(schemeUri, value, version, flags)
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

	constructor(schemeUri: string, value: string, version?: number, flags?: number) {
		super('kind', version, flags)
		this.schemeUri = schemeUri
		this.value = value
	}

	override get size(): number {
		const schemeUriBytes = encodeText(this.schemeUri)
		const valueBytes = encodeText(this.value)
		// schemeUriBytes.length + 1 + valueBytes.length + 1
		return 2 + schemeUriBytes.length + valueBytes.length
	}
}
