import type { FullBox } from './FullBox.js';

/**
 * Sample Dependency Type Box - 'sdtp'
 */
export type SampleDependencyTypeBox = FullBox & {
	type: 'sdtp';
	sampleDependencyType: number[];
};
