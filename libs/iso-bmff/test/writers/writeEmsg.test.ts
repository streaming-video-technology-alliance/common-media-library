import { assert, describe, it, readEmsg, readIsoBoxes, writeEmsg } from '../util/box.ts'

describe('writeEmsg', function () {
	it('should write a version 1 EventMessageBox that can be read back correctly', function () {
		const box = {
			type: 'emsg' as const,
			version: 1,
			flags: 0,
			timescale: 90000,
			presentationTime: 900000,
			eventDuration: 0,
			id: 1,
			schemeIdUri: 'urn:test:scheme',
			value: '1',
			messageData: new Uint8Array([0x49, 0x44, 0x33, 0x04, 0x00, 0x01])
		}

		const writer = writeEmsg(box)
		const boxes = readIsoBoxes(writer.buffer, { readers: { emsg: readEmsg } })

		assert.strictEqual(boxes.length, 1)
		assert.strictEqual(boxes[0].schemeIdUri, 'urn:test:scheme')
		assert.strictEqual(boxes[0].value, '1')
		assert.strictEqual(boxes[0].timescale, 90000)
		assert.strictEqual(boxes[0].presentationTime, 900000)
		assert.deepEqual(new Uint8Array(boxes[0].messageData), box.messageData)
	})

	it('should encode an empty value as a lone null terminator', function () {
		const box = {
			type: 'emsg' as const,
			version: 1,
			flags: 0,
			timescale: 1,
			presentationTime: 0,
			eventDuration: 0,
			id: 0,
			schemeIdUri: 'a',
			value: '',
			messageData: new Uint8Array([0xff])
		}

		const writer = writeEmsg(box)
		const buffer = new Uint8Array(writer.buffer)

		assert.strictEqual(Buffer.compare(buffer, new Uint8Array([
			0x00, 0x00, 0x00, 0x24, // size
			0x65, 0x6d, 0x73, 0x67, // type
			0x01, 0x00, 0x00, 0x00, // version + flags
			0x00, 0x00, 0x00, 0x01, // timescale
			0x00, 0x00, 0x00, 0x00, // presentationTime (hi)
			0x00, 0x00, 0x00, 0x00, // presentationTime (lo)
			0x00, 0x00, 0x00, 0x00, // eventDuration
			0x00, 0x00, 0x00, 0x00, // id
			0x61, 0x00,             // schemeIdUri 'a' + terminator
			0x00,                   // value '' + terminator
			0xff,                   // messageData
		])), 0)
	})

	it('should preserve messageData through a version 1 round trip when value is empty', function () {
		const messageData = new Uint8Array([0x49, 0x44, 0x33, 0x04, 0x00, 0x00, 0x00, 0x01])
		const box = {
			type: 'emsg' as const,
			version: 1,
			flags: 0,
			timescale: 90000,
			presentationTime: 900000,
			eventDuration: 0,
			id: 1,
			schemeIdUri: 'https://aomedia.org/emsg/ID3',
			value: '',
			messageData
		}

		const writer = writeEmsg(box)
		const boxes = readIsoBoxes(writer.buffer, { readers: { emsg: readEmsg } })

		assert.strictEqual(boxes.length, 1)
		assert.strictEqual(boxes[0].value, '')
		assert.deepEqual(new Uint8Array(boxes[0].messageData), messageData)
	})

	it('should preserve the fixed fields through a version 0 round trip when the strings are empty', function () {
		const messageData = new Uint8Array([0x01, 0x02, 0x03])
		const box = {
			type: 'emsg' as const,
			version: 0,
			flags: 0,
			timescale: 48000,
			presentationTimeDelta: 96000,
			eventDuration: 5,
			id: 7,
			schemeIdUri: '',
			value: '',
			messageData
		}

		const writer = writeEmsg(box)
		const boxes = readIsoBoxes(writer.buffer, { readers: { emsg: readEmsg } })

		assert.strictEqual(boxes.length, 1)
		assert.strictEqual(boxes[0].schemeIdUri, '')
		assert.strictEqual(boxes[0].value, '')
		assert.strictEqual(boxes[0].timescale, 48000)
		assert.strictEqual(boxes[0].presentationTimeDelta, 96000)
		assert.strictEqual(boxes[0].eventDuration, 5)
		assert.strictEqual(boxes[0].id, 7)
		assert.deepEqual(new Uint8Array(boxes[0].messageData), messageData)
	})
})
