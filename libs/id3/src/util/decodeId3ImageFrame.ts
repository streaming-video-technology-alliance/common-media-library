import type { DecodedId3Frame } from '../DecodedId3Frame.ts'
import type { RawId3Frame } from './RawId3Frame.ts'
import { toArrayBuffer } from './toArrayBuffer.ts'
import { toUint8 } from './utf8.ts'
import { utf8ArrayToStr } from './utf8ArrayToStr.ts'

type MetadataFrame = {
	key: string;
	description: string;
	data: string | ArrayBufferLike;
	mimeType: string | null;
	pictureType: number | null;
};

/**
 * Decode an ID3 APIC frame.
 *
 * @param frame - the ID3 APIC frame
 *
 * @returns The decoded ID3 APIC frame
 *
 * @internal
 */
export function decodeId3ImageFrame(
	frame: RawId3Frame,
): DecodedId3Frame<string | ArrayBufferLike> | undefined {
	const metadataFrame: MetadataFrame = {
		key: frame.type,
		description: '',
		data: '',
		mimeType: null,
		pictureType: null,
	}

	const utf8Encoding = 0x03

	if (frame.size < 2) {
		return undefined
	}
	if (frame.data[0] !== utf8Encoding) {
		console.log('Ignore frame with unrecognized character ' + 'encoding')
		return undefined
	}

	const mimeTypeEndIndex = frame.data.subarray(1).indexOf(0)
	if (mimeTypeEndIndex === -1) {
		return undefined
	}
	const mimeType = utf8ArrayToStr(toUint8(frame.data, 1, mimeTypeEndIndex))
	const pictureType = frame.data[2 + mimeTypeEndIndex]
	const descriptionEndIndex = frame.data
		.subarray(3 + mimeTypeEndIndex)
		.indexOf(0)
	if (descriptionEndIndex === -1) {
		return undefined
	}
	const description = utf8ArrayToStr(
		toUint8(frame.data, 3 + mimeTypeEndIndex, descriptionEndIndex),
	)

	let data
	if (mimeType === '-->') {
		data = utf8ArrayToStr(
			toUint8(frame.data, 4 + mimeTypeEndIndex + descriptionEndIndex),
		)
	}
	else {
		data = toArrayBuffer(
			frame.data.subarray(4 + mimeTypeEndIndex + descriptionEndIndex),
		)
	}

	metadataFrame.mimeType = mimeType
	metadataFrame.pictureType = pictureType
	metadataFrame.description = description
	metadataFrame.data = data

	return metadataFrame
}
