import type { CmcdEvent } from './CmcdEvent.ts'

/**
 * The CMCD data that a player keeps as its state.
 *
 * `CmcdSessionConfig.snapshot` returns this type for the `t` reports.
 * The player can pass the same object with each call.
 * The type rejects the keys that the session writes.
 * It also rejects the keys of one occurrence, such as a stall or an error.
 *
 * @public
 */
export type CmcdSnapshot = Omit<
	CmcdEvent,
	'bs' | 'bsd' | 'cen' | 'e' | 'ec' | 'sid' | 'sn' | 'ts' | 'v'
> & {
	/**
	 * `bs` reports a stall. Pass it once, in the data of a call at the stall.
	 */
	bs?: never

	/**
	 * `bsd` reports the duration of a stall. Pass it once, in the data of a call after the stall.
	 */
	bsd?: never

	/**
	 * CTA-5004-B allows `cen` only on `ce` events.
	 */
	cen?: never

	/**
	 * The session writes `e`.
	 */
	e?: never

	/**
	 * Pass error codes to `recordError()`.
	 */
	ec?: never

	/**
	 * The session writes `sid`.
	 */
	sid?: never

	/**
	 * The session writes `sn`.
	 */
	sn?: never

	/**
	 * The session writes the time of each `t` report.
	 */
	ts?: never

	/**
	 * The session writes `v`.
	 */
	v?: never
}
