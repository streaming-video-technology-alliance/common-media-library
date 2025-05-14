import type { AdaptationSet } from '../../../../types/mapper/dash/AdaptationSet';
import { getContentType } from './getContentType.ts';

export function getGroup(adaptationSet: AdaptationSet): string {
	return adaptationSet.$.group ?? getContentType(adaptationSet);
}
