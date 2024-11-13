import type { CursorView } from '../CursorView.js';
import type { FullBox } from '../FullBox.js';

export type EventMessageBox = FullBox & {
	schemeIdUri: string,
	value: string,
	timescale: number,
	presentationTime: number,
	presentationTimeDelta: number,
	eventDuration: number,
	id: number,
	messageData: Uint8Array,
}

// ISO/IEC 23009-1:2014 - 5.10.3.3 Event Message Box
export function emsg(view: CursorView): EventMessageBox {
	const { readUint, readString, readData } = view;

	const result = { ...view.readFullBox() } as EventMessageBox;

	if (result.version == 1) {
		result.timescale = readUint(4);
		result.presentationTime = readUint(8);
		result.eventDuration = readUint(4);
		result.id = readUint(4);
		result.schemeIdUri = readString(-1);
		result.value = readString(-1);
	}
	else {
		result.schemeIdUri = readString(-1);
		result.value = readString(-1);
		result.timescale = readUint(4);
		result.presentationTimeDelta = readUint(4);
		result.eventDuration = readUint(4);
		result.id = readUint(4);
	}

	result.messageData = readData(-1);

	return result;
}
