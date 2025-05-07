import type { RawId3Frame } from './RawFrame.ts';
import { readId3Size } from './readId3Size.ts';

/**
 * Returns the data of an ID3 frame.
 *
 * @param data - The data to read from
 *
 * @returns The data of the ID3 frame
 *
 * @internal
 *
 * @group ID3
 */
export function getId3FrameData(data: Uint8Array): RawId3Frame {
	/*
	Frame ID       $xx xx xx xx (four characters)
	Size           $xx xx xx xx
	Flags          $xx xx
	*/
	const type: string = String.fromCharCode(data[0], data[1], data[2], data[3]);
	const size: number = readId3Size(data, 4);

	// skip frame id, size, and flags
	const offset = 10;

	return { type, size, data: data.subarray(offset, offset + size) };
}
