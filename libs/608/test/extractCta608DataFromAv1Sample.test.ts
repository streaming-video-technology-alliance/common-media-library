import type { CaptionScreen } from '@svta/cml-608'
import { Cta608Parser, extractCta608DataFromAv1Sample } from '@svta/cml-608'
import { deepEqual, equal, ok } from 'node:assert'
import { readFile } from 'node:fs/promises'
import { describe, it } from 'node:test'
import { parseSegment } from './utils/helpers.ts'

/**
 * Parse an AV1 fragmented mp4 and extract CTA-608 data from all samples.
 */
function parseAv1Samples(file: Buffer): { sampleIndex: number; fieldData: number[][] }[] {
	const { view, mdatBodyStart, samples } = parseSegment(file)

	let cursor = mdatBodyStart
	const results: { sampleIndex: number; fieldData: number[][] }[] = []

	for (let i = 0; i < samples.length; i++) {
		const fieldData = extractCta608DataFromAv1Sample(view, cursor, samples[i].size)
		if (fieldData[0].length > 0 || fieldData[1].length > 0) {
			results.push({ sampleIndex: i, fieldData })
		}
		cursor += samples[i].size
	}

	return results
}

/**
 * The field 1 byte pairs injected into `608_av1.mp4`, one pair per frame starting at
 * frame 0: RCL, ENM, PAC(row 15), "HELLO WORLD", EOC — each control code doubled — then
 * EDM at frame 30. Doubling is why each control pair appears in two consecutive frames.
 */
const expectedPairs = [
	[0, [0x94, 0x20]], // RCL (resume caption loading, pop-on)
	[1, [0x94, 0x20]],
	[2, [0x94, 0xAE]], // ENM (erase non-displayed memory)
	[3, [0x94, 0xAE]],
	[4, [0x94, 0xE0]], // PAC: row 15, white
	[5, [0x94, 0xE0]],
	[6, [0xC8, 0x45]], // "HE"
	[7, [0x4C, 0x4C]], // "LL"
	[8, [0x4F, 0x20]], // "O "
	[9, [0x57, 0x4F]], // "WO"
	[10, [0x52, 0x4C]], // "RL"
	[11, [0xC4, 0x80]], // "D" + null padding
	[12, [0x94, 0x2F]], // EOC (end of caption, flips to display)
	[13, [0x94, 0x2F]],
	[30, [0x94, 0x2C]], // EDM (erase displayed memory)
	[31, [0x94, 0x2C]],
] as const

