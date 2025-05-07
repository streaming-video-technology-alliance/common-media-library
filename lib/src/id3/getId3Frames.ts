import type { Id3Frame } from './Id3Frame.ts';
import type { RawId3Frame } from './util/RawFrame.ts';
import { decodeId3Frame } from './util/decodeId3Frame.ts';
import { getId3FrameData } from './util/getId3FrameData.ts';
import { isId3Footer } from './util/isId3Footer.ts';
import { isId3Header } from './util/isId3Header.ts';
import { readId3Size } from './util/readId3Size.ts';

const HEADER_FOOTER_SIZE = 10;
const FRAME_SIZE = 10;

/**
 * Returns an array of ID3 frames found in all the ID3 tags in the id3Data
 *
 * @param id3Data - The ID3 data containing one or more ID3 tags
 *
 * @returns Array of ID3 frame objects
 *
 * @group ID3
 *
 * @beta
 */
export function getId3Frames(id3Data: Uint8Array): Id3Frame[] {
	let offset = 0;
	const frames: Id3Frame[] = [];

	while (isId3Header(id3Data, offset)) {
		const size = readId3Size(id3Data, offset + 6);

		if ((id3Data[offset + 5] >> 6) & 1) {
			// skip extended header
			offset += HEADER_FOOTER_SIZE;
		}
		// skip past ID3 header
		offset += HEADER_FOOTER_SIZE;
		const end = offset + size;
		// loop through frames in the ID3 tag
		while (offset + FRAME_SIZE < end) {
			const frameData: RawId3Frame = getId3FrameData(id3Data.subarray(offset));
			const frame: Id3Frame | undefined = decodeId3Frame(frameData);
			if (frame) {
				frames.push(frame);
			}

			// skip frame header and frame data
			offset += frameData.size + HEADER_FOOTER_SIZE;
		}

		if (isId3Footer(id3Data, offset)) {
			offset += HEADER_FOOTER_SIZE;
		}
	}

	return frames;
}
