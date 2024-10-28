import type { DecodedId3Frame } from '../DecodedId3Frame.js';
import type { RawId3Frame } from './RawFrame.js';
import { toUint8 } from './utf8.js';
import { toArrayBuffer } from './toArrayBuffer.js';
import { utf8ArrayToStr } from '../../utils.js'; 

type MetadataFrame = {
	key: string;
	description: string;
	data: string | ArrayBuffer;
	mimeType: string | null;
	pictureType: number | null;
}

export function decodeId3ImageFrame(
	frame: RawId3Frame,
): DecodedId3Frame<string | ArrayBuffer> | undefined {
	const metadataFrame: MetadataFrame = {
		key: frame.type,
		description: '',
		data: '',
		mimeType: null,
		pictureType: null,
	};

	const utf8Encoding = 0x03;

	if (frame.size < 2) {
		return undefined;
	}
	if (frame.data[0] !== utf8Encoding) {
		console.log('Ignore frame with unrecognized character ' + 'encoding');
		return undefined;
	}

	const mimeTypeEndIndex = frame.data.subarray(1).indexOf(0);
	if (mimeTypeEndIndex === -1) {
		return undefined;
	}
	const mimeType = utf8ArrayToStr(toUint8(frame.data, 1, mimeTypeEndIndex));
	const pictureType = frame.data[2 + mimeTypeEndIndex];
	const descriptionEndIndex = frame.data
		.subarray(3 + mimeTypeEndIndex)
		.indexOf(0);
	if (descriptionEndIndex === -1) {
		return undefined;
	}
	const description = utf8ArrayToStr(
		toUint8(frame.data, 3 + mimeTypeEndIndex, descriptionEndIndex),
	);

	let data;
	if (mimeType === '-->') {
		data = utf8ArrayToStr(
			toUint8(frame.data, 4 + mimeTypeEndIndex + descriptionEndIndex),
		);
	} 
	else {
		data = toArrayBuffer(
			frame.data.subarray(4 + mimeTypeEndIndex + descriptionEndIndex),
		);
	}

	metadataFrame.mimeType = mimeType;
	metadataFrame.pictureType = pictureType;
	metadataFrame.description = description;
	metadataFrame.data = data;
	return metadataFrame;
}
