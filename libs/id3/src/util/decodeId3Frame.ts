import type { Id3Frame } from '../Id3Frame.js';
import type { RawId3Frame } from './RawFrame.js';
import { decodeId3ImageFrame } from './decodeId3ImageFrame.js';
import { decodeId3PrivFrame } from './decodeId3PrivFrame.js';
import { decodeId3TextFrame } from './decodeId3TextFrame.js';
import { decodeId3UrlFrame } from './decodeId3UrlFrame.js';

/**
 * Decode an ID3 frame.
 *
 * @param frame - the ID3 frame
 *
 * @returns The decoded ID3 frame
 *
 * @internal
 *
 */
export function decodeId3Frame(frame: RawId3Frame): Id3Frame | undefined {
	if (frame.type === 'PRIV') {
		return decodeId3PrivFrame(frame);
	}
	else if (frame.type[0] === 'W') {
		return decodeId3UrlFrame(frame);
	}

	else if (frame.type === 'APIC') {
		return decodeId3ImageFrame(frame);
	}

	return decodeId3TextFrame(frame);
}
