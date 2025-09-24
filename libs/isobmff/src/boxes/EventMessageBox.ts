import type { FullBox } from './FullBox.js';

/**
 * ISO/IEC 23009-1:2014 - 5.10.3.3 Event Message Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type EventMessageBox = FullBox & {
	type: 'emsg';
	schemeIdUri: string,
	value: string,
	timescale: number,
	presentationTime: number,
	presentationTimeDelta: number,
	eventDuration: number,
	id: number,
	messageData: Uint8Array,
};
