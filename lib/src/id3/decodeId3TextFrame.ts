import { utf8ArrayToStr } from '../utils/utf8ArrayToStr.js';
import { DecodedId3Frame } from './DecodedId3Frame.js';
import { RawId3Frame } from './RawFrame.js';

/**
 * Decodes an ID3 text frame
 * 
 * @param frame - the ID3 text frame
 * 
 * @returns The decoded ID3 text frame
 * 
 * @internal
 */
export const decodeId3TextFrame = (frame: RawId3Frame): DecodedId3Frame<string> | undefined => {
	if (frame.size < 2) {
		return undefined;
	}

	if (frame.type === 'TXXX') {
		/*
		Format:
		[0]   = {Text Encoding}
		[1-?] = {Description}\0{Value}
		*/
		let index = 1;
		const description = utf8ArrayToStr(frame.data.subarray(index), true);

		index += description.length + 1;
		const value = utf8ArrayToStr(frame.data.subarray(index));

		return { key: frame.type, info: description, data: value };
	}
	/*
	Format:
	[0]   = {Text Encoding}
	[1-?] = {Value}
	*/
	const text = utf8ArrayToStr(frame.data.subarray(1));
	return { key: frame.type, data: text };
};
