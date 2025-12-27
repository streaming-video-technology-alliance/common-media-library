import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readMp4a } from '../readers/readMp4a.ts'
import { writeMp4a } from '../writers/writeMp4a.ts'
import type { AudioSampleEntryBox } from './types/AudioSampleEntryBox.ts'
import type { Fields } from './types/Fields.ts'

/**
 * Audio Sample Entry Box (mp4a)
 *
 * @public
 */
export class mp4a implements Fields<AudioSampleEntryBox<'mp4a'>> {
	/**
	 * Write a AudioSampleEntryBox (mp4a) to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<AudioSampleEntryBox<'mp4a'>>): IsoBoxWriteView {
		return writeMp4a(fields)
	}

	/**
	 * Read a AudioSampleEntryBox (mp4a) from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed AudioSampleEntryBox (mp4a)
	 */
	static read(view: IsoBoxReadView): Fields<AudioSampleEntryBox<'mp4a'>> {
		return readMp4a(view)
	}

	reserved2: number[]
	channelcount: number
	samplesize: number
	preDefined: number
	reserved3: number
	samplerate: number
	esds: Uint8Array
	reserved1: number[]
	dataReferenceIndex: number

	/**
	 * Create a new AudioSampleEntryBox (mp4a).
	 *
	 * @param channelcount - The channelcount
	 * @param esds - The esds
	 * @param preDefined - The preDefined
	 * @param reserved2 - The reserved2
	 * @param reserved3 - The reserved3
	 * @param samplerate - The samplerate
	 * @param samplesize - The samplesize
	 */
	constructor(channelcount: number, esds: Uint8Array, preDefined: number, reserved1: number[], dataReferenceIndex: number, reserved2: number[], reserved3: number, samplerate: number, samplesize: number) {
		this.reserved1 = reserved1
		this.dataReferenceIndex = dataReferenceIndex
		this.channelcount = channelcount
		this.esds = esds
		this.preDefined = preDefined
		this.reserved2 = reserved2
		this.reserved3 = reserved3
		this.samplerate = samplerate
		this.samplesize = samplesize
	}
}
