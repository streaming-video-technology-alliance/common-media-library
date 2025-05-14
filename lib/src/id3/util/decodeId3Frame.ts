import type { Id3Frame } from '../Id3Frame';
import type { RawId3Frame } from './RawFrame';
import { decodeId3ImageFrame } from './decodeId3ImageFrame.ts';
import { decodeId3PrivFrame } from './decodeId3PrivFrame.ts';
import { decodeId3TextFrame } from './decodeId3TextFrame.ts';
import { decodeId3UrlFrame } from './decodeId3UrlFrame.ts';

/**
 * Decode an ID3 frame.
 *
 * @param frame - the ID3 frame
 *
 * @returns The decoded ID3 frame
 *
 * @internal
 *
 * @group ID3
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
