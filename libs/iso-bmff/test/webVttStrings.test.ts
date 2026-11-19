import { writeWith } from './util/writeWith.ts'
import {
	assert,
	describe,
	it,
	readIden,
	readIsoBoxes,
	readPayl,
	readSttg,
	readVlab,
	readVttC,
	writeIden,
	writePayl,
	writeSttg,
	writeVlab,
	writeVttC,
	type IsoBoxWriter,
} from './util/box.ts'

const TEXT = 'a\0b'

const cases = [
	['vttC', 'config', readVttC, writeVttC],
	['vlab', 'sourceLabel', readVlab, writeVlab],
	['payl', 'cueText', readPayl, writePayl],
	['iden', 'cueId', readIden, writeIden],
	['sttg', 'settings', readSttg, writeSttg],
] as const

describe('WebVTT text boxes', function () {
	for (const [type, field, reader, writer] of cases) {
		it(`should write and read the text of ${type} to the end of the box, with U+0000`, function () {
			const box = { type, [field]: TEXT }
			const bytes = writeWith(writer as IsoBoxWriter<typeof box>, box)
			const [read] = readIsoBoxes(bytes, {
				readers: { [type]: reader },
			})

			assert.deepStrictEqual(Array.from(bytes.subarray(8)), [0x61, 0, 0x62])
			assert.deepStrictEqual(read, box)
		})
	}
})
