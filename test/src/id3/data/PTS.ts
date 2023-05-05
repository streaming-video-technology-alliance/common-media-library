import { getId3Frames } from '@svta.org/common-media-library';
import { strToCodes } from '../../util/strToCodes.js';
import { createId3 } from './createId3.js';

export const PTS = createId3('PRIV', new Uint8Array([
	...strToCodes('com.apple.streaming.transportStreamTimestamp'), 
	0x00, 

	// TODO: Get a valid, non-zero, timestamp
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
]));

export const PTS_FRAME = getId3Frames(PTS)[0];
