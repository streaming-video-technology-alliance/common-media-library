import type { CmcdHeaderMap } from './CmcdHeaderMap.ts'
import type { CmcdReportConfig } from './CmcdReportConfig.ts'
import type { CmcdRequestReportTransform } from './CmcdRequestReportTransform.ts'
import type { CmcdTransmissionMode } from './CmcdTransmissionMode.ts'

/**
 * Configuration for a CMCD request report.
 *
 * @public
 */
export type CmcdRequestReportConfig = CmcdReportConfig & {
	/**
	 * The transmission mode to use.
	 *
	 * @defaultValue `CmcdTransmissionMode.QUERY`
	 */
	transmissionMode?: CmcdTransmissionMode;

	/**
	 * A map of CMCD header fields to the custom keys that should be
	 * emitted in them when the transmission mode is
	 * `CmcdTransmissionMode.HEADERS`. Custom keys not listed in any
	 * shard are emitted in the `CMCD-Request` header. Standard keys
	 * have fixed shards per the CMCD specification and cannot be
	 * re-routed. Has no effect in query transmission mode or on event
	 * reports.
	 *
	 * @defaultValue `undefined`
	 */
	customHeaderMap?: Partial<CmcdHeaderMap>;

	/**
	 * Transform applied to each request-mode report before encoding.
	 * Return the data to continue, or `null` to skip CMCD decoration
	 * for that request.
	 *
	 * Applies only to reports created by
	 * {@link CmcdReporter.createRequestReport}. To transform event
	 * reports, set `transform` on the event target instead.
	 *
	 * @defaultValue `undefined`
	 *
	 * @example
	 * {@includeCode ../test/CmcdReporter.test.ts#example-transform}
	 */
	transform?: CmcdRequestReportTransform;
}
