import { getId3Frames } from '@svta/common-media-library';
import { deepEqual, deepStrictEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { DATA, DATA_BYTES, DATA_UINT8 } from './data/DATA.js';
import { INFO, INFO_BYTES } from './data/INFO.js';
import { createId3 } from './data/createId3.js';
import {
	generateId3,
	generateId3Frame,
} from '../utils/id3/util/id3Generator.js';
import { toArrayBuffer } from '../../src/id3/util/toArrayBuffer.js';

describe('getId3Frames', () => {
	it('no valid data produces empty output', () => {
		deepStrictEqual(getId3Frames(new Uint8Array([])), []);
	});

	it('parse an APIC frame with image data', () => {
		const apicValue = new Uint8Array([
			3, 105, 109, 97, 103, 101, 47, 106, 112, 101, 103, 0, 3, 83, 104, 97, 107,
			97, 0, 1, 2, 3,
		]);
		const apicFrame = generateId3Frame('APIC', apicValue);
		const apicID3 = generateId3(apicFrame);
		const expectedID3 = [
			{
				key: 'APIC',
				mimeType: 'image/jpeg',
				pictureType: 3,
				description: 'Shaka',
				data: toArrayBuffer(new Uint8Array([1, 2, 3])),
			},
		];
		deepStrictEqual(getId3Frames(apicID3), expectedID3);
	});

	it('parse an APIC frame with image URL', () => {
		const apicValue = new Uint8Array([
			3, 45, 45, 62, 0, 3, 83, 104, 97, 107, 97, 0, 103, 111, 111, 103, 108,
			101, 46, 99, 111, 109,
		]);
		const apicFrame = generateId3Frame('APIC', apicValue);
		const apicID3 = generateId3(apicFrame);
		const expectedID3 = [
			{
				key: 'APIC',
				mimeType: '-->',
				pictureType: 3,
				description: 'Shaka',
				data: 'google.com',
			},
		];
		deepStrictEqual(getId3Frames(apicID3), expectedID3);
	});

	it('parses PRIV frames', () => {
		const id3 = createId3(
			'PRIV',
			new Uint8Array([...INFO_BYTES, 0x00, ...DATA_BYTES]),
		);
		deepEqual(getId3Frames(id3), [
			{
				key: 'PRIV',
				info: INFO,
				data: DATA_UINT8.buffer,
			},
		]);
	});

	it('parses TXXX frames', () => {
		const id3 = createId3(
			'TXXX',
			new Uint8Array([0x03, ...INFO_BYTES, 0x00, ...DATA_BYTES]),
		);
		deepEqual(getId3Frames(id3), [
			{
				key: 'TXXX',
				info: INFO,
				data: DATA,
			},
		]);
	});

	it('parses WXXX frames', () => {
		const id3 = createId3(
			'WXXX',
			new Uint8Array([0x03, ...INFO_BYTES, 0x00, ...DATA_BYTES]),
		);
		deepEqual(getId3Frames(id3), [
			{
				key: 'WXXX',
				info: INFO,
				data: DATA,
			},
		]);
	});

	it('parses TCOP frames', () => {
		const id3 = createId3('TCOP', new Uint8Array([0x03, ...INFO_BYTES]));
		deepEqual(getId3Frames(id3), [
			{
				key: 'TCOP',
				info: '',
				data: INFO,
			},
		]);
	});

	it('parses WCOP frames', () => {
		const id3 = createId3('WCOP', new Uint8Array([...INFO_BYTES]));
		deepEqual(getId3Frames(id3), [
			{
				key: 'WCOP',
				info: '',
				data: INFO,
			},
		]);
	});
});
