import type { AdaptationSet } from '../../../../types/mapper/dash/AdaptationSet.ts'
import { getContentType } from './getContentType.ts'

/**
 * @internal
 */
export function getGroup(adaptationSet: AdaptationSet): string {
	return adaptationSet.$.group ?? getContentType(adaptationSet)
}
