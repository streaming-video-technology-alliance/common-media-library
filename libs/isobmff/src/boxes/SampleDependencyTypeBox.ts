import type { FullBox } from './FullBox.js';

/**
 * ISO/IEC 14496-12:2012 - 8.6.4.1 Sample Dependency Type box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SampleDependencyTypeBox = FullBox & {
	type: 'sdtp';
	sampleDependencyTable: number[];
};
