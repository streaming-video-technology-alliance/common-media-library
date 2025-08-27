import { decodeText } from '../../../utils/decodeText.js';
import { UTF_8 } from '../../../utils/UTF_8.js';

export function readUtf8TerminatedString(dataView: DataView<ArrayBuffer>, offset: number): string {
	const length = dataView.byteLength - (offset - dataView.byteOffset);

	let data = '';

	if (length > 0) {
		const view = new DataView(dataView.buffer, offset, length);

		let l = 0;

		for (; l < length; l++) {
			if (view.getUint8(l) === 0) {
				break;
			}
		}

		// remap the Dataview with the actual length
		data = decodeText(new DataView(dataView.buffer, offset, l), { encoding: UTF_8 });
	}

	return data;
};
