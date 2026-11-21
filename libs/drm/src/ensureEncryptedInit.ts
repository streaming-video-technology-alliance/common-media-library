import {
	createAudioSampleEntryReader,
	createVisualSampleEntryReader,
	findIsoBox,
	isIsoBoxType,
	readIsoBoxes,
	readStsd,
	writeAudioSampleEntry,
	writeFrma,
	writeIsoBoxes,
	writeSchm,
	writeStsd,
	writeTenc,
	writeVisualSampleEntry,
	type AudioSampleEntry,
	type IsoBoxReaderMap,
	type IsoBoxType,
	type IsoBoxWriterMap,
	type VisualSampleEntry,
} from '@svta/cml-iso-bmff'

const audioTypes: IsoBoxType[] = ['mp4a', 'ac-3', 'ec-3', 'ac-4', 'fLaC', 'Opus']

const videoTypes: IsoBoxType[] = [
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

const readers = /* @__PURE__ */ (() => {
	const map = {
		stsd: readStsd,
	}
	const dynamic: IsoBoxReaderMap = map
	audioTypes.forEach(type => (dynamic[type] = createAudioSampleEntryReader(type)))
	videoTypes.forEach(type => (dynamic[type] = createVisualSampleEntryReader(type)))
	return map
})()

const writers = /* @__PURE__ */ (() => {
	const map = {
		stsd: writeStsd,
		frma: writeFrma,
		schm: writeSchm,
		tenc: writeTenc,
		encv: writeVisualSampleEntry,
		enca: writeAudioSampleEntry,
	}
	const dynamic: IsoBoxWriterMap = map
	audioTypes.forEach(type => (dynamic[type] = writeAudioSampleEntry))
	videoTypes.forEach(type => (dynamic[type] = writeVisualSampleEntry))
	return map
})()

/**
 * Options for the `ensureEncryptedInit` function.
 *
 * @public
 */
export type EnsureEncryptedInitOptions = {
	/**
	 * Whether to prepend the encrypted entries to the sample table.
	 *
	 * @defaultValue `true`
	 */
	prepend: boolean

	/**
	 * Whether to include the original init segment in the result.
	 *
	 * @defaultValue `true`
	 */
	includeOriginal: boolean

	/**
	 * The scheme type to use for the encryption, as a four-character code such as `cbcs`.
	 * A number is the code as a 32-bit integer, such as `0x63626373` for `cbcs`.
	 *
	 * @defaultValue `'cenc'`
	 */
	schemeType: string | number

	/**
	 * The default KID to use for the encryption, 16 bytes.
	 *
	 * @defaultValue 16 bytes of 0
	 */
	defaultKid: Uint8Array | number[]
}

/**
 * Ensures that the init segment is encrypted. Used on platforms that have issues playing unencrypted
 * content before playing encrypted content. Both prepend and includeOriginal are optional.
 *
 * @param init - The init segment to ensure is encrypted.
 * @param options - The options for the encryption.
 *
 * @returns The encrypted init segment.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/ensureEncryptedInit.test.ts#example}
 */
export function ensureEncryptedInit(
	init: Uint8Array,
	options?: Partial<EnsureEncryptedInitOptions>,
): Uint8Array {
	const {
		prepend = true,
		includeOriginal = true,
		schemeType = 'cenc',
		defaultKid = new Uint8Array(16),
	} = options ?? {}
	const boxes = readIsoBoxes(init, { readers })
	const stsd = findIsoBox(boxes, box => isIsoBoxType('stsd', box))

	// No stsd box found, return original init
	if (!stsd) {
		return init
	}

	// If the stsd box already contains enca or encv entries, return original init
	if (stsd.boxes.find(({ type }) => type === 'enca' || type === 'encv')) {
		return init
	}

	const entries = stsd.boxes.filter(
		(entry): entry is AudioSampleEntry | VisualSampleEntry =>
			!('bytes' in entry) && (videoTypes.includes(entry.type) || audioTypes.includes(entry.type)),
	)

	// Add sinf to each sample entry box
	for (const entry of entries) {
		const type = videoTypes.includes(entry.type) ? 'encv' : 'enca'
		const box = { ...entry, boxes: entry.boxes.slice(), type } as
			| AudioSampleEntry
			| VisualSampleEntry

		if (prepend) {
			stsd.boxes.unshift(box)
		} else {
			stsd.boxes.push(box)
		}

		box.boxes.push({
			type: 'sinf',
			boxes: [
				{
					type: 'frma',
					dataFormat: entry.type,
				},
				{
					type: 'schm',
					version: 0,
					flags: 0,
					schemeType:
						typeof schemeType === 'number'
							? String.fromCharCode(
									schemeType >>> 24,
									(schemeType >>> 16) & 0xff,
									(schemeType >>> 8) & 0xff,
									schemeType & 0xff,
								)
							: schemeType,
					schemeVersion: 65536,
				},
				{
					type: 'schi',
					boxes: [
						{
							type: 'tenc',
							version: 0,
							flags: 0,
							defaultIsProtected: 1,
							defaultPerSampleIvSize: 8,
							defaultKid: Uint8Array.from(defaultKid),
						},
					],
				},
			],
		})
	}

	return writeIsoBoxes(includeOriginal ? [...boxes, init] : boxes, { writers })
}
