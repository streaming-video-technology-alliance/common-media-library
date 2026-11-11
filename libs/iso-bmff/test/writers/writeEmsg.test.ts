import { assert, describe, it, readEmsg, readIsoBoxes, writeEmsg } from '../util/box.ts'

const SCHEME = [0x75, 0x72, 0x6e, 0x3a, 0xc3, 0xa9] // 'urn:é'
const VALUE = [0xe6, 0x97, 0xa5, 0xe6, 0x9c, 0xac] // '日本'

describe('writeEmsg', function () {
	it('should write UTF-8 strings in a version 0 box', function () {
		const writer = writeEmsg({
			type: 'emsg',
			version: 0,
			flags: 0,
			schemeIdUri: 'urn:é',
			value: '日本',
			timescale: 1000,
			presentationTimeDelta: 5,
			eventDuration: 10,
			id: 7,
			messageData: new Uint8Array([0xff]),
		})

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0x00,
				0x00,
				0x00,
				0x2b, // size
				0x65,
				0x6d,
				0x73,
				0x67, // type
				0x00,
				0x00,
				0x00,
				0x00, // version + flags
				...SCHEME,
				0x00, // schemeIdUri + terminator
				...VALUE,
				0x00, // value + terminator
				0x00,
				0x00,
				0x03,
				0xe8, // timescale
				0x00,
				0x00,
				0x00,
				0x05, // presentationTimeDelta
				0x00,
				0x00,
				0x00,
				0x0a, // eventDuration
				0x00,
				0x00,
				0x00,
				0x07, // id
				0xff, // messageData
			]),
		)
	})

	it('should write UTF-8 strings in a version 1 box', function () {
		const writer = writeEmsg({
			type: 'emsg',
			version: 1,
			flags: 0,
			timescale: 1000,
			presentationTime: 5,
			eventDuration: 10,
			id: 7,
			schemeIdUri: 'urn:é',
			value: '日本',
			messageData: new Uint8Array([0xff]),
		})

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0x00,
				0x00,
				0x00,
				0x2f, // size
				0x65,
				0x6d,
				0x73,
				0x67, // type
				0x01,
				0x00,
				0x00,
				0x00, // version + flags
				0x00,
				0x00,
				0x03,
				0xe8, // timescale
				0x00,
				0x00,
				0x00,
				0x00, // presentationTime (hi)
				0x00,
				0x00,
				0x00,
				0x05, // presentationTime (lo)
				0x00,
				0x00,
				0x00,
				0x0a, // eventDuration
				0x00,
				0x00,
				0x00,
				0x07, // id
				...SCHEME,
				0x00, // schemeIdUri + terminator
				...VALUE,
				0x00, // value + terminator
				0xff, // messageData
			]),
		)
	})

	it('should read back a version 0 box whose value has the character U+0100', function () {
		const writer = writeEmsg({
			type: 'emsg',
			version: 0,
			flags: 0,
			schemeIdUri: 'urn:a',
			value: 'AĀB',
			timescale: 1000,
			presentationTimeDelta: 5,
			eventDuration: 10,
			id: 7,
			messageData: new Uint8Array([0xff]),
		})

		const [box] = readIsoBoxes(writer.buffer, { readers: { emsg: readEmsg } })

		assert.strictEqual(box.type, 'emsg')
		assert.strictEqual(box.value, 'AĀB')
		assert.strictEqual(box.timescale, 1000)
		assert.deepStrictEqual(new Uint8Array(box.messageData), new Uint8Array([0xff]))
	})

	it('should write a version 1 EventMessageBox that can be read back correctly', function () {
		const box = {
			type: 'emsg' as const,
			version: 1 as const,
			flags: 0,
			timescale: 90000,
			presentationTime: 900000,
			eventDuration: 0,
			id: 1,
			schemeIdUri: 'urn:test:scheme',
			value: '1',
			messageData: new Uint8Array([0x49, 0x44, 0x33, 0x04, 0x00, 0x01]),
		}

		const writer = writeEmsg(box)
		const boxes = readIsoBoxes(writer.buffer, { readers: { emsg: readEmsg } })

		assert.strictEqual(boxes.length, 1)
		assert.strictEqual(boxes[0].type, 'emsg')
		assert.strictEqual(boxes[0].version, 1)
		assert.strictEqual(boxes[0].schemeIdUri, 'urn:test:scheme')
		assert.strictEqual(boxes[0].value, '1')
		assert.strictEqual(boxes[0].timescale, 90000)
		assert.strictEqual(boxes[0].presentationTime, 900000)
		assert.deepEqual(new Uint8Array(boxes[0].messageData), box.messageData)
	})

	it('should encode an empty value as a lone null terminator', function () {
		const box = {
			type: 'emsg' as const,
			version: 1 as const,
			flags: 0,
			timescale: 1,
			presentationTime: 0,
			eventDuration: 0,
			id: 0,
			schemeIdUri: 'a',
			value: '',
			messageData: new Uint8Array([0xff]),
		}

		const writer = writeEmsg(box)
		const buffer = new Uint8Array(writer.buffer)

		assert.strictEqual(
			Buffer.compare(
				buffer,
				new Uint8Array([
					0x00,
					0x00,
					0x00,
					0x24, // size
					0x65,
					0x6d,
					0x73,
					0x67, // type
					0x01,
					0x00,
					0x00,
					0x00, // version + flags
					0x00,
					0x00,
					0x00,
					0x01, // timescale
					0x00,
					0x00,
					0x00,
					0x00, // presentationTime (hi)
					0x00,
					0x00,
					0x00,
					0x00, // presentationTime (lo)
					0x00,
					0x00,
					0x00,
					0x00, // eventDuration
					0x00,
					0x00,
					0x00,
					0x00, // id
					0x61,
					0x00, // schemeIdUri 'a' + terminator
					0x00, // value '' + terminator
					0xff, // messageData
				]),
			),
			0,
		)
	})

	it('should preserve messageData through a version 1 round trip when value is empty', function () {
		const messageData = new Uint8Array([0x49, 0x44, 0x33, 0x04, 0x00, 0x00, 0x00, 0x01])
		const box = {
			type: 'emsg' as const,
			version: 1 as const,
			flags: 0,
			timescale: 90000,
			presentationTime: 900000,
			eventDuration: 0,
			id: 1,
			schemeIdUri: 'https://aomedia.org/emsg/ID3',
			value: '',
			messageData,
		}

		const writer = writeEmsg(box)
		const boxes = readIsoBoxes(writer.buffer, { readers: { emsg: readEmsg } })

		assert.strictEqual(boxes.length, 1)
		assert.strictEqual(boxes[0].type, 'emsg')
		assert.strictEqual(boxes[0].value, '')
		assert.deepEqual(new Uint8Array(boxes[0].messageData), messageData)
	})

	it('should preserve a non-empty value through a version 1 round trip when schemeIdUri is empty', function () {
		const messageData = new Uint8Array([0xaa, 0xbb])
		const box = {
			type: 'emsg' as const,
			version: 1 as const,
			flags: 0,
			timescale: 90000,
			presentationTime: 900000,
			eventDuration: 0,
			id: 1,
			schemeIdUri: '',
			value: '1',
			messageData,
		}

		const writer = writeEmsg(box)
		const boxes = readIsoBoxes(writer.buffer, { readers: { emsg: readEmsg } })

		assert.strictEqual(boxes.length, 1)
		assert.strictEqual(boxes[0].type, 'emsg')
		assert.strictEqual(boxes[0].schemeIdUri, '')
		assert.strictEqual(boxes[0].value, '1')
		assert.deepEqual(new Uint8Array(boxes[0].messageData), messageData)
	})

	it('should preserve the fixed fields through a version 0 round trip when the strings are empty', function () {
		const messageData = new Uint8Array([0x01, 0x02, 0x03])
		const box = {
			type: 'emsg' as const,
			version: 0 as const,
			flags: 0,
			timescale: 48000,
			presentationTimeDelta: 96000,
			eventDuration: 5,
			id: 7,
			schemeIdUri: '',
			value: '',
			messageData,
		}

		const writer = writeEmsg(box)
		const boxes = readIsoBoxes(writer.buffer, { readers: { emsg: readEmsg } })

		assert.strictEqual(boxes.length, 1)
		assert.strictEqual(boxes[0].type, 'emsg')
		assert.strictEqual(boxes[0].version, 0)
		assert.strictEqual(boxes[0].schemeIdUri, '')
		assert.strictEqual(boxes[0].value, '')
		assert.strictEqual(boxes[0].timescale, 48000)
		assert.strictEqual(boxes[0].presentationTimeDelta, 96000)
		assert.strictEqual(boxes[0].eventDuration, 5)
		assert.strictEqual(boxes[0].id, 7)
		assert.deepEqual(new Uint8Array(boxes[0].messageData), messageData)
	})
})
