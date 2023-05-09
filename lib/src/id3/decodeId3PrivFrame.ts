import { utf8ArrayToStr } from '../utils/utf8ArrayToStr.js';
import { DecodedId3Frame } from './DecodedId3Frame.js';
import { RawId3Frame } from './RawFrame.js';

/**
 * Decode an ID3 PRIV frame.
 * 
 * @param frame - the ID3 PRIV frame
 * 
 * @returns The decoded ID3 PRIV frame
 * 
 * @internal
 * 
 * @group ID3
 */
export function decodeId3PrivFrame(
	frame: RawId3Frame,
): DecodedId3Frame<ArrayBuffer> | undefined {
	/*
	Format: <text string>\0<binary data>
	*/
	if (frame.size < 2) {
		return undefined;
	}

	const owner = utf8ArrayToStr(frame.data, true);
	const privateData = new Uint8Array(frame.data.subarray(owner.length + 1));

	return { key: frame.type, info: owner, data: privateData.buffer };
}
