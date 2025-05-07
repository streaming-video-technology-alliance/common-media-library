import type { Id3Frame } from '@svta/common-media-library/id3/Id3Frame';
import { decodeId3TextFrame } from '@svta/common-media-library/id3/util/decodeId3TextFrame';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';

describe('decodeId3TextFrame', () => {
	it('should decode a TXXX frame', () => {
		const frame = {
			type: 'TXXX',
			data: new Uint8Array([0, 102, 111, 111, 0, 97, 98, 99]),
			size: 2, // required by the decodeTextFrame function
		};

		const testables = {
			decodeId3TextFrame: decodeId3TextFrame,
		};

		const result: Id3Frame | undefined = testables.decodeId3TextFrame(frame);
		equal(result!.key, 'TXXX');
		equal(result!.info, 'foo');
		equal(result!.data, 'abc');
	});
});
