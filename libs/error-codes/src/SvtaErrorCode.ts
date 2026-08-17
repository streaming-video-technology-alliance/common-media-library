import type { SvtaAccessibilityErrorCode } from './SvtaAccessibilityErrorCode.ts'
import type { SvtaAdvertisingErrorCode } from './SvtaAdvertisingErrorCode.ts'
import type { SvtaContentProtectionErrorCode } from './SvtaContentProtectionErrorCode.ts'
import type { SvtaCustomErrorCode } from './SvtaCustomErrorCode.ts'
import type { SvtaMediaContentErrorCode } from './SvtaMediaContentErrorCode.ts'
import type { SvtaNetworkErrorCode } from './SvtaNetworkErrorCode.ts'
import type { SvtaPlaybackErrorCode } from './SvtaPlaybackErrorCode.ts'
import type { SvtaRemotePlayErrorCode } from './SvtaRemotePlayErrorCode.ts'
import type { SvtaUnknownErrorCode } from './SvtaUnknownErrorCode.ts'

/**
 * Union of every named SVTA standardized error code.
 *
 * Note that spec-valid codes exist outside this union: HTTP response
 * status codes embed into the Network category (3100-3599) and
 * Publisher-defined codes occupy the Custom category (99001-99999), so
 * APIs accepting open-ended SVTA error codes should accept `number`.
 *
 * @public
 */
export type SvtaErrorCode =
	| SvtaAccessibilityErrorCode
	| SvtaAdvertisingErrorCode
	| SvtaContentProtectionErrorCode
	| SvtaCustomErrorCode
	| SvtaMediaContentErrorCode
	| SvtaNetworkErrorCode
	| SvtaPlaybackErrorCode
	| SvtaRemotePlayErrorCode
	| SvtaUnknownErrorCode
