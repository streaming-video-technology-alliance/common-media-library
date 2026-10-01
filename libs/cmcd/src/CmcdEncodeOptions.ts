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
	 * A map of CMCD keys to custom formatters. A formatter replaces the value rule of its key.
	 * The encoder does not apply the type, length, and token rules of the key to the output.
	 * The encoder still applies these rules to the output:
	 *
	 * - It drops an empty value. An empty value is `undefined`, `null`, an empty string, an empty array, or a number that is not finite.
	 * - It drops a default value, with or without parameters. The default value is `false`, or `1` for `pr`. The exceptions are `pr` on a `pr` event and `bg` on a `b` event.
	 * - It wraps a string for `e`, `ot`, `sf`, `st`, and `sta` in `SfToken`.
	 * - It replaces a `ts` that is not a finite number with the current time.
	 *
	 * The encoder does not call a formatter for an empty value, for `false`, or for `v`. It also skips the formatter of a key that it does not send. The formatters of `ot` and `e` still run when a rule needs their value.
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
	 * If `baseUrl` is not a valid URL, the encoder ignores it.
	 */
	baseUrl?: string;

	/**
	 * Array of event names to filter.
	 */
	events?: string[];
};
