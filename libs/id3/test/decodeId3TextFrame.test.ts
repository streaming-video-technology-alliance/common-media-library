import type { Id3Frame } from '@svta/cml-id3';
import { decodeId3TextFrame } from '@svta/cml-id3';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';

describe('decodeId3TextFrame', () => {
	it('should decode a TXXX frame', () => {
		const frame = {
			type: 'TXXX',
			data: new Uint8Array([0, 102, 111, 111, 0, 97, 98, 99]),
			size: 2, // required by the decodeTextFrame function
		};

		const result: Id3Frame | undefined = decodeId3TextFrame(frame);

		equal(result!.key, 'TXXX');
		equal(result!.info, 'foo');
		equal(result!.data, 'abc');
	});
});
