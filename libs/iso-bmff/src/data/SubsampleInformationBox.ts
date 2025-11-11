import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2015 - 8.7.7 Sub-Sample Information Box
 */
export type Subsample = {
	subsampleSize: number
	subsamplePriority: number
	discardable: number
	codecSpecificParameters: number
}

export type SubsampleEntry = {
	sampleDelta: number
	subsampleCount: number
	subsamples: Subsample[]
}

export class SubsampleInformationBox extends FullBox {
	static readonly type = 'subs'

	/**
	 * Reads a SubsampleInformationBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2015 - 8.7.7 Sub-Sample Information Box
	 */
	static read(view: IsoView): SubsampleInformationBox {
		const { version, flags } = view.readFullBox()
		const entryCount = view.readUint(4)
		const entries = view.readEntries(entryCount, () => {
			const sampleDelta = view.readUint(4)
			const subsampleCount = view.readUint(2)
			const subsamples = view.readEntries(subsampleCount, () => ({
				subsampleSize: view.readUint(version === 1 ? 4 : 2),
				subsamplePriority: view.readUint(1),
				discardable: view.readUint(1),
				codecSpecificParameters: view.readUint(4),
			}))
			return {
				sampleDelta,
				subsampleCount,
				subsamples,
			}
		})
		return new SubsampleInformationBox(version, flags, entryCount, entries)
	}

	/**
	 * Writes a SubsampleInformationBox to a DataView
	 *
	 * ISO/IEC 14496-12:2015 - 8.7.7 Sub-Sample Information Box
	 */
	static write(box: SubsampleInformationBox, dataView: DataView, offset: number = 0): number {
		const bufferOffset = dataView.byteOffset + offset
		let cursor = bufferOffset

		// Write box header
		writeUint(dataView, cursor, 4, box.size)
		cursor += 4
		writeString(dataView, cursor, 4, box.type)
		cursor += 4

		// Write FullBox header
		writeFullBoxHeader(box, dataView, cursor)
		cursor += 4

		// Write entryCount (4 bytes)
		writeUint(dataView, cursor, 4, box.entryCount)
		cursor += 4

		// Write entries
		const subsampleSizeBytes = box.version === 1 ? 4 : 2
		for (const entry of box.entries) {
			writeUint(dataView, cursor, 4, entry.sampleDelta)
			cursor += 4
			writeUint(dataView, cursor, 2, entry.subsampleCount)
			cursor += 2

			for (const subsample of entry.subsamples) {
				writeUint(dataView, cursor, subsampleSizeBytes, subsample.subsampleSize)
				cursor += subsampleSizeBytes
				writeUint(dataView, cursor, 1, subsample.subsamplePriority)
				cursor += 1
				writeUint(dataView, cursor, 1, subsample.discardable)
				cursor += 1
				writeUint(dataView, cursor, 4, subsample.codecSpecificParameters)
				cursor += 4
			}
		}

		return cursor - bufferOffset
	}

	entryCount: number
	entries: SubsampleEntry[]

	constructor(version: number, flags: number, entryCount: number, entries: SubsampleEntry[] = []) {
		super('subs', version, flags)
		this.entryCount = entryCount
		this.entries = entries
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (entryCount) + sum of entry sizes
		let size = 16

		for (const entry of this.entries) {
			size += 4 + 2 // sampleDelta + subsampleCount
			size += entry.subsamples.length * 4 // each subsample: 2 + 1 + 1 = 4 bytes
		}

		return size
	}
}
