import { getId3Frames, type Id3Frame } from '@svta/common-media-library';
import { strToCodes } from '../../utils/strToCodes.ts';
import { createId3 } from './createId3.ts';

export const PTS: Uint8Array = createId3('PRIV', new Uint8Array([
	...strToCodes('com.apple.streaming.transportStreamTimestamp'),
	0x00,

	// TODO: Get a valid, non-zero, timestamp
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
]));

export const PTS_FRAME: Id3Frame = getId3Frames(PTS)[0];
