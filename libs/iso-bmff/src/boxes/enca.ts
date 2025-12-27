import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readEnca } from '../readers/readEnca.ts'
import { writeEnca } from '../writers/writeEnca.ts'
import type { AudioSampleEntryBox } from './types/AudioSampleEntryBox.ts'
import type { Fields } from './types/Fields.ts'

/**
 * Audio Sample Entry Box (enca)
 *
 * @public
 */
export class enca implements Fields<AudioSampleEntryBox<'enca'>> {
	/**
	 * Write a AudioSampleEntryBox (enca) to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<AudioSampleEntryBox<'enca'>>): IsoBoxWriteView {
		return writeEnca(fields)
	}

	/**
	 * Read a AudioSampleEntryBox (enca) from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed AudioSampleEntryBox (enca)
	 */
	static read(view: IsoBoxReadView): Fields<AudioSampleEntryBox<'enca'>> {
		return readEnca(view)
	}

	reserved1: number[]
	dataReferenceIndex: number
	reserved2: number[]
	channelcount: number
	samplesize: number
	preDefined: number
	reserved3: number
	samplerate: number
	esds: Uint8Array

	/**
	 * Create a new AudioSampleEntryBox (enca).
	 *
	 * @param reserved1 - The reserved1
	 * @param dataReferenceIndex - The dataReferenceIndex
	 * @param channelcount - The channelcount
	 * @param esds - The esds
	 * @param preDefined - The preDefined
	 * @param reserved2 - The reserved2
	 * @param reserved3 - The reserved3
	 * @param samplerate - The samplerate
	 * @param samplesize - The samplesize
	 */
	constructor(reserved1: number[], dataReferenceIndex: number, channelcount: number, esds: Uint8Array, preDefined: number, reserved2: number[], reserved3: number, samplerate: number, samplesize: number) {
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
