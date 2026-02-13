import { extractCta608DataFromSample } from '@svta/cml-608'
import { deepEqual } from 'node:assert'
import { describe, it } from 'node:test'

/**
 * Builds a minimal sample buffer containing a single SEI NAL unit with
 * a CEA-608 user_data_registered_itu_t_t35 payload.
 *
 * The CEA-608 SEI payload structure (per ATSC A/72 and ANSI/SCTE 128):
 *   - SEI payload type: 4 (user_data_registered_itu_t_t35)
 *   - itu_t_t35_country_code: 0xB5 (United States)
 *   - itu_t_t35_provider_code: 0x0031 (ATSC)
 *   - ATSC_user_identifier: 0x47413934 ("GA94")
 *   - user_data_type_code: 0x03
 *   - cc_count field + reserved bits
 *   - cc_data triplets: marker_bits(5) | cc_valid(1) | cc_type(2) | cc_data_1 | cc_data_2
 *
 * @param nalHeader - The NAL unit header bytes (1 byte for H.264, 2 bytes for H.265/H.266)
 * @param ccData - Array of [ccType, ccData1, ccData2] triplets
 */
function buildSeiSample(nalHeader: number[], ccData: [number, number, number][]): DataView {
	// SEI payload: type(1) + size(1) + country(1) + provider(2) + identifier(4) + typeCode(1) + flags(1) + ccCount(1) + ccData(3*n) + marker(1)
	const ccCount = ccData.length
	const seiPayloadSize = 1 + 2 + 4 + 1 + 1 + 1 + ccCount * 3 + 1 // = 11 + ccCount * 3 + 1
	const seiPayload: number[] = []

	// SEI payload type: 4 (user_data_registered_itu_t_t35)
	seiPayload.push(0x04)
	// SEI payload size
	seiPayload.push(seiPayloadSize - 2) // minus the type and size bytes themselves: payload starts after type+size

	// Wait, the SEI message format is:
	// payloadType (variable length, 0xFF... then final byte)
	// payloadSize (variable length, 0xFF... then final byte)
	// payload data of payloadSize bytes

	// Let me recalculate. The payload data is:
	// country_code(1) + provider_code(2) + user_identifier(4) + user_data_type_code(1) + reserved+cc_count(1) + reserved(1) + cc_data(3*n) + marker(1)
	// = 11 + 3*ccCount

	const payloadDataSize = 11 + 3 * ccCount

	// Build the SEI message
	const seiMessage: number[] = []
	// Payload type = 4
	seiMessage.push(0x04)
	// Payload size
	seiMessage.push(payloadDataSize)

	// itu_t_t35_country_code: 0xB5 (United States)
	seiMessage.push(0xB5)
	// itu_t_t35_provider_code: 0x0031 (ATSC) - big endian
	seiMessage.push(0x00, 0x31)
	// ATSC_user_identifier: "GA94" = 0x47413934
	seiMessage.push(0x47, 0x41, 0x39, 0x34)
	// user_data_type_code: 0x03
	seiMessage.push(0x03)
	// process_em_data_flag(1) + process_cc_data_flag(1) + additional_data_flag(1) + cc_count(5)
	// Set process_cc_data_flag=1, cc_count=ccCount
	seiMessage.push(0x40 | (ccCount & 0x1F))
	// em_data (reserved)
	seiMessage.push(0xFF)

	// CC data triplets
	for (const [ccType, data1, data2] of ccData) {
		// marker_bits(5, all 1s) + cc_valid(1) + cc_type(2)
		seiMessage.push(0xF8 | 0x04 | (ccType & 0x03))
		seiMessage.push(data1)
		seiMessage.push(data2)
	}

	// Marker bits (0xFF)
	seiMessage.push(0xFF)

	// RBSP trailing bits
	seiMessage.push(0x80)

	// NAL unit size = nalHeader.length + seiMessage.length
	const nalContentSize = nalHeader.length + seiMessage.length
	const buffer = new ArrayBuffer(4 + nalContentSize)
	const view = new DataView(buffer)

	// Write NAL size (4 bytes, big-endian) - size excludes the 4-byte length field
	view.setUint32(0, nalContentSize)

	// Write NAL header
	let offset = 4
	for (const byte of nalHeader) {
		view.setUint8(offset++, byte)
	}

	// Write SEI message
	for (const byte of seiMessage) {
		view.setUint8(offset++, byte)
	}

	return view
}

