import { encodeText } from '@svta/cml-utils'
import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:202x - 8.10.5 Label box
 */
export class LabelBox extends FullBox {
	static readonly type = 'labl'

	/**
	 * Reads a LabelBox from an IsoView
	 *
	 * ISO/IEC 14496-12:202x - 8.10.5 Label box
	 */
	static read(view: IsoView): LabelBox {
		const { version, flags } = view.readFullBox()
		const isGroupLabel = (flags & 0x1) !== 0
		const labelId = view.readUint(2)
		const language = view.readUtf8(-1)
		const label = view.readUtf8(-1)
		return new LabelBox(version, flags, isGroupLabel, labelId, language, label)
	}

	/**
	 * Writes a LabelBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:202x - 8.10.5 Label box
	 */
	static write(box: LabelBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUint(box.isGroupLabel ? 1 : 0, 1)
		view.writeUint(box.labelId, 4)
		view.writeUtf8TerminatedString(box.language)
		view.writeUtf8TerminatedString(box.label)
	}

	isGroupLabel: boolean
	labelId: number
	language: string
	label: string

	constructor(version: number, flags: number, isGroupLabel: boolean, labelId: number, language: string, label: string) {
		super('labl', version, flags)
		this.isGroupLabel = isGroupLabel
		this.labelId = labelId
		this.language = language
		this.label = label
	}

	override get size(): number {
		const languageBytes = encodeText(this.language)
		const labelBytes = encodeText(this.label)
		// 8 (box header) + 4 (FullBox) + 1 + 4 + languageBytes.length + 1 + labelBytes.length + 1
		return 19 + languageBytes.length + labelBytes.length
	}
}
