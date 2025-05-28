import type { AdaptationSet } from '../../../../types/mapper/dash/AdaptationSet.js';
import { getContentType } from './getContentType.js';

export function getGroup(adaptationSet: AdaptationSet): string {
	return adaptationSet.$.group ?? getContentType(adaptationSet);
}
