import { DecodedId3Frame } from './DecodedId3Frame.js';
import { Id3Frame } from './Id3Frame.js';
import { getId3Frames } from './getId3Frames.js';
import { isId3TimeStampFrame } from './isId3TimeStamp.js';
import { readId3TimeStamp } from './readId3TimeStamp.js';

/**
 * Searches for the Elementary Stream timestamp found in the ID3 data chunk
 * 
 * @param data - Block of data containing one or more ID3 tags
 * 
 * @returns The timestamp
 */
export const getId3TimeStamp = (data: Uint8Array): number | undefined => {
	const frames: Id3Frame[] = getId3Frames(data);

	for (let i = 0; i < frames.length; i++) {
		const frame = frames[i];

		if (isId3TimeStampFrame(frame)) {
			return readId3TimeStamp(frame as DecodedId3Frame<ArrayBuffer>);
		}
	}

	return undefined;
};
