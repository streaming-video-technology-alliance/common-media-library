import { describe, it } from 'node:test';
import { equal } from 'node:assert';
import {
	_formatSegments,
	getByterange,
	getCodec,
	getDuration,
} from '../ham/mapper/hls/utilsHlsToHam.js';

describe('getByterange', () => {
	it('returns byterange in hsl format if byterange exists', () => {
		const res = getByterange({ length: 123, offset: 456 });
		equal(res, '123@456');
	});

	it('returns undefined if byterange does not exist', () => {
		const res = getByterange(undefined);
		equal(res, undefined);
	});
});

describe('getCodec', () => {
	it('returns audio codec when type is audio', () => {
		const res = getCodec('audio');
		equal(res, 'mp4a.40.2');
	});

	it('returns empty string when type is text', () => {
		const res = getCodec('text');
		equal(res, '');
	});

	it('returns video codec when type is video', () => {
		const res = getCodec('video', 'videoCodec,otherCodec,anotherCodec');
		equal(res, 'videoCodec');
	});
	it('returns empty string when type is video and codecs is empty', () => {
		const res = getCodec('video', '');
		equal(res, '');
	});
});

// TODO: complete test
describe.skip('getDuration', () => {
	it('returns duration', () => {
		const res = getDuration({}, []);
		equal(res, 0);
	});
});

// TODO: complete test
describe.skip('_formatSegments', () => {
	it('returns segments formated', () => {
		const res = _formatSegments([]);
		equal(res, []);
	});
});
