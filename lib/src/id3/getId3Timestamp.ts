import type { DecodedId3Frame } from './DecodedId3Frame.js';
import type { Id3Frame } from './Id3Frame.js';
import { getId3Frames } from './getId3Frames.js';
import { isId3TimestampFrame } from './isId3TimestampFrame.js';
import { readId3Timestamp } from './util/readId3Timestamp.js';

/**
 * Searches for the Elementary Stream timestamp found in the ID3 data chunk
 *
 * @param data - Block of data containing one or more ID3 tags
 *
 * @returns The timestamp
 *
 * @group ID3
 *
 * @beta
 */
export function getId3Timestamp(data: Uint8Array<ArrayBuffer>): number | undefined {
	const frames: Id3Frame[] = getId3Frames(data);

	for (let i = 0; i < frames.length; i++) {
		const frame = frames[i];

		if (isId3TimestampFrame(frame)) {
			return readId3Timestamp(frame as DecodedId3Frame<ArrayBuffer>);
		}
	}

	return undefined;
}
