import type { FullBox } from './FullBox.js';

/**
 * Video Media Header Box - 'vmhd'
 */
export type VideoMediaHeaderBox = FullBox & {
	type: 'vmhd';
	graphicsmode: number;
	opcolor: number[];
};
