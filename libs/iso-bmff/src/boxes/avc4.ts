import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readAvc4 } from '../readers/readAvc4.ts'
import { writeAvc4 } from '../writers/writeAvc4.ts'
import type { Fields } from './types/Fields.ts'
import type { VisualSampleEntryBox } from './types/VisualSampleEntryBox.ts'

/**
 * Visual Sample Entry Box (avc4)
 *
 * @public
 */
export class avc4 implements Fields<VisualSampleEntryBox<'avc4'>> {
	/**
	 * Write a VisualSampleEntryBox (avc4) to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<VisualSampleEntryBox<'avc4'>>): IsoBoxWriteView {
		return writeAvc4(fields)
	}

	/**
	 * Read a VisualSampleEntryBox (avc4) from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed VisualSampleEntryBox (avc4)
	 */
	static read(view: IsoBoxReadView): Fields<VisualSampleEntryBox<'avc4'>> {
		return readAvc4(view)
	}

	compressorName: number[]
	config: Uint8Array
	depth: number
	frameCount: number
	height: number
	horizresolution: number
	preDefined1: number
	preDefined2: number[]
	preDefined3: number
	reserved1: number[]
	reserved2: number
	reserved3: number
	vertresolution: number
	width: number
	dataReferenceIndex: number

	/**
	 * Create a new VisualSampleEntryBox (avc4).
	 *
	 * @param dataReferenceIndex - The dataReferenceIndex
	 * @param compressorName - The compressorName
	 * @param config - The config
	 * @param depth - The depth
	 * @param frameCount - The frameCount
	 * @param height - The height
	 * @param horizresolution - The horizresolution
	 * @param preDefined1 - The preDefined1
	 * @param preDefined2 - The preDefined2
	 * @param preDefined3 - The preDefined3
	 * @param reserved1 - The reserved1
	 * @param reserved2 - The reserved2
	 * @param reserved3 - The reserved3
	 * @param vertresolution - The vertresolution
	 * @param width - The width
	 */
	constructor(dataReferenceIndex: number, compressorName: number[], config: Uint8Array, depth: number, frameCount: number, height: number, horizresolution: number, preDefined1: number, preDefined2: number[], preDefined3: number, reserved1: number[], reserved2: number, reserved3: number, vertresolution: number, width: number) {
		this.dataReferenceIndex = dataReferenceIndex
		this.compressorName = compressorName
		this.config = config
		this.depth = depth
		this.frameCount = frameCount
		this.height = height
		this.horizresolution = horizresolution
		this.preDefined1 = preDefined1
		this.preDefined2 = preDefined2
		this.preDefined3 = preDefined3
		this.reserved1 = reserved1
		this.reserved2 = reserved2
		this.reserved3 = reserved3
		this.vertresolution = vertresolution
		this.width = width
	}
}
