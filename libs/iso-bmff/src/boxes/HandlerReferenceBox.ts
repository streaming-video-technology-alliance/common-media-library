import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.4.3 Handler Reference Box
 *
 * @public
 */
export type HandlerReferenceBox = FullBox & {
	type: 'hdlr';
	preDefined: number;
	handlerType: string;
	reserved: number[];
	name: string;
};
