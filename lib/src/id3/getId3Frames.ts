import { Id3Frame } from './Id3Frame.js';
import { RawId3Frame } from './util/RawFrame.js';
import { decodeId3Frame } from './util/decodeId3Frame.js';
import { getId3FrameData } from './util/getId3FrameData.js';
import { isId3Footer } from './util/isId3Footer.js';
import { isId3Header } from './util/isId3Header.js';
import { readId3Size } from './util/readId3Size.js';

/**
 * Returns an array of ID3 frames found in all the ID3 tags in the id3Data
 * 
 * @param id3Data - The ID3 data containing one or more ID3 tags
 * 
 * @returns Array of ID3 frame objects
 * 
 * @group ID3
 */
export function getId3Frames(id3Data: Uint8Array): Id3Frame[] {
	let offset = 0;
	const frames: Id3Frame[] = [];

	while (isId3Header(id3Data, offset)) {
		const size = readId3Size(id3Data, offset + 6);
		// skip past ID3 header
		offset += 10;
		const end = offset + size;
		// loop through frames in the ID3 tag
		while (offset + 8 < end) {
			const frameData: RawId3Frame = getId3FrameData(id3Data.subarray(offset));
			const frame: Id3Frame | undefined = decodeId3Frame(frameData);
			if (frame) {
				frames.push(frame);
			}

			// skip frame header and frame data
			offset += frameData.size + 10;
		}

		if (isId3Footer(id3Data, offset)) {
			offset += 10;
		}
	}

	return frames;
}
