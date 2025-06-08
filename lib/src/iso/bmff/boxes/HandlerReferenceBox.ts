import type { FullBox } from './FullBox.js';

/**
 * ISO/IEC 14496-12:2012 - 8.4.3 Handler Reference Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type HandlerReferenceBox = FullBox & {
	type: 'hdlr';
	preDefined: number;
	handlerType: string;
	reserved: number[];
	name: string;
};