describe('extractCta608DataFromAv1Sample', () => {
	// #region example
	it('should extract CTA-608 field data from an AV1 metadata OBU', async () => {
		const file = await readFile('test/fixtures/608_av1.mp4')
		const { view, mdatBodyStart, samples } = parseSegment(file)

		// The first sample carries the RCL control pair that opens the caption
		const fieldData = extractCta608DataFromAv1Sample(view, mdatBodyStart, samples[0].size)

		deepEqual(fieldData, [[0x94, 0x20], []])
	})
	// #endregion example

	it('should extract every injected field 1 pair in sample order', async () => {
		const file = await readFile('test/fixtures/608_av1.mp4')
		const results = parseAv1Samples(file)

		equal(results.length, expectedPairs.length)

		for (let i = 0; i < expectedPairs.length; i++) {
			const [sampleIndex, pair] = expectedPairs[i]
			equal(results[i].sampleIndex, sampleIndex)
			deepEqual(results[i].fieldData, [pair, []])
		}
	})

	it('should return empty field data for AV1 samples without CTA-608 data', async () => {
		const file = await readFile('test/fixtures/608_av1.mp4')
		const { view, mdatBodyStart, samples } = parseSegment(file)

		// Frames 14-29 sit between the caption and its erase command
		let cursor = mdatBodyStart
		for (let i = 0; i < 20; i++) {
			cursor += samples[i].size
		}

		deepEqual(extractCta608DataFromAv1Sample(view, cursor, samples[20].size), [[], []])
	})

	it('should not mistake a non-metadata OBU for caption data', async () => {
		// A minimal temporal unit: a temporal delimiter (type 2, empty) then a frame OBU
		// (type 6) whose payload happens to begin with the A/53 identifier bytes.
		const bytes = new Uint8Array([
			0x12, 0x00, // OBU_TEMPORAL_DELIMITER, has_size_field, obu_size = 0
			0x32, 0x0A, // OBU_FRAME, has_size_field, obu_size = 10
			0xB5, 0x00, 0x31, 0x47, 0x41, 0x39, 0x34, 0x03, 0xC1, 0xFF,
		])
		const view = new DataView(bytes.buffer)

		deepEqual(extractCta608DataFromAv1Sample(view, 0, bytes.length), [[], []])
	})

	it('should skip a metadata OBU that is not ITU-T T.35', async () => {
		// OBU_METADATA carrying METADATA_TYPE_HDR_CLL (1) rather than ITUT_T35 (4).
		const bytes = new Uint8Array([
			0x2A, 0x04, // OBU_METADATA, has_size_field, obu_size = 4
			0x01, 0x00, 0x64, 0x80, // metadata_type = 1, max_cll, trailing_bits
		])
		const view = new DataView(bytes.buffer)

		deepEqual(extractCta608DataFromAv1Sample(view, 0, bytes.length), [[], []])
	})

	it('should stop cleanly on a truncated OBU rather than read out of bounds', async () => {
		// obu_size claims 32 bytes but only 2 follow.
		const bytes = new Uint8Array([0x2A, 0x20, 0x04, 0xB5])
		const view = new DataView(bytes.buffer)

		deepEqual(extractCta608DataFromAv1Sample(view, 0, bytes.length), [[], []])
	})

	it('should read a metadata OBU that carries an extension byte', async () => {
		// obu_extension_flag set: a temporal_id / spatial_id byte precedes obu_size.
		const bytes = new Uint8Array([
			0x2E, 0x00, 0x0F, // OBU_METADATA, extension_flag, has_size_field; ext byte; obu_size = 15
			0x04, // metadata_type = ITUT_T35
			0xB5, 0x00, 0x31, 0x47, 0x41, 0x39, 0x34, 0x03, // A/53 identifier
			0xC1, 0xFF, 0xFC, 0x94, 0x20, // cc_data: cc_count = 1, em_data, field 1 pair
			0x80, // trailing_bits
		])
		const view = new DataView(bytes.buffer)

		deepEqual(extractCta608DataFromAv1Sample(view, 0, bytes.length), [[0x94, 0x20], []])
	})

	it('should read a final OBU that omits obu_size', async () => {
		// obu_has_size_field clear: the OBU runs to the end of the temporal unit.
		const bytes = new Uint8Array([
			0x28, // OBU_METADATA, no size field
			0x04, // metadata_type = ITUT_T35
			0xB5, 0x00, 0x31, 0x47, 0x41, 0x39, 0x34, 0x03, // A/53 identifier
			0xC1, 0xFF, 0xFC, 0x94, 0x2C, // cc_data: cc_count = 1, em_data, field 1 pair
			0x80, // trailing_bits
		])
		const view = new DataView(bytes.buffer)

		deepEqual(extractCta608DataFromAv1Sample(view, 0, bytes.length), [[0x94, 0x2C], []])
	})

	it('should extract both fields from one cc_data structure', async () => {
		const bytes = new Uint8Array([
			0x2A, 0x12, // OBU_METADATA, has_size_field, obu_size = 18
			0x04, // metadata_type = ITUT_T35
			0xB5, 0x00, 0x31, 0x47, 0x41, 0x39, 0x34, 0x03, // A/53 identifier
			0xC2, 0xFF, // cc_count = 2, em_data
			0xFC, 0x94, 0x20, // cc_type 0 (field 1)
			0xFD, 0x94, 0x2C, // cc_type 1 (field 2)
			0x80, // trailing_bits
		])
		const view = new DataView(bytes.buffer)

		deepEqual(extractCta608DataFromAv1Sample(view, 0, bytes.length), [[0x94, 0x20], [0x94, 0x2C]])
	})

	it('should render the injected caption through Cta608Parser', async () => {
		const file = await readFile('test/fixtures/608_av1.mp4')
		const { view, mdatBodyStart, samples } = parseSegment(file)

		const cues: string[] = []
		const parser = new Cta608Parser(1, {
			newCue(_startTime: number, _endTime: number, screen: CaptionScreen) {
				cues.push(screen.getDisplayText())
			},
		}, null)

		// Feed every sample in presentation order, 30 fps
		let cursor = mdatBodyStart
		for (let i = 0; i < samples.length; i++) {
			const fieldData = extractCta608DataFromAv1Sample(view, cursor, samples[i].size)
			if (fieldData[0].length > 0) {
				parser.addData((i * 1000) / 30, fieldData[0])
			}
			cursor += samples[i].size
		}

		deepEqual(cues, ['HELLO WORLD'])
	})

	it('should carry the same payload as the SEI path', async () => {
		// The A/53 cc_data() bytes are identical for AV1 and AVC/HEVC; only the envelope
		// differs. Both fixtures use the same doubled control codes and character pairs.
		const file = await readFile('test/fixtures/608_av1.mp4')
		const { view, mdatBodyStart, samples } = parseSegment(file)

		// Locate the metadata OBU payload in sample 0 and confirm the identifier bytes
		let pos = -1
		for (let i = mdatBodyStart; i < mdatBodyStart + samples[0].size - 8; i++) {
			if (view.getUint8(i) === 0xB5 && view.getUint32(i + 3) === 0x47413934) {
				pos = i
				break
			}
		}

		ok(pos > 0, 'A/53 identifier not found in the AV1 sample')
		equal(view.getUint16(pos + 1), 0x0031, 'provider code should be 0x0031')
		equal(view.getUint8(pos + 7), 0x03, 'user data type code should be 0x03')

		// No emulation prevention in an OBU, so cc_data() follows the identifier verbatim
		equal(view.getUint8(pos + 8) & 0x1F, 20, 'cc_count should be the 30 fps value')
	})
})
