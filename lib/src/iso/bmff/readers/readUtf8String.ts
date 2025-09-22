import { decodeText } from '../../../utils/decodeText.js';
import { UTF_8 } from '../../../utils/UTF_8.js';

export function readUtf8String(dataView: DataView<ArrayBuffer>, offset: number): string {
	const length = dataView.byteLength - (offset - dataView.byteOffset);
	return (length > 0) ? decodeText(new DataView(dataView.buffer, offset, length), { encoding: UTF_8 }) : '';
};
