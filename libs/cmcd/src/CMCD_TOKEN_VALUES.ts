import { CmcdEventType } from './CmcdEventType.ts'
import { CmcdObjectType } from './CmcdObjectType.ts'
import { CmcdPlayerState } from './CmcdPlayerState.ts'
import { CmcdStreamingFormat } from './CmcdStreamingFormat.ts'
import { CmcdStreamType } from './CmcdStreamType.ts'

/**
 * Maps token keys to their valid values.
 *
 * @internal
 */
export const CMCD_TOKEN_VALUES: Record<string, readonly string[]> = {
	e: Object.values(CmcdEventType),
	ot: Object.values(CmcdObjectType),
	sf: Object.values(CmcdStreamingFormat),
	st: Object.values(CmcdStreamType),
	sta: Object.values(CmcdPlayerState),
}
