import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:202x - 12.2.8 Audio rendering indication box
 *
 * @public
 */
export type AudioRenderingIndicationBox = FullBox & {
	type: 'ardi';
	audioRenderingIndication: number;
};
