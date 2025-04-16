import { utf8ArrayToStr } from '../../utils/utf8ArrayToStr.ts';
import type { DecodedId3Frame } from '../DecodedId3Frame.ts';
import type { RawId3Frame } from './RawFrame.ts';

/**
 * Decode a URL frame
 *
 * @param frame - the ID3 URL frame
 *
 * @returns The decoded ID3 URL frame
 *
 * @internal
 *
 * @group ID3
 */
export function decodeId3UrlFrame(frame: RawId3Frame): DecodedId3Frame<string> | undefined {
	if (frame.type === 'WXXX') {
		/*
		Format:
		[0]   = {Text Encoding}
		[1-?] = {Description}\0{URL}
		*/
		if (frame.size < 2) {
			return undefined;
		}

		let index = 1;
		const description: string = utf8ArrayToStr(
			frame.data.subarray(index),
			true,
		);

		index += description.length + 1;
		const value: string = utf8ArrayToStr(frame.data.subarray(index));

		return { key: frame.type, info: description, data: value };
	}
	/*
	Format:
	[0-?] = {URL}
	*/
	const url: string = utf8ArrayToStr(frame.data);
	return { key: frame.type, info: '', data: url };
}
