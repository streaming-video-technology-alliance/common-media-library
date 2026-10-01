import type { CmcdVersion } from './CmcdVersion.ts'

/**
 * The rules of a key that apply to every value type.
 *
 * @internal
 */
type CmcdKeyRules = {
	/**
	 * The only reporting mode that has the key. Without it, both modes have the key.
	 */
	readonly mode?: 'event';

	/**
	 * The only CMCD version that has the key. Without it, both versions have the key.
	 */
	readonly version?: CmcdVersion;

	/**
	 * The only event type on which the encoder sends the key.
	 */
	readonly onlyOn?: string;

	/**
	 * `'always'`, or the event type that requires the key. The key filter does not remove a required key.
	 */
	readonly requiredOn?: string;
};

/**
 * One row of the key table. `type` selects the value rule of `normalizeValue`.
 *
 * - `round` is the rounding step of a number.
 * - `ot` lists the object types for which version 2 allows the key.
 * - `supersededBy` is the exact bitrate key that removes an aggregate key.
 * - `omitDefault` is the default value. The encoder omits it, except on the event that requires the key.
 * - `max` is the maximum string length. `v1Max` replaces it in version 1.
 * - `tokens` lists the valid tokens. `v1Map` maps a token that version 1 does not have to a version 1 token.
 *
 * @internal
 */
export type CmcdKeySpec = CmcdKeyRules & (
	| { readonly type: 'boolean'; readonly omitDefault: false; }
	| { readonly type: 'integer'; readonly round: number; readonly ot?: readonly string[]; }
	| { readonly type: 'decimal'; readonly omitDefault?: number; }
	| { readonly type: 'string'; readonly max?: number; readonly v1Max?: number; }
	| { readonly type: 'token'; readonly tokens: readonly string[]; readonly v1Map?: Readonly<Record<string, string>>; }
	| { readonly type: 'string-list'; }
	| { readonly type: 'ot-list'; readonly round: number; readonly ot?: readonly string[]; readonly supersededBy?: string; }
	| { readonly type: 'nor'; }
	| { readonly type: 'custom'; readonly omitDefault: false; readonly max: number; readonly v1Max: number; }
);
