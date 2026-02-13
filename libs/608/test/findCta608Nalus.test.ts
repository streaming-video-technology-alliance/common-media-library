import { findCta608Nalus } from '@svta/cml-608'
import { equal, ok } from 'node:assert'
import { describe, it } from 'node:test'

/**
 * Builds a minimal sample buffer containing a single SEI NAL unit with
 * a CEA-608 user_data_registered_itu_t_t35 payload for use with findCta608Nalus.
 *
 * @param nalHeader - The NAL unit header bytes (1 byte for H.264, 2 bytes for H.265/H.266)
 * @param ccData - Array of [ccType, ccData1, ccData2] triplets
 */
function buildSeiSample(nalHeader: number[], ccData: [number, number, number][]): DataView {
	const ccCount = ccData.length
	const payloadDataSize = 11 + 3 * ccCount

	const seiMessage: number[] = []
	seiMessage.push(0x04)
	seiMessage.push(payloadDataSize)

	// itu_t_t35_country_code: 0xB5
	seiMessage.push(0xB5)
	// itu_t_t35_provider_code: 0x0031
	seiMessage.push(0x00, 0x31)
	// ATSC_user_identifier: "GA94"
	seiMessage.push(0x47, 0x41, 0x39, 0x34)
	// user_data_type_code: 0x03
	seiMessage.push(0x03)
	// process_cc_data_flag + cc_count
	seiMessage.push(0x40 | (ccCount & 0x1F))
	// em_data
	seiMessage.push(0xFF)

	for (const [ccType, data1, data2] of ccData) {
		seiMessage.push(0xF8 | 0x04 | (ccType & 0x03))
		seiMessage.push(data1)
		seiMessage.push(data2)
	}

	// Marker bits
	seiMessage.push(0xFF)
	// RBSP trailing bits
	seiMessage.push(0x80)

	const nalContentSize = nalHeader.length + seiMessage.length
	const buffer = new ArrayBuffer(4 + nalContentSize)
	const view = new DataView(buffer)

	view.setUint32(0, nalContentSize)
	let offset = 4
	for (const byte of nalHeader) view.setUint8(offset++, byte)
	for (const byte of seiMessage) view.setUint8(offset++, byte)

	return view
}

function h264SeiHeader(): number[] {
	return [0x06]
}

function h265SeiPrefixHeader(): number[] {
	// nal_unit_type = 39: byte 0 = 0_100111_0 = 0x4E, byte 1 = 00000_001 = 0x01
	return [0x4E, 0x01]
}

function h266SeiPrefixHeader(): number[] {
	// nal_unit_type = 23: byte 0 = 0x00, byte 1 = 10111_001 = 0xB9
	return [0x00, 0xB9]
}

// #region example
describe('findCta608Nalus', () => {

	it('finds CEA-608 NAL unit ranges in an H.264 stream', () => {
		const sample = buildSeiSample(h264SeiHeader(), [
			[0, 0x94, 0x20],
		])
		const ranges = findCta608Nalus(sample, 0, sample.byteLength)
		equal(ranges.length, 1)
		ok(ranges[0][1] > 0) // payload size > 0
	})

	it('finds CEA-608 NAL unit ranges in an H.265 stream', () => {
		const sample = buildSeiSample(h265SeiPrefixHeader(), [
			[0, 0x94, 0x20],
		])
		const ranges = findCta608Nalus(sample, 0, sample.byteLength)
		equal(ranges.length, 1)
		ok(ranges[0][1] > 0)
	})

	it('finds CEA-608 NAL unit ranges in an H.266 stream', () => {
		const sample = buildSeiSample(h266SeiPrefixHeader(), [
			[0, 0x94, 0x20],
		])
		const ranges = findCta608Nalus(sample, 0, sample.byteLength)
		equal(ranges.length, 1)
		ok(ranges[0][1] > 0)
	})

	it('returns empty when no SEI NAL units are present', () => {
		// H.264 IDR NAL (type 5)
		const buffer = new ArrayBuffer(4 + 1 + 4)
		const view = new DataView(buffer)
		view.setUint32(0, 5)
		view.setUint8(4, 0x65) // type 5 IDR
		const ranges = findCta608Nalus(view, 0, view.byteLength)
		equal(ranges.length, 0)
	})

	it('finds CEA-608 in an H.265 SEI preceded by a non-SEI NAL', () => {
		// VCL NAL (H.265 type 1)
		const vclHeader = [0x02, 0x01]
		const vclData = [0x00, 0x01, 0x02, 0x03]

		const seiSample = buildSeiSample(h265SeiPrefixHeader(), [
			[0, 0x94, 0x20],
			[1, 0x1C, 0x20],
		])

		const vclNalSize = vclHeader.length + vclData.length
		const totalSize = 4 + vclNalSize + seiSample.byteLength
		const buffer = new ArrayBuffer(totalSize)
		const view = new DataView(buffer)

		view.setUint32(0, vclNalSize)
		let offset = 4
		for (const b of vclHeader) view.setUint8(offset++, b)
		for (const b of vclData) view.setUint8(offset++, b)
		for (let i = 0; i < seiSample.byteLength; i++) {
			view.setUint8(offset++, seiSample.getUint8(i))
		}

		const ranges = findCta608Nalus(view, 0, view.byteLength)
		equal(ranges.length, 1)
		ok(ranges[0][1] > 0)
	})
})
// #endregion example
