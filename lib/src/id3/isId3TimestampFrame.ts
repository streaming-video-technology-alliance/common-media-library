import { Id3Frame } from './Id3Frame';

/**
 * Returns true if the ID3 frame is an Elementary Stream timestamp frame
 *
 * @param frame - the ID3 frame
 *
 * @returns `true` if the ID3 frame is an Elementary Stream timestamp frame
 *
 * @internal
 *
 * @group ID3
 */
export function isId3TimestampFrame(frame: Id3Frame): boolean {
	return (
		frame &&
		frame.key === 'PRIV' &&
		frame.info === 'com.apple.streaming.transportStreamTimestamp'
	);
}
