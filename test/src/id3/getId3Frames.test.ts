import { getId3Frames } from '@svta.org/common-media-library';
import { deepEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { DATA, DATA_BYTES, DATA_UINT8 } from './data/DATA.js';
import { INFO, INFO_BYTES } from './data/INFO.js';
import { createId3 } from './data/createId3.js';

describe('getId3Frames', () => {
	it('parses PRIV frames', () => {
		const id3 = createId3('PRIV', new Uint8Array([...INFO_BYTES, 0x00, ...DATA_BYTES]));
		deepEqual(getId3Frames(id3), [{
			key: 'PRIV',
			info: INFO,
			data: DATA_UINT8.buffer,
		}]);
	});

	it('parses TXXX frames', () => {
		const id3 = createId3('TXXX', new Uint8Array([0x03, ...INFO_BYTES, 0x00, ...DATA_BYTES]));
		deepEqual(getId3Frames(id3), [{
			key: 'TXXX',
			info: INFO,
			data: DATA,
		}]);
	});

	it('parses WXXX frames', () => {
		const id3 = createId3('WXXX', new Uint8Array([0x03, ...INFO_BYTES, 0x00, ...DATA_BYTES]));
		deepEqual(getId3Frames(id3), [{
			key: 'WXXX',
			info: INFO,
			data: DATA,
		}]);
	});

	it('parses TCOP frames', () => {
		const id3 = createId3('TCOP', new Uint8Array([0x03, ...INFO_BYTES]));
		deepEqual(getId3Frames(id3), [{
			key: 'TCOP',
			info: '',
			data: INFO,
		}]);
	});

	it('parses WCOP frames', () => {
		const id3 = createId3('WCOP', new Uint8Array([...INFO_BYTES]));
		deepEqual(getId3Frames(id3), [{
			key: 'WCOP',
			info: '',
			data: INFO,
		}]);
	});
});
