import type { FullBox } from './FullBox.js';

/**
 * Handler Reference Box - 'hdlr'
 */
export type HandlerReferenceBox = FullBox & {
	type: 'hdlr';
	handlerType: string;
	name: string;
};
