import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

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
	 * Writes a SubsampleInformationBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2015 - 8.7.7 Sub-Sample Information Box
	 */
	static write(box: SubsampleInformationBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUint(box.entryCount, 4)
		const subsampleSizeBytes = box.version === 1 ? 4 : 2
		for (const entry of box.entries) {
			view.writeUint(entry.sampleDelta, 4)
			view.writeUint(entry.subsampleCount, 2)
			for (const subsample of entry.subsamples) {
				view.writeUint(subsample.subsampleSize, subsampleSizeBytes)
				view.writeUint(subsample.subsamplePriority, 1)
				view.writeUint(subsample.discardable, 1)
				view.writeUint(subsample.codecSpecificParameters, 4)
			}
		}
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
