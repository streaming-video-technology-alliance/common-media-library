import { uuid } from '@svta/cml-utils'
import { CMCD_DEFAULT_TIME_INTERVAL } from './CMCD_DEFAULT_TIME_INTERVAL.ts'
import { CMCD_V2 } from './CMCD_V2.ts'
import type { CmcdEncodeOptions } from './CmcdEncodeOptions.ts'
import type { CmcdEventReportConfig } from './CmcdEventReportConfig.ts'
import type { CmcdEventType } from './CmcdEventType.ts'
import type { CmcdKey } from './CmcdKey.ts'
import type { CmcdReportConfig } from './CmcdReportConfig.ts'
import type { CmcdReporterConfig } from './CmcdReporterConfig.ts'
import type { CmcdReportingMode } from './CmcdReportingMode.ts'
import type { CmcdRequestReportConfig } from './CmcdRequestReportConfig.ts'
import { CMCD_QUERY } from './CmcdTransmissionMode.ts'
import type { CmcdVersion } from './CmcdVersion.ts'

export type CmcdReportConfigNormalized = CmcdReportConfig & {
	version: CmcdVersion;
}

export type CmcdEventReportConfigNormalized<C> = CmcdEventReportConfig<C> & CmcdReportConfigNormalized & {
	events: CmcdEventType[];
	interval: number;
	batchSize: number;
}

export type CmcdReporterConfigNormalized<C> = CmcdReporterConfig<C> & CmcdReportConfigNormalized & {
	sid: string;
	eventTargets: CmcdEventReportConfigNormalized<C>[];
	sessionRetention: number;
}

export function createEncodingOptions(reportingMode: CmcdReportingMode, config: CmcdReportConfig & Pick<CmcdRequestReportConfig, 'customHeaderMap'>, baseUrl?: string): CmcdEncodeOptions {
	const enabledKeySet = new Set(config.enabledKeys ?? [])

	return {
		version: config.version || CMCD_V2,
		reportingMode,
		filter: (key: CmcdKey) => enabledKeySet.has(key),
		baseUrl,
		customHeaderMap: config.customHeaderMap,
	}
}

export function createCmcdReporterConfig<C>(config: Partial<CmcdReporterConfig<C>>): CmcdReporterConfigNormalized<C> {
	// Apply top-level config defaults
	const {
		version = CMCD_V2,
		eventTargets = [],
		sid = uuid(),
		transmissionMode = CMCD_QUERY,
		...rest
	} = config

	// Type-checked, never type-coerced: a numeric string or boolean falls
	// back to the default instead of converting, and a Symbol must not
	// throw under Math.floor's ToNumber.
	const retention = config.sessionRetention
	const sessionRetention = typeof retention === 'number' ? Math.floor(retention) : NaN

	return {
		...rest,
		version,
		transmissionMode,
		sid,
		sessionRetention: sessionRetention >= 0 ? sessionRetention : 2,
		// Apply target config defaults
		eventTargets: eventTargets.reduce((acc, target) => {
			if (target?.url && target.events?.length) {
				acc.push({
					version: target.version || CMCD_V2,
					enabledKeys: target.enabledKeys?.slice() || [],
					url: target.url,
					events: target.events.slice(),
					interval: target.interval ?? CMCD_DEFAULT_TIME_INTERVAL,
					batchSize: target.batchSize || 1,
					transform: target.transform,
				})
			}
			return acc
		}, [] as CmcdEventReportConfigNormalized<C>[]),
	}
}
