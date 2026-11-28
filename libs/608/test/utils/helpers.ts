import { seekIsoBox } from '@svta/cml-iso-bmff'
import { equal, ok } from 'node:assert'

/**
 * Parse the trun box from an m4s segment to extract sample sizes.
 */
export function parseTrunSamples(view: DataView, trunOffset: number): { size: number }[] {
	const versionAndFlags = view.getUint32(trunOffset + 8)
	const flags = versionAndFlags & 0xffffff

	const dataOffsetPresent = !!(flags & 0x001)
	const firstSampleFlagsPresent = !!(flags & 0x004)
	const sampleDurationPresent = !!(flags & 0x100)
	const sampleSizePresent = !!(flags & 0x200)
	const sampleFlagsPresent = !!(flags & 0x400)
	const sampleCTOPresent = !!(flags & 0x800)

	const sampleCount = view.getUint32(trunOffset + 12)
	let pos = trunOffset + 16

	if (dataOffsetPresent) pos += 4
	if (firstSampleFlagsPresent) pos += 4

	const samples: { size: number }[] = []
	for (let i = 0; i < sampleCount; i++) {
		if (sampleDurationPresent) pos += 4
		const size = sampleSizePresent ? view.getUint32(pos) : 0
		if (sampleSizePresent) pos += 4
		if (sampleFlagsPresent) pos += 4
		if (sampleCTOPresent) pos += 4
		samples.push({ size })
	}

	return samples
}

/**
 * Parse an m4s segment and return the DataView, mdat body start offset, and sample sizes.
 */
export function parseSegment(file: Buffer): {
	view: DataView
	mdatBodyStart: number
	samples: { size: number }[]
} {
	const view = new DataView(file.buffer, file.byteOffset, file.byteLength)

	const moof = seekIsoBox(file, ['moof'])
	ok(moof, 'moof box not found or truncated')
	const trun = seekIsoBox(moof, ['traf', 'trun'])
	ok(trun, 'traf or trun box not found or truncated')

	const dataOffset = view.getInt32(trun.start + 16)
	const mdatBodyStart = moof.start + dataOffset
	const samples = parseTrunSamples(view, trun.start)

	return { view, mdatBodyStart, samples }
}

/** Verify that the bytes at `pos` contain a valid GA94 identifier per ANSI-SCTE 128. */
export function verifyGa94Identifier(view: DataView, pos: number): void {
	equal(view.getUint8(pos), 0xb5, 'country code should be 0xB5')
	equal(view.getUint16(pos + 1), 0x0031, 'provider code should be 0x0031')
	equal(view.getUint32(pos + 3), 0x47413934, 'user identifier should be GA94')
	equal(view.getUint8(pos + 7), 0x03, 'user data type code should be 0x03')
}
