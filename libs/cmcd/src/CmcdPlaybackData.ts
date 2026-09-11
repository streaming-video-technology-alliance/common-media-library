import type { CmcdCustomValue } from './CmcdCustomValue.ts'
import type { CmcdMetric } from './CmcdMetric.ts'
import type { CmcdNextObject } from './CmcdNextObject.ts'
import type { CmcdObjectType } from './CmcdObjectType.ts'
import type { CmcdPlayerState } from './CmcdPlayerState.ts'
import type { CmcdStreamType } from './CmcdStreamType.ts'
import type { CmcdStreamingFormat } from './CmcdStreamingFormat.ts'

/**
 * The playback data a player gives to a `CmcdSessionReporter`. Every member is optional.
 * Values are plain: numbers in the spec's units, booleans, and tokens as strings.
 * The reporter rounds and encodes them. `ts` is the time of the transition and is not stored.
 * `ec` is not a member. Errors go through `recordError()`.
 *
 * @public
 */
export type CmcdPlaybackData = {
	readonly [key: `${string}-${string}`]: CmcdCustomValue | undefined
	readonly ab?: CmcdMetric
	readonly bg?: boolean
	readonly bl?: CmcdMetric
	readonly br?: CmcdMetric
	readonly bs?: boolean
	readonly bsa?: CmcdMetric
	readonly bsd?: CmcdMetric
	readonly bsda?: CmcdMetric
	readonly cid?: string
	readonly cs?: string
	readonly d?: number
	readonly dfa?: number
	readonly dl?: number
	readonly h?: string
	readonly lab?: CmcdMetric
	readonly lb?: CmcdMetric
	readonly ltc?: number
	readonly msd?: number
	readonly mtp?: CmcdMetric
	readonly nor?: CmcdNextObject | readonly CmcdNextObject[]
	readonly nr?: boolean
	readonly ot?: CmcdObjectType
	readonly pb?: CmcdMetric
	readonly pr?: number
	readonly pt?: number
	readonly rtp?: number
	readonly sf?: CmcdStreamingFormat
	readonly st?: CmcdStreamType
	readonly sta?: CmcdPlayerState
	readonly su?: boolean
	readonly tab?: CmcdMetric
	readonly tb?: CmcdMetric
	readonly tbl?: CmcdMetric
	readonly tpb?: CmcdMetric
	readonly ts?: number
}
