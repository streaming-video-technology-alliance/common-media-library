import { createAudioSampleEntryReader, createVisualSampleEntryReader, findIsoBox, readIsoBoxes, readStsd, writeAudioSampleEntryBox, writeFrma, writeIsoBoxes, writeSchm, writeStsd, writeTenc, writeVisualSampleEntryBox, type AudioSampleEntryBox, type VisualSampleEntryBox } from '@svta/cml-iso-bmff'
// import { writeFileSync } from 'fs';

/**
 * Converts a 4-character string (e.g., FourCC code) to a uint32 number.
 * Each character's code point is treated as a byte in big-endian order.
 */
// TODO: Move to iso-bmff library
function stringToUint32(str: string): number {
	return (
		(str.charCodeAt(0) << 24) |
		(str.charCodeAt(1) << 16) |
		(str.charCodeAt(2) << 8) |
		str.charCodeAt(3)
	) >>> 0
}

const audioTypes = [
	'mp4a',
	'ac-3',
	'ec-3',
	'ac-4',
	'fLaC',
	'Opus',
]

const videoTypes = [
	'dvh1',
	'dvhe',
	'hev1',
	'hvc1',
	'avc1',
	'avc3',
	'dvav',
	'dva1',
	'dvc1',
	'dvi1',
]

const readers = {
	stsd: readStsd,
}
audioTypes.forEach(type => (readers as any)[type] = createAudioSampleEntryReader(type))
videoTypes.forEach(type => (readers as any)[type] = createVisualSampleEntryReader(type))


const writers = {
	stsd: writeStsd,
	frma: writeFrma,
	schm: writeSchm,
	tenc: writeTenc,
	encv: writeVisualSampleEntryBox,
	enca: writeAudioSampleEntryBox,
}
audioTypes.forEach(type => (writers as any)[type] = writeAudioSampleEntryBox)
videoTypes.forEach(type => (writers as any)[type] = writeVisualSampleEntryBox)

/**
 * Ensures that the init segment is encrypted. Used on platforms that have issues playing unencrypted
 * content before playing encrypted content. Both prepend and includeOriginal are optional.
 *
 * @param init - The init segment to ensure is encrypted.
 * @param prepend - Whether to prepend the encrypted entries to the init segment.
 * @param includeOriginal - Whether to include the original init segment in the result.
 *
 * @returns The encrypted init segment.
 *
 * @public
 *
 * @example
 * {@includeCode ../../test/ensureEncryptedInit.test.ts#example}
 */
export function ensureEncryptedInit(init: Uint8Array<ArrayBuffer>, prepend = true, includeOriginal = true): Uint8Array<ArrayBuffer> {
	const boxes = readIsoBoxes(init, { readers })
	const stsd = findIsoBox(boxes, box => box.type === 'stsd')

	// No stsd box found, return original init
	if (stsd?.type !== 'stsd') {
		return init
	}

	// If the stsd box already contains enca or encv entries, return original init
	if (stsd.entries.find(({ type }) => type === 'enca' || type === 'encv')) {
		return init
	}

	const entries = stsd.entries.filter(({ type }) => videoTypes.includes(type) || audioTypes.includes(type))

	// Add sinf to each sample entry box
	for (const entry of entries) {
		const type = videoTypes.includes(entry.type) ? 'encv' : 'enca'
		const box = { ...entry, boxes: entry.boxes.slice(), type } as AudioSampleEntryBox | VisualSampleEntryBox

		if (prepend) {
			stsd.entries.unshift(box)
		}
		else {
			stsd.entries.push(box)
		}

		box.boxes.push({
			type: 'sinf',
			boxes: [{
				type: 'frma',
				dataFormat: stringToUint32(entry.type),
			}, {
				type: 'schm',
				version: 0,
				flags: 0,
				schemeType: 1667591779, // cenc
				schemeVersion: 65536,
			}, {
				type: 'schi',
				boxes: [{
					type: 'tenc',
					version: 0,
					flags: 0,
					defaultIsEncrypted: 1,
					defaultIvSize: 8,
					defaultKid: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
				}],
			}],
		})
	}

	// Write the boxes to a new Uint8Array
	const chunks = writeIsoBoxes(boxes, { writers })
	const size = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0)
	const length = includeOriginal ? init.length + size : size
	const result = new Uint8Array(length)
	let offset = 0

	for (const box of chunks) {
		result.set(box, offset)
		offset += box.byteLength
	}

	if (includeOriginal) {
		result.set(init, offset)
	}

	return result
}
