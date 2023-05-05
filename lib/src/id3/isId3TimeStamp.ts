import { Id3Frame } from './Id3Frame';

/**
 * Returns true if the ID3 frame is an Elementary Stream timestamp frame
 * 
 * @param frame - the ID3 frame
 * 
 * @returns True if the ID3 frame is an Elementary Stream timestamp frame
 */
export const isId3TimeStampFrame = (frame: Id3Frame): boolean => {
	return (
		frame &&
		frame.key === 'PRIV' &&
		frame.info === 'com.apple.streaming.transportStreamTimestamp'
	);
};
