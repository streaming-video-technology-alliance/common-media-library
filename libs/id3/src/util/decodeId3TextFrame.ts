import type { DecodedId3Frame } from '../DecodedId3Frame.ts'
import type { RawId3Frame } from './RawId3Frame.ts'
import { utf8ArrayToStr } from './utf8ArrayToStr.ts'

/**
 * Decodes an ID3 text frame
 *
 * @param frame - the ID3 text frame
 *
 * @returns The decoded ID3 text frame
 *
 * @internal
 */
export function decodeId3TextFrame(frame: RawId3Frame): DecodedId3Frame<string> | undefined {
	if (frame.size < 2) {
		return undefined
	}

	if (frame.type === 'TXXX') {
		/*
		Format:
		[0]   = {Text Encoding}
		[1-?] = {Description}\0{Value}
		*/
		let index = 1
		const { data } = frame
		const description = utf8ArrayToStr(data.subarray(index), true)

		index += description.length + 1
		const value = utf8ArrayToStr(data.subarray(index))

		return { key: frame.type, info: description, data: value }
	}
	/*
	Format:
	[0]   = {Text Encoding}
	[1-?] = {Value}
	*/
	const text = utf8ArrayToStr(frame.data.subarray(1))
	return { key: frame.type, info: '', data: text }
}
