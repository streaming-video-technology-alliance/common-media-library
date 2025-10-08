import type { FullBox } from './FullBox.js';

/**
 * ISO/IEC 14496-12:202x - 12.2.8 Audio rendering indication box
 *
 *
 * @beta
 */
export type AudioRenderingIndicationBox = FullBox & {
	type: 'ardi';
	audioRenderingIndication: number;
};