/**
 * Builds an H.264 NAL header for an SEI NAL unit.
 * H.264 NAL header: forbidden_zero_bit(1) | nal_ref_idc(2) | nal_unit_type(5)
 * SEI type = 6, nal_ref_idc = 0
 */
function h264SeiHeader(): number[] {
	return [0x06] // 0_00_00110 = type 6
}

/**
 * Builds an H.265 NAL header for an SEI prefix NAL unit.
 * H.265 NAL header (2 bytes):
 *   byte 0: forbidden_zero_bit(1) | nal_unit_type(6) | nuh_layer_id high bit(1)
 *   byte 1: nuh_layer_id low 5 bits(5) | nuh_temporal_id_plus1(3)
 * SEI prefix type = 39 (0x27), layer_id = 0, temporal_id_plus1 = 1
 */
function h265SeiPrefixHeader(): number[] {
	// nal_unit_type = 39 = 0b100111
	// byte 0: 0_100111_0 = 0x4E
	// byte 1: 00000_001 = 0x01
	return [0x4E, 0x01]
}

/**
 * Builds an H.265 NAL header for an SEI suffix NAL unit.
 * SEI suffix type = 40 (0x28), layer_id = 0, temporal_id_plus1 = 1
 */
function h265SeiSuffixHeader(): number[] {
	// nal_unit_type = 40 = 0b101000
	// byte 0: 0_101000_0 = 0x50
	// byte 1: 00000_001 = 0x01
	return [0x50, 0x01]
}

/**
 * Builds an H.266 NAL header for an SEI prefix NAL unit.
 * H.266 NAL header (2 bytes):
 *   byte 0: forbidden_zero_bit(1) | nuh_reserved_zero_bit(1) | nuh_layer_id(6)
 *   byte 1: nal_unit_type(5) | nuh_temporal_id_plus1(3)
 * SEI prefix type = 23 (0x17), layer_id = 0, temporal_id_plus1 = 1
 */
function h266SeiPrefixHeader(): number[] {
	// byte 0: 0_0_000000 = 0x00
	// byte 1: 10111_001 = 0xB9
	return [0x00, 0xB9]
}

/**
 * Builds an H.266 NAL header for an SEI suffix NAL unit.
 * SEI suffix type = 24 (0x18), layer_id = 0, temporal_id_plus1 = 1
 */
function h266SeiSuffixHeader(): number[] {
	// byte 0: 0_0_000000 = 0x00
	// byte 1: 11000_001 = 0xC1
	return [0x00, 0xC1]
}

