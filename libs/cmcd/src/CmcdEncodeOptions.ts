import type { CmcdFormatterMap } from './CmcdFormatterMap.ts'
import type { CmcdHeaderMap } from './CmcdHeaderMap.ts'
import type { CmcdKey } from './CmcdKey.ts'
import type { CmcdReportingMode } from './CmcdReportingMode.ts'

/**
 * Options for encoding CMCD values.
 *
 *
 * @beta
 */
export type CmcdEncodeOptions = {
	/**
	 * The version of the CMCD specification to use.
	 *
	 * @defaultValue `1`
	 */
	version?: number;

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
	 * The base URL to use for relative URLs.
	 */
	baseUrl?: string;
};
