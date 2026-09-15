import type { CmcdFormatterMap } from './CmcdFormatterMap.ts'
import type { CmcdHeaderMap } from './CmcdHeaderMap.ts'
import type { CmcdKey } from './CmcdKey.ts'
import type { CmcdReportingMode } from './CmcdReportingMode.ts'
import type { CmcdVersion } from './CmcdVersion.ts'

/**
 * Options for encoding CMCD values.
 *
 * @public
 */
export type CmcdEncodeOptions = {
	/**
	 * The version of the CMCD specification to use. If omitted, the version
	 * is inferred from the data's `v` key, defaulting to `CMCD_V2`.
	 *
	 * @defaultValue `CMCD_V2`
	 */
	version?: CmcdVersion;

	/**
	 * The reporting mode to use.
	 *
	 * @defaultValue `CmcdReportingMode.REQUEST`
	 */
	reportingMode?: CmcdReportingMode;

	/**
	 * A map of CMCD keys to custom formatters.
	 */
	formatters?: Partial<CmcdFormatterMap>;

	/**
	 * A map of CMCD header fields to custom CMCD keys.
	 */
	customHeaderMap?: Partial<CmcdHeaderMap>;

	/**
	 * A filter function for CMCD keys.
	 *
	 * @param key - The CMCD key to filter.
	 *
	 * @returns `true` if the key should be included, `false` otherwise.
	 */
	filter?: (key: CmcdKey) => boolean;

	/**
	 * Base URL (typically the manifest or current request URL) used to convert absolute `nor` values
	 * into paths relative to this base, per the CMCD specification. This option does not modify values
	 * that are already relative paths, but CMCD version 1 still URL-encodes them on emission. If omitted,
	 * `nor` values are emitted unchanged (subject to the version 1 URL-encoding rule).
	 */
	baseUrl?: string;

	/**
	 * Array of event names to filter.
	 */
	events?: string[];
};
