import type { FullBox } from './FullBox.js';

/**
 * Event Message Box - 'emsg'
 */
export type EventMessageBox = FullBox & {
	type: 'emsg';
	schemeIdUri: string;
	value: string;
	timescale: number;
	presentationTimeDelta?: number;
	presentationTime?: number;
	eventDuration: number;
	id: number;
	messageData: Uint8Array;
};
