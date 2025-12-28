import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.6.4.1 Sample Dependency Type box
 *
 * @public
 */
export type SampleDependencyTypeBox = FullBox & {
	type: 'sdtp';
	sampleDependencyTable: number[];
};

/**
 * @public
 */
export type sdtp = SampleDependencyTypeBox;
