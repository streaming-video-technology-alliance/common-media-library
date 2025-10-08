import type { FullBox } from './FullBox.js';

/**
 * ISO/IEC 14496-12:2012 - 8.12.5 Scheme Type Box
 *
 *
 * @beta
 */
export type SchemeTypeBox = FullBox & {
	type: 'schm';
	schemeType: number;
	schemeVersion: number;
	schemeUri?: string;
};
