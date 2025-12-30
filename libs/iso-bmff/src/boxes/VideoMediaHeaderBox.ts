import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.4.5.2 Video Media Header Box
 *
 * @public
 */
export type VideoMediaHeaderBox = FullBox & {
	type: 'vmhd';
	graphicsmode: number;
	opcolor: number[];
};
