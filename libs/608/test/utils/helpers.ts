import { equal, ok } from 'node:assert'

/**
 * Parse the trun box from an m4s segment to extract sample sizes.
 */
export function parseTrunSamples(view: DataView, trunOffset: number): { size: number }[] {
	const versionAndFlags = view.getUint32(trunOffset + 8)
	const flags = versionAndFlags & 0xFFFFFF

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
 * Find an ISO BMFF box by type within a DataView.
 */
export function findBox(view: DataView, type: string, start: number, end: number): { offset: number; size: number } | null {
	let pos = start
	while (pos < end - 8) {
		const size = view.getUint32(pos)
		const boxType = String.fromCharCode(
			view.getUint8(pos + 4),
			view.getUint8(pos + 5),
			view.getUint8(pos + 6),
			view.getUint8(pos + 7),
		)
		if (boxType === type) {
			return { offset: pos, size }
		}
		pos += size
	}
	return null
}

/**
 * Parse an m4s segment and return the DataView, mdat body start offset, and sample sizes.
 */
export function parseSegment(file: Buffer): { view: DataView; mdatBodyStart: number; samples: { size: number }[] } {
	const view = new DataView(file.buffer, file.byteOffset, file.byteLength)

	const moof = findBox(view, 'moof', 0, view.byteLength)
	ok(moof, 'moof box not found')
	const traf = findBox(view, 'traf', moof.offset + 8, moof.offset + moof.size)
	ok(traf, 'traf box not found')
	const trun = findBox(view, 'trun', traf.offset + 8, traf.offset + traf.size)
	ok(trun, 'trun box not found')

	const dataOffset = view.getInt32(trun.offset + 16)
	const mdatBodyStart = moof.offset + dataOffset
	const samples = parseTrunSamples(view, trun.offset)

	return { view, mdatBodyStart, samples }
}

/** Verify that the bytes at `pos` contain a valid GA94 identifier per ANSI-SCTE 128. */
export function verifyGa94Identifier(view: DataView, pos: number): void {
	equal(view.getUint8(pos), 0xB5, 'country code should be 0xB5')
	equal(view.getUint16(pos + 1), 0x0031, 'provider code should be 0x0031')
	equal(view.getUint32(pos + 3), 0x47413934, 'user identifier should be GA94')
	equal(view.getUint8(pos + 7), 0x03, 'user data type code should be 0x03')
}
