import type { Id3Frame } from './Id3Frame.ts'
import { getId3Frames } from './getId3Frames.ts'
import { isId3TimestampFrame } from './isId3TimestampFrame.ts'
import { readId3Timestamp } from './util/readId3Timestamp.ts'

/**
 * Searches for the Elementary Stream timestamp found in the ID3 data chunk
 *
 * @param data - Block of data containing one or more ID3 tags
 *
 * @returns The timestamp
 *
 * @public
 */
export function getId3Timestamp(data: Uint8Array): number | undefined {
	const frames: Id3Frame[] = getId3Frames(data)

	for (const frame of frames) {
		if (isId3TimestampFrame(frame)) {
			return readId3Timestamp(frame)
		}
	}

	return undefined
}
