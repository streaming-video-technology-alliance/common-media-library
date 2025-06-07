import type { FullBox } from './FullBox.js';

/**
 * Media Header Box - 'mdhd'
 */
export type MediaHeaderBox = FullBox & {
	type: 'mdhd';
	creationTime: number;
	modificationTime: number;
	timescale: number;
	duration: number;
	language: string;
};