// #region example
describe('extractCta608DataFromSample', () => {

	it('extracts CEA-608 field 1 data from an H.264 SEI NAL unit', () => {
		const sample = buildSeiSample(h264SeiHeader(), [
			[0, 0x94, 0x20], // field 1: "RCL" (Resume Caption Loading)
		])
		const result = extractCta608DataFromSample(sample, 0, sample.byteLength)
		deepEqual(result, [[0x94, 0x20], []])
	})

	it('extracts CEA-608 field 1 and field 2 data from an H.264 SEI NAL unit', () => {
		const sample = buildSeiSample(h264SeiHeader(), [
			[0, 0x94, 0x20], // field 1
			[1, 0x1C, 0x20], // field 2
		])
		const result = extractCta608DataFromSample(sample, 0, sample.byteLength)
		deepEqual(result, [[0x94, 0x20], [0x1C, 0x20]])
	})

	it('extracts CEA-608 data from an H.265 SEI prefix NAL unit', () => {
		const sample = buildSeiSample(h265SeiPrefixHeader(), [
			[0, 0x94, 0x20], // field 1
			[1, 0x1C, 0x20], // field 2
		])
		const result = extractCta608DataFromSample(sample, 0, sample.byteLength)
		deepEqual(result, [[0x94, 0x20], [0x1C, 0x20]])
	})

	it('extracts CEA-608 data from an H.265 SEI suffix NAL unit', () => {
		const sample = buildSeiSample(h265SeiSuffixHeader(), [
			[0, 0x80, 0x80], // field 1: null padding (parity bit set)
			[0, 0x48, 0x65], // field 1: "He"
		])
		const result = extractCta608DataFromSample(sample, 0, sample.byteLength)
		deepEqual(result, [[0x48, 0x65], []])
	})

	it('extracts CEA-608 data from an H.266 SEI prefix NAL unit', () => {
		const sample = buildSeiSample(h266SeiPrefixHeader(), [
			[0, 0x94, 0x20], // field 1
		])
		const result = extractCta608DataFromSample(sample, 0, sample.byteLength)
		deepEqual(result, [[0x94, 0x20], []])
	})

	it('extracts CEA-608 data from an H.266 SEI suffix NAL unit', () => {
		const sample = buildSeiSample(h266SeiSuffixHeader(), [
			[1, 0x1C, 0x20], // field 2
		])
		const result = extractCta608DataFromSample(sample, 0, sample.byteLength)
		deepEqual(result, [[], [0x1C, 0x20]])
	})

	it('returns empty fields when the NAL unit is not an SEI type', () => {
		// H.264 IDR NAL unit (type 5), not SEI
		const nalHeader = [0x65] // 0_11_00101 = type 5
		const buffer = new ArrayBuffer(4 + 1 + 4) // length + header + some data
		const view = new DataView(buffer)
		view.setUint32(0, 5)
		view.setUint8(4, nalHeader[0])
		const result = extractCta608DataFromSample(view, 0, view.byteLength)
		deepEqual(result, [[], []])
	})

	it('handles a sample with a non-SEI NAL followed by an H.265 SEI NAL', () => {
		// First NAL: H.265 VCL NAL (type 1 = STSA_NUT), not SEI
		// byte 0: 0_000001_0 = 0x02, byte 1: 00000_001 = 0x01
		const vclNalHeader = [0x02, 0x01]
		const vclNalData = [0x00, 0x00, 0x01, 0x02] // some arbitrary data

		// Second NAL: H.265 SEI prefix with CEA-608
		const seiSample = buildSeiSample(h265SeiPrefixHeader(), [
			[0, 0x94, 0x20], // field 1
		])

		// Combine: 4-byte length + vclHeader + vclData + seiSample bytes
		const vclNalSize = vclNalHeader.length + vclNalData.length
		const totalSize = 4 + vclNalSize + seiSample.byteLength
		const buffer = new ArrayBuffer(totalSize)
		const view = new DataView(buffer)

		// Write VCL NAL
		view.setUint32(0, vclNalSize)
		let offset = 4
		for (const b of vclNalHeader) view.setUint8(offset++, b)
		for (const b of vclNalData) view.setUint8(offset++, b)

		// Copy SEI NAL sample
		for (let i = 0; i < seiSample.byteLength; i++) {
			view.setUint8(offset++, seiSample.getUint8(i))
		}

		const result = extractCta608DataFromSample(view, 0, view.byteLength)
		deepEqual(result, [[0x94, 0x20], []])
	})

	it('skips CC data with cc_valid=0', () => {
		// Build a sample with cc_valid=0 manually
		const nalHeader = h264SeiHeader()
		const ccCount = 1
		const payloadDataSize = 11 + 3 * ccCount
		const seiMessage: number[] = [
			0x04, payloadDataSize,
			0xB5, 0x00, 0x31, 0x47, 0x41, 0x39, 0x34, 0x03,
			0x40 | ccCount,
			0xFF,
			0xF8 | 0x00 | 0x00, 0x94, 0x20, // cc_valid=0, cc_type=0
			0xFF,
			0x80,
		]
		const nalContentSize = nalHeader.length + seiMessage.length
		const buffer = new ArrayBuffer(4 + nalContentSize)
		const view = new DataView(buffer)
		view.setUint32(0, nalContentSize)
		let offset = 4
		for (const b of nalHeader) view.setUint8(offset++, b)
		for (const b of seiMessage) view.setUint8(offset++, b)

		const result = extractCta608DataFromSample(view, 0, view.byteLength)
		deepEqual(result, [[], []])
	})
})
// #endregion example
